import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { candidatesApi } from "@/lib/api";
import type { Candidate } from "@/types/ats";
import { useClients } from "@/hooks/useClients";
import { useJobs } from "@/hooks/useJobs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  candidate_id: z.string().min(1, "Please select a candidate"),
  interview_date: z.string().min(1, "Interview date is required"),
  company_id: z.string().min(1, "Please select a company"),
  job_id: z.string().min(1, "Please select a vacant job"),
  skills: z.string().optional(),
  notes: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignExistingInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
}

export function AssignExistingInterviewDialog({
  open,
  onOpenChange,
  onSuccess,
}: AssignExistingInterviewDialogProps) {
  const { data: clients = [] } = useClients();
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidate_id: "",
      interview_date: new Date().toISOString().slice(0, 16),
      company_id: "",
      job_id: "",
      skills: "",
      notes: "",
      rating: undefined,
    },
  });

  useEffect(() => {
    if (!open) return;
    const trimmedQuery = candidateQuery.trim();
    if (!trimmedQuery) {
      setCandidates([]);
      setIsLoadingCandidates(false);
      return;
    }
    let cancelled = false;
    const loadCandidates = async () => {
      setIsLoadingCandidates(true);
      try {
        const response = await candidatesApi.list(
          {
            search: trimmedQuery,
            status: ["new"],
          },
          1,
          20
        );
        if (!cancelled) setCandidates(response.data);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Failed to load candidates");
        }
      } finally {
        if (!cancelled) setIsLoadingCandidates(false);
      }
    };
    loadCandidates();
    return () => {
      cancelled = true;
    };
  }, [candidateQuery, open]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === form.watch("candidate_id")) || null,
    [candidates, form]
  );
  const selectedCompanyId = form.watch("company_id");
  const selectedJobId = form.watch("job_id");
  const jobFilters = useMemo(
    () => (selectedCompanyId ? { clientId: selectedCompanyId } : {}),
    [selectedCompanyId]
  );
  const { data: jobsResponse, isLoading: jobsLoading } = useJobs(jobFilters, 1, 500);
  const availableJobs = useMemo(
    () =>
      (jobsResponse?.data || []).filter(
        (job) => job.clientId === selectedCompanyId && job.vacant !== false
      ),
    [jobsResponse, selectedCompanyId]
  );

  useEffect(() => {
    if (!selectedJobId || availableJobs.some((job) => job.id === selectedJobId)) {
      return;
    }
    form.setValue("job_id", "");
  }, [availableJobs, form, selectedJobId]);

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await candidatesApi.recordDirectInterview(data.candidate_id, {
        interviewDate: new Date(data.interview_date).toISOString(),
        companyId: data.company_id,
        jobId: data.job_id,
        skills: (data.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean),
        notes: data.notes || undefined,
        rating: data.rating ?? undefined,
      });
      toast.success("Interview assigned successfully");
      form.reset();
      setCandidateQuery("");
      onOpenChange(false);
      await onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Existing Candidate Interview</DialogTitle>
          <DialogDescription>
            Pick an active candidate and assign a direct interview with the required interview details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Search Candidate</FormLabel>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={candidateQuery}
                  onChange={(e) => setCandidateQuery(e.target.value)}
                  placeholder="Search by name, email, company or skill"
                  className="pl-9"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="candidate_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Candidate</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            candidateQuery.trim().length === 0
                              ? "Search for a candidate first"
                              : isLoadingCandidates
                              ? "Loading candidates..."
                              : "Select candidate"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {candidates.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.name} {candidate.email ? `(${candidate.email})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedCandidate && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <div className="font-medium">{selectedCandidate.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {[selectedCandidate.email, selectedCandidate.company, selectedCandidate.location]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                    {selectedCandidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.skills.slice(0, 6).map((skill) => (
                          <Badge key={`${selectedCandidate.id}-${skill}`} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="interview_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
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
                control={form.control}
                name="job_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Opening</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting || !selectedCompanyId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedCompanyId
                                ? "Select a company first"
                                : jobsLoading
                                ? "Loading vacant jobs..."
                                : "Select a vacant job"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableJobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Comma-separated skills"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Interview context, panel notes, expectations..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign Interview
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
