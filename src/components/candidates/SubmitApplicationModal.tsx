import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Users, Briefcase, FileText, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useClients } from '@/hooks/useClients';
import { useJobs } from '@/hooks/useJobs';
import { useCreateApplication } from '@/hooks/useApplications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Candidate, Job } from '@/types/ats';

const formSchema = z.object({
  clientId: z.string().min(1, 'Please select a client'),
  jobId: z.string().min(1, 'Please select a job'),
  submissionNote: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SubmitApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: Candidate[];
  onSuccess: () => void;
}

type SubmissionResult = {
  candidateId: string;
  candidateName: string;
  status: 'success' | 'error';
  error?: string;
};

export function SubmitApplicationModal({
  open,
  onOpenChange,
  candidates,
  onSuccess,
}: SubmitApplicationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<SubmissionResult[] | null>(null);
  const { user } = useAuth();
  const isClientScopedUser = user?.role === 'client_admin' || user?.role === 'client_user';
  const currentClientId = isClientScopedUser ? user?.client_id : undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: currentClientId || '',
      jobId: '',
      submissionNote: '',
    },
  });
  const selectedClientId = form.watch('clientId');
  const selectedJobId = form.watch('jobId');
  const jobFilters = useMemo(
    () => (selectedClientId ? { clientId: selectedClientId } : {}),
    [selectedClientId]
  );

  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: jobsResponse, isLoading: jobsLoading } = useJobs(jobFilters, 1, 500);
  const createApplication = useCreateApplication();
  const scopedClients = currentClientId ? clients.filter((client) => client.id === currentClientId) : clients;
  const jobs = jobsResponse?.data || [];

  useEffect(() => {
    if (currentClientId) {
      form.setValue('clientId', currentClientId);
    }
  }, [currentClientId, form]);

  useEffect(() => {
    if (!open || currentClientId) {
      return;
    }

    const currentValue = form.getValues('clientId');
    if (currentValue) {
      return;
    }

    if (scopedClients.length === 0) {
      return;
    }

    form.setValue('clientId', scopedClients[0].id, { shouldValidate: true });
  }, [open, currentClientId, form, scopedClients]);
  const selectedClient = scopedClients.find(c => c.id === selectedClientId);
  const eligibleCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.currentStatus !== 'selected'),
    [candidates]
  );
  const ineligibleCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.currentStatus === 'selected'),
    [candidates]
  );
  const availableJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          Boolean(selectedClientId) &&
          job.vacant !== false &&
          job.clientId === selectedClientId &&
          (!currentClientId || job.clientId === currentClientId)
      ),
    [jobs, selectedClientId, currentClientId]
  );

  useEffect(() => {
    if (!selectedJobId || availableJobs.some((job) => job.id === selectedJobId)) {
      return;
    }
    form.setValue('jobId', '');
  }, [availableJobs, form, selectedJobId]);

  const handleSubmit = async (values: FormValues) => {
    if (eligibleCandidates.length === 0) {
      toast.error('No eligible candidates selected for application creation.');
      return;
    }

    setIsSubmitting(true);
    const submissionResults: SubmissionResult[] = [];

    for (const candidate of eligibleCandidates) {
      try {
        const selectedJob = availableJobs.find((job) => job.id === values.jobId);
        await createApplication.mutateAsync({
          candidateId: candidate.id,
          clientId: currentClientId || values.clientId,
          jobId: values.jobId,
          jobTitle: selectedJob?.title,
          note: values.submissionNote?.trim() || undefined,
        });
        submissionResults.push({
          candidateId: candidate.id,
          candidateName: candidate.name,
          status: 'success',
        });
      } catch (err) {
        submissionResults.push({
          candidateId: candidate.id,
          candidateName: candidate.name,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    setIsSubmitting(false);
    setResults(submissionResults);

    const successCount = submissionResults.filter(r => r.status === 'success').length;
    const errorCount = submissionResults.filter(r => r.status === 'error').length;

    if (successCount > 0) {
      toast.success(
        `Submitted ${successCount} candidate${successCount > 1 ? 's' : ''} to ${selectedClient?.name}${errorCount > 0 ? ` (${errorCount} failed)` : ''}${ineligibleCandidates.length > 0 ? ` (${ineligibleCandidates.length} skipped)` : ''}`
      );
    } else {
      toast.error('All submissions failed. Please try again.');
    }

    if (successCount > 0) {
      onSuccess();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setResults(null);
      form.reset();
      onOpenChange(false);
    }
  };

  const handleDone = () => {
    setResults(null);
    form.reset();
    onSuccess();
    onOpenChange(false);
  };

  // Results view
  if (results) {
    const successCount = results.filter(r => r.status === 'success').length;
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Submission Complete
            </DialogTitle>
            <DialogDescription>
              {successCount} of {results.length} candidate{results.length > 1 ? 's' : ''} submitted to {selectedClient?.name}.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-64">
            <div className="space-y-2 pr-2">
              {results.map(result => (
                <div
                  key={result.candidateId}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <span className="text-sm font-medium">{result.candidateName}</span>
                  {result.status === 'success' ? (
                    <Badge variant="outline" className="text-xs border-status-success/50 text-status-success">
                      Submitted
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      Failed
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button onClick={handleDone} className="w-full">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Submit Candidates to Client
          </DialogTitle>
          <DialogDescription>
            Create applications for the selected candidates.
          </DialogDescription>
        </DialogHeader>

        {/* Selected candidates preview */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {candidates.length} candidate{candidates.length > 1 ? 's' : ''} selected
            </span>
          </div>
          {ineligibleCandidates.length > 0 && (
            <p className="mb-2 text-xs text-amber-700">
              {ineligibleCandidates.length} candidate{ineligibleCandidates.length > 1 ? 's are' : ' is'} already in selected status and will be skipped.
            </p>
          )}
          <ScrollArea className="max-h-28">
            <div className="flex flex-wrap gap-1.5 pr-2">
              {candidates.map(c => (
                <Badge key={c.id} variant="secondary" className="text-xs">
                  {c.name}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Client selector */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Client
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={clientsLoading}>
                        <SelectValue placeholder={clientsLoading ? 'Loading clients...' : 'Select a client'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {scopedClients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${client.isActive ? 'bg-status-success' : 'bg-muted-foreground'}`} />
                              {client.name}
                              <span className="text-xs text-muted-foreground">— {client.industry}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job title */}
            <FormField
              control={form.control}
              name="jobId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Job Opening
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId}>
                    <FormControl>
                      <SelectTrigger disabled={jobsLoading || !selectedClientId}>
                          <SelectValue placeholder={
                          !selectedClientId
                            ? 'Select a client first'
                            : jobsLoading
                            ? 'Loading jobs...'
                            : 'Select a job opening'
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableJobs.length > 0 ? (
                        availableJobs.map(job => (
                          <SelectItem key={job.id} value={job.id}>
                            <div className="flex items-center gap-2">
                              {job.title}
                              <span className="text-xs text-muted-foreground">— {job.location}</span>
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

            {/* Submission note */}
            <FormField
              control={form.control}
              name="submissionNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Submission Note
                    <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why are these candidates a great fit? Any context for the client..."
                      className="resize-none min-h-[90px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || eligibleCandidates.length === 0} className="gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit {eligibleCandidates.length} Candidate{eligibleCandidates.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

