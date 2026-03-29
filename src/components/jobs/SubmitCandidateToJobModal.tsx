import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Briefcase, FileText, CheckCircle2, UserPlus, Search } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateApplication } from '@/hooks/useApplications';
import { useCandidates } from '@/hooks/useCandidates';
import { toast } from 'sonner';
import type { Job } from '@/types/ats';

const formSchema = z.object({
  submissionNote: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SubmitCandidateToJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onSuccess: () => void;
}

type SubmissionResult = {
  candidateId: string;
  candidateName: string;
  status: 'success' | 'error';
  error?: string;
};

export function SubmitCandidateToJobModal({
  open,
  onOpenChange,
  job,
  onSuccess,
}: SubmitCandidateToJobModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<SubmissionResult[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());

  // Fetch candidates (could be improved with infinite scroll or command palette, using top 100 for now)
  const { data: candidatesResponse, isLoading: candidatesLoading } = useCandidates(
    { search: searchQuery, excludeBlacklisted: true, excludeLeavers: true },
    1,
    100
  );

  const candidates = candidatesResponse?.data || [];

  const createApplication = useCreateApplication();

    // Fix dependency cycle issue where "form" might be redefined on each render implicitly
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      submissionNote: '',
    },
  });

  const toggleCandidate = (id: string) => {
    const next = new Set(selectedCandidateIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedCandidateIds(next);
  };

  const selectedCandidates = useMemo(() => {
    return candidates.filter(c => selectedCandidateIds.has(c.id));
  }, [candidates, selectedCandidateIds]);


  const handleSubmit = async (values: FormValues) => {
    if (!job) return;
    if (job.vacant === false) {
      toast.error('This job is already filled.');
      return;
    }
    if (selectedCandidateIds.size === 0) {
      toast.error('Please select at least one candidate.');
      return;
    }

    setIsSubmitting(true);
    const submissionResults: SubmissionResult[] = [];

    for (const candidate of selectedCandidates) {
      try {
        await createApplication.mutateAsync({
          candidateId: candidate.id,
          clientId: job.clientId,
          jobId: job.id,
          jobTitle: job.title,
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
        `Submitted ${successCount} candidate${successCount > 1 ? 's' : ''} to ${job.companyName}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
      );
    } else {
      toast.error('All submissions failed. Please try again.');
    }

    if (errorCount === 0) {
      onSuccess();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setResults(null);
      setSelectedCandidateIds(new Set());
      setSearchQuery('');
      form.reset();
      onOpenChange(false);
    }
  };

  const handleDone = () => {
    setResults(null);
    setSelectedCandidateIds(new Set());
    setSearchQuery('');
    form.reset();
    onSuccess();
    onOpenChange(false);
  };

  if (!job) return null;

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
              {successCount} of {results.length} candidate{results.length > 1 ? 's' : ''} submitted for {job.title} at {job.companyName}.
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
            Submit Candidates to Job
          </DialogTitle>
          <DialogDescription>
            Select candidates to apply for <strong>{job.title}</strong> at {job.companyName}.
          </DialogDescription>
        </DialogHeader>

        {job.vacant === false && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            This job is already filled and cannot accept new candidate submissions.
          </div>
        )}

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <span className="font-semibold">{job.title}</span>
          </div>
          <div className="text-xs text-muted-foreground ml-6">
            {job.companyName} • {job.location || 'Remote'}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Select Candidates ({selectedCandidateIds.size} selected)
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search candidates by name or email..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <ScrollArea className="h-[200px] border rounded-md p-2">
                  {candidatesLoading ? (
                      <div className="flex items-center justify-center h-full">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                  ) : candidates.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                          No candidates found.
                      </div>
                  ) : (
                      <div className="space-y-1">
                          {candidates.map(candidate => (
                              <div 
                                key={candidate.id} 
                                className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                                onClick={() => toggleCandidate(candidate.id)}
                              >
                                  <Checkbox 
                                    id={`candidate-${candidate.id}`} 
                                    checked={selectedCandidateIds.has(candidate.id)}
                                    onCheckedChange={() => toggleCandidate(candidate.id)}
                                  />
                                  <label 
                                    htmlFor={`candidate-${candidate.id}`} 
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                  >
                                      {candidate.name} <span className="text-muted-foreground font-normal text-xs ml-1">{candidate.email}</span>
                                  </label>
                              </div>
                          ))}
                      </div>
                  )}
              </ScrollArea>
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
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

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedCandidateIds.size === 0 || job.vacant === false}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit {selectedCandidateIds.size} Candidate{selectedCandidateIds.size > 1 ? 's' : ''}
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
