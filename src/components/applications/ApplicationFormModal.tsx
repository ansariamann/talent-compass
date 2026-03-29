import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useJobs } from "@/hooks/useJobs";
import type { Application, Candidate, Client, Job } from "@/types/ats";

const createSchema = z.object({
  candidateId: z.string().min(1, "Please select a candidate"),
  clientId: z.string().min(1, "Please select a client"),
  jobId: z.string().min(1, "Please select a vacant job"),
});

const editSchema = z.object({
  jobTitle: z.string().trim().min(1, "Job title is required"),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

interface ApplicationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { candidateId: string; clientId: string; jobId?: string; jobTitle?: string }) => Promise<void>;
  onUpdate?: (id: string, data: { jobTitle?: string }) => Promise<void>;
  application?: Application | null;
  candidates: Candidate[];
  clients: Client[];
  currentClientId?: string;
  isLoading?: boolean;
}

export function ApplicationFormModal({
  open,
  onOpenChange,
  onSubmit,
  onUpdate,
  application,
  candidates,
  clients,
  currentClientId,
  isLoading,
}: ApplicationFormModalProps) {
  const isEditing = Boolean(application);
  const [candidatePickerOpen, setCandidatePickerOpen] = useState(false);
  const [candidateQuery, setCandidateQuery] = useState("");
  const { data: jobsResponse, isLoading: jobsLoading } = useJobs({}, 1, 500);

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      candidateId: "",
      clientId: "",
      jobId: "",
    },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      jobTitle: "",
    },
  });

  useEffect(() => {
    if (isEditing && application) {
      editForm.reset({
        jobTitle: application.jobTitle,
      });
    } else {
      createForm.reset({
        candidateId: "",
        clientId: currentClientId || clients[0]?.id || "",
        jobId: "",
      });
      setCandidateQuery("");
    }
  }, [application, clients, createForm, currentClientId, editForm, isEditing, open]);

  const selectedClientId = createForm.watch("clientId");
  const selectedCandidateId = createForm.watch("candidateId");
  const selectedJobId = createForm.watch("jobId");

  const availableCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.currentStatus !== "selected"),
    [candidates]
  );

  const availableJobs = useMemo(() => {
    const jobs = jobsResponse?.data || [];
    return jobs.filter((job) => job.vacant !== false && (!selectedClientId || job.clientId === selectedClientId));
  }, [jobsResponse, selectedClientId]);

  const selectedJob = useMemo(
    () => availableJobs.find((job) => job.id === selectedJobId),
    [availableJobs, selectedJobId]
  );

  const filteredCandidates = useMemo(() => {
    const query = candidateQuery.trim().toLowerCase();
    if (!query) return availableCandidates;

    return availableCandidates.filter((candidate) =>
      [candidate.name, candidate.email, candidate.company, candidate.location]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [availableCandidates, candidateQuery]);

  useEffect(() => {
    const nextJob = availableJobs.find((job) => job.id === selectedJobId);
    if (!selectedJobId || nextJob) {
      return;
    }
    createForm.setValue("jobId", "");
  }, [availableJobs, createForm, selectedJobId]);

  const selectedCandidate = useMemo(
    () => availableCandidates.find((candidate) => candidate.id === selectedCandidateId),
    [availableCandidates, selectedCandidateId]
  );

  const handleCreate = async (values: CreateFormValues) => {
    await onSubmit({
      candidateId: values.candidateId,
      clientId: values.clientId,
      jobId: values.jobId,
      jobTitle: selectedJob?.title,
    });
    onOpenChange(false);
  };

  const handleUpdate = async (values: EditFormValues) => {
    if (!application || !onUpdate) return;
    await onUpdate(application.id, {
      jobTitle: values.jobTitle.trim(),
    });
    onOpenChange(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      createForm.reset();
      editForm.reset({
        jobTitle: application?.jobTitle || "",
      });
      setCandidatePickerOpen(false);
      setCandidateQuery("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Application" : "Create Application"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the application details."
              : "Create a new application by selecting a candidate and client."}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Senior Software Engineer"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="candidateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate</FormLabel>
                    <Popover
                      open={candidatePickerOpen}
                      onOpenChange={(nextOpen) => {
                        setCandidatePickerOpen(nextOpen);
                        if (!nextOpen) {
                          setCandidateQuery("");
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {selectedCandidate
                              ? `${selectedCandidate.name}${selectedCandidate.email ? ` (${selectedCandidate.email})` : ""}`
                              : "Search and select a candidate"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <div className="border-b p-2">
                          <Input
                            value={candidateQuery}
                            onChange={(event) => setCandidateQuery(event.target.value)}
                            placeholder="Search candidate by name, email, company or location..."
                            autoFocus
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-1">
                          {filteredCandidates.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No candidate found.
                            </div>
                          ) : (
                            filteredCandidates.map((candidate) => (
                              <button
                                key={candidate.id}
                                type="button"
                                className="flex w-full items-center rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                onClick={() => {
                                  field.onChange(candidate.id);
                                  setCandidatePickerOpen(false);
                                  setCandidateQuery("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 shrink-0",
                                    candidate.id === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate">{candidate.name}</span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    {[candidate.email, candidate.company, candidate.location]
                                      .filter(Boolean)
                                      .join(" • ") || "No additional details"}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="jobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vacant Job</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedClientId || jobsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedClientId
                                ? "Select a client first"
                                : jobsLoading
                                ? "Loading vacant jobs..."
                                : "Select a vacant job"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableJobs.length > 0 ? (
                          availableJobs.map((job: Job) => (
                            <SelectItem key={job.id} value={job.id}>
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="truncate">{job.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {job.companyName}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-3 text-sm text-muted-foreground">
                            No vacant jobs available for this client.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
