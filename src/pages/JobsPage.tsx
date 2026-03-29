import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EnhancedSearch } from '@/components/search/EnhancedSearch';
import { Button } from '@/components/ui/button';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFormModal } from '@/components/jobs/JobFormModal';
import { JobsFilterSheet } from '@/components/jobs/JobsFilterSheet';
import { useCreateJob, useJobs } from '@/hooks/useJobs';
import { useClients } from '@/hooks/useClients';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import type { JobFilters } from '@/types/ats';
import { toast } from 'sonner';

const SEEN_CLIENT_JOB_IDS_KEY = 'hr-dashboard:seen-client-job-ids';

export default function JobsPage() {
  const navigate = useNavigate();
  const createJob = useCreateJob();
  const { data: clients = [] } = useClients();

  const [filters, setFilters] = useState<JobFilters>({ sort: 'newest' });
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [seenClientJobIds, setSeenClientJobIds] = useState<string[]>([]);

  const { data: jobsResponse, isLoading, error, refetch } = useJobs(
    { ...filters, search: searchQuery },
    page,
    25
  );

  const jobs = useMemo(() => {
    const sourceJobs = jobsResponse?.data || [];

    return [...sourceJobs].sort((left, right) => {
      const leftIsNew = differenceInDays(new Date(), parseISO(left.postingDate)) < 7;
      const rightIsNew = differenceInDays(new Date(), parseISO(right.postingDate)) < 7;
      const leftPriority = leftIsNew ? 1 : 0;
      const rightPriority = rightIsNew ? 1 : 0;

      if (leftPriority !== rightPriority) {
        return rightPriority - leftPriority;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [jobsResponse]);
  const visibleJobs = useMemo(
    () => jobs.filter((job) => job.vacant !== false),
    [jobs]
  );
  const recentClientJobs = useMemo(
    () => visibleJobs.filter((job) => job.submittedByClient && !seenClientJobIds.includes(job.id)),
    [seenClientJobIds, visibleJobs]
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SEEN_CLIENT_JOB_IDS_KEY);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setSeenClientJobIds(parsed.filter((value): value is string => typeof value === 'string'));
      }
    } catch {
      setSeenClientJobIds([]);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        searchInput?.focus();
      }
      if (e.key === 'Escape') {
        if (addOpen) setAddOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addOpen]);

  const dismissRecentClientJobs = () => {
    const nextSeenIds = Array.from(new Set([...seenClientJobIds, ...recentClientJobs.map((job) => job.id)]));
    setSeenClientJobIds(nextSeenIds);
    window.localStorage.setItem(SEEN_CLIENT_JOB_IDS_KEY, JSON.stringify(nextSeenIds));
  };

  const SearchComponent = null;

  if (isLoading) {
    return (
      <DashboardLayout title="Jobs" searchComponent={SearchComponent}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Jobs" searchComponent={SearchComponent}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-destructive font-medium">Failed to load jobs</p>
            <p className="text-sm text-muted-foreground max-w-md">
              {error.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Jobs" searchComponent={SearchComponent}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="shrink-0 px-6 pt-4 pb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <EnhancedSearch
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setPage(1);
            }}
            placeholder="Search jobs (title/company)... (Ctrl/Cmd+K)"
            className="max-w-2xl"
          />

          <div className="flex gap-2">
            <JobsFilterSheet
              value={filters}
              onChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
            />
            <Button
              className="gap-2"
              onClick={() => setAddOpen(true)}
              disabled={clients.length === 0}
            >
              <Plus className="h-4 w-4" />
              Add Job
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          {recentClientJobs.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-950">Recent Client Jobs</p>
                  <p className="text-xs text-amber-900/80">
                    New job requests from clients are highlighted once here for HR review.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={dismissRecentClientJobs}>
                  Mark Seen
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {recentClientJobs.map((job) => (
                  <span
                    key={job.id}
                    className="rounded-full border border-amber-300 bg-white px-3 py-1 text-sm font-medium text-amber-950"
                  >
                    {job.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {visibleJobs.length === 0 ? (
            <div className="mt-10 rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
              {clients.length === 0
                ? 'No clients found. Create a client first, then add a job for that client.'
                : 'No jobs found. Try changing filters or add a new job.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleJobs.map((job) => (
                <JobCard key={job.id} job={job} onClick={() => navigate(`/jobs/${job.id}`)} />
              ))}
            </div>
          )}
        </div>

        {jobsResponse && jobsResponse.totalPages > 1 && (
          <div className="shrink-0 p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {visibleJobs.length} of {jobsResponse.total} jobs
            </span>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="px-2 text-sm">
                Page {page} of {jobsResponse.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(jobsResponse.totalPages, p + 1))}
                disabled={page === jobsResponse.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <JobFormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        clients={clients}
        onSubmit={async (data) => {
          try {
            await createJob.mutateAsync(data);
            toast.success('Job created');
            setPage(1);
            refetch();
          } catch (e) {
            toast.error('Failed to create job');
          }
        }}
      />
    </DashboardLayout>
  );
}
