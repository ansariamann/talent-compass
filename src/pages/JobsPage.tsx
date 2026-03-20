import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EnhancedSearch } from '@/components/search/EnhancedSearch';
import { Button } from '@/components/ui/button';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFormModal } from '@/components/jobs/JobFormModal';
import { JobsFilterSheet } from '@/components/jobs/JobsFilterSheet';
import { useCreateJob, useJobs } from '@/hooks/useJobs';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import type { JobFilters } from '@/types/ats';
import { toast } from 'sonner';

export default function JobsPage() {
  const navigate = useNavigate();
  const createJob = useCreateJob();

  const [filters, setFilters] = useState<JobFilters>({ sort: 'newest' });
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  const { data: jobsResponse, isLoading, error, refetch } = useJobs(
    { ...filters, search: searchQuery },
    page,
    25
  );

  const jobs = useMemo(() => jobsResponse?.data || [], [jobsResponse]);

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
            <Button className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Job
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          {jobs.length === 0 ? (
            <div className="mt-10 rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
              No jobs found. Try changing filters or add a new job.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} onClick={() => navigate(`/jobs/${job.id}`)} />
              ))}
            </div>
          )}
        </div>

        {jobsResponse && jobsResponse.totalPages > 1 && (
          <div className="shrink-0 p-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {jobs.length} of {jobsResponse.total} jobs
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

