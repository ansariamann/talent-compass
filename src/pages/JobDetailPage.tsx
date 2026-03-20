import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SubmitCandidateToJobModal } from '@/components/jobs/SubmitCandidateToJobModal';
import { extractPreferredSkills, extractRequiredSkills, formatExperienceYears, formatLpa } from '@/components/jobs/jobText';
import { useDeleteJob, useJob } from '@/hooks/useJobs';
import { ArrowLeft, Briefcase, Building2, Calendar, MapPin, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: job, isLoading, error } = useJob(id);
  const deleteJob = useDeleteJob();

  const [submitOpen, setSubmitOpen] = useState(false);

  const requiredSkills = useMemo(() => extractRequiredSkills(job?.requirements), [job?.requirements]);
  const preferredSkills = useMemo(() => extractPreferredSkills(job?.requirements), [job?.requirements]);

  if (isLoading) {
    return (
      <DashboardLayout title="Job Profile">
        <div className="p-6 text-muted-foreground">Loading job...</div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout title="Job Profile">
        <div className="p-6">
          <div className="text-destructive font-medium">Failed to load job</div>
          <div className="text-sm text-muted-foreground mt-1">
            {error?.message || 'Job not found.'}
          </div>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Job Profile">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Button variant="ghost" className="px-0 text-muted-foreground" onClick={() => navigate('/jobs')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold leading-tight mt-2">{job.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {job.companyName}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {job.location || 'Remote/Any'}
              </span>
              <span className="inline-flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {formatExperienceYears(job.experienceRequired)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {job.postingDate ? format(new Date(job.postingDate), 'PPP') : 'Recently posted'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setSubmitOpen(true)}>Submit Candidates</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2" disabled={deleteJob.isPending}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the job posting from the system. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await deleteJob.mutateAsync(job.id);
                        toast.success('Job deleted');
                        navigate('/jobs');
                      } catch (e) {
                        toast.error('Failed to delete job');
                      }
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="text-sm font-semibold">Job Description</div>
              <div className="mt-3 text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                {job.requirements || 'No description provided.'}
              </div>
            </section>

            {(requiredSkills.length > 0 || preferredSkills.length > 0) && (
              <section className="rounded-lg border border-border bg-card p-5">
                <div className="text-sm font-semibold">Skills</div>
                {requiredSkills.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Required
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {requiredSkills.map((s) => (
                        <Badge key={`req-${job.id}-${s}`} variant="default" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {preferredSkills.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Preferred
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {preferredSkills.map((s) => (
                        <Badge key={`pref-${job.id}-${s}`} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="text-sm font-semibold">Compensation</div>
              <div className="mt-3 text-sm text-muted-foreground">
                {formatLpa(job.salaryLpa)}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-5">
              <div className="text-sm font-semibold">Details</div>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Location</div>
                  <div className="mt-1">{job.location || 'Remote/Any'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Experience</div>
                  <div className="mt-1">{formatExperienceYears(job.experienceRequired)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Company</div>
                  <div className="mt-1">{job.companyName}</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <SubmitCandidateToJobModal
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        job={job}
        onSuccess={() => {
          // no-op for now
        }}
      />
    </DashboardLayout>
  );
}

