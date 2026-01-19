import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/candidates/StatusBadge';
import { useApplications } from '@/hooks/useApplications';
import { useCandidates } from '@/hooks/useCandidates';
import { MoreHorizontal, Calendar, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import type { Application, Candidate } from '@/types/ats';

export default function ApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Fetch applications from API
  const {
    data: applicationsResponse,
    isLoading: isLoadingApplications,
    error: applicationsError,
    refetch
  } = useApplications({}, page, 25);

  // Fetch candidates to get candidate details
  const { data: candidatesResponse } = useCandidates({}, 1, 100);

  // Build candidate lookup map
  const candidateMap = new Map<string, Candidate>();
  candidatesResponse?.data.forEach(c => candidateMap.set(c.id, c));

  // Get applications with candidate data attached
  const applications = (applicationsResponse?.data || []).map(app => ({
    ...app,
    candidate: candidateMap.get(app.candidateId),
  }));

  // Filter applications by search query
  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.candidate?.name.toLowerCase().includes(query) ||
      app.jobTitle.toLowerCase().includes(query)
    );
  });

  // Loading state
  if (isLoadingApplications) {
    return (
      <DashboardLayout title="Applications" onSearch={setSearchQuery}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (applicationsError) {
    return (
      <DashboardLayout title="Applications" onSearch={setSearchQuery}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-destructive font-medium">Failed to load applications</p>
            <p className="text-sm text-muted-foreground max-w-md">
              {applicationsError.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Applications" onSearch={setSearchQuery}>
      <div className="p-6">
        <div className="grid gap-4">
          {filteredApplications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No applications found
          </div>
        )}

        {/* Pagination */}
        {applicationsResponse && applicationsResponse.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {filteredApplications.length} of {applicationsResponse.total} applications
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {page} of {applicationsResponse.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(applicationsResponse.totalPages, p + 1))}
                disabled={page === applicationsResponse.totalPages}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  return (
    <div className="panel hover:border-primary/30 transition-colors cursor-pointer">
      <div className="p-4 flex items-start justify-between">
        <div className="flex gap-4">
          {/* Candidate avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-medium shrink-0">
            {application.candidate?.name.split(' ').map(n => n[0]).join('') || '?'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{application.candidate?.name || 'Unknown Candidate'}</h3>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm">{application.jobTitle}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline">{application.client?.name || 'Unknown Client'}</Badge>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Submitted {new Date(application.submittedAt).toLocaleDateString()}
              </span>
              {application.notes.length > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {application.notes.length} notes
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={application.status} type="application" />
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Audit log preview */}
      {application.auditLog.length > 0 && (
        <div className="px-4 pb-4 pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Latest:</span>
            {application.auditLog.slice(-1).map(entry => (
              <span key={entry.id}>
                {entry.performedByName} changed status to{' '}
                <Badge variant="neutral" className="text-[10px] px-1.5 py-0">
                  {entry.toStatus}
                </Badge>
                {' • '}
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
