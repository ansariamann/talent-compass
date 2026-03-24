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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import type { Application, Candidate, Client } from "@/types/ats";

const createSchema = z.object({
  candidateId: z.string().min(1, "Please select a candidate"),
  clientId: z.string().min(1, "Please select a client"),
  jobTitle: z.string().trim().min(1, "Please enter a job title"),
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

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      candidateId: "",
      clientId: "",
      jobTitle: "",
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
        jobTitle: "",
      });
    }
  }, [application, clients, createForm, currentClientId, editForm, isEditing, open]);

  const selectedClientId = createForm.watch("clientId");
  const selectedCandidateId = createForm.watch("candidateId");

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedCandidateId),
    [candidates, selectedCandidateId]
  );

  const handleCreate = async (values: CreateFormValues) => {
    await onSubmit({
      candidateId: values.candidateId,
      clientId: values.clientId,
      jobTitle: values.jobTitle.trim(),
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
                    <Popover open={candidatePickerOpen} onOpenChange={setCandidatePickerOpen}>
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
                        <Command>
                          <CommandInput placeholder="Search candidate by name or email..." />
                          <CommandList>
                            <CommandEmpty>No candidate found.</CommandEmpty>
                            <CommandGroup>
                              {candidates.map((candidate) => (
                                <CommandItem
                                  key={candidate.id}
                                  value={`${candidate.name} ${candidate.email}`}
                                  onSelect={() => {
                                    field.onChange(candidate.id);
                                    setCandidatePickerOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      candidate.id === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex min-w-0 flex-col">
                                    <span className="truncate">{candidate.name}</span>
                                    {candidate.email && (
                                      <span className="truncate text-xs text-muted-foreground">
                                        {candidate.email}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
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
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Senior Accountant"
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
