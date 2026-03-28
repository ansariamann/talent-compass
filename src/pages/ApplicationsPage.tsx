import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/candidates/StatusBadge';
import { ApplicationFormModal } from '@/components/applications/ApplicationFormModal';
import { ApplicationActionsMenu } from '@/components/applications/ApplicationActionsMenu';
import { ApplicationFiltersBar } from '@/components/applications/ApplicationFiltersBar';
import { EnhancedSearch } from '@/components/search/EnhancedSearch';
import {
  useApplications,
  useCreateApplication,
  useDeleteApplication,
  useRestoreApplication,
  useFlagApplication,
  useUnflagApplication,
} from '@/hooks/useApplications';
import { useCandidates } from '@/hooks/useCandidates';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MessageSquare, Loader2, AlertCircle, Plus, Flag, Archive } from 'lucide-react';
import { toast } from 'sonner';
import type { Application, Candidate, ApplicationFilters, UserRole } from '@/types/ats';

export default function ApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ApplicationFilters>({});
  const [formModalOpen, setFormModalOpen] = useState(false);
  const { user } = useAuth();
  const isClientScopedUser = user?.role === 'client_admin' || user?.role === 'client_user';
  const currentClientId = isClientScopedUser ? user?.client_id : undefined;

  // Mutations
  const createMutation = useCreateApplication();
  const deleteMutation = useDeleteApplication();
  const restoreMutation = useRestoreApplication();
  const flagMutation = useFlagApplication();
  const unflagMutation = useUnflagApplication();

  // Fetch applications from API
  const {
    data: applicationsResponse,
    isLoading: isLoadingApplications,
    error: applicationsError,
    refetch
  } = useApplications(filters, page, 25);
  const { data: applicationStatusResponse } = useApplications({}, 1, 1000);

  // Fetch clients
  const { data: clients = [] } = useClients(1000);
  const scopedClients = isClientScopedUser && currentClientId
    ? clients.filter((client) => client.id === currentClientId)
    : clients;

  // Fetch candidates for the create modal
  const { data: candidatesResponse } = useCandidates({}, 1, 500);

  // Build client lookup map for fallback
  const clientMap = new Map(clients.map(c => [c.id, c]));

  // Build candidate lookup map for fallback
  const candidateMap = new Map<string, Candidate>();
  candidatesResponse?.data.forEach(c => candidateMap.set(c.id, c));

  // Get applications with candidate and client data attached
  const applications = (applicationsResponse?.data || []).map(app => ({
    ...app,
    candidate: app.candidate || candidateMap.get(app.candidateId),
    client: app.client || clientMap.get(app.clientId),
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

  const statusApplications = (applicationStatusResponse?.data || []).map(app => ({
    ...app,
    candidate: app.candidate || candidateMap.get(app.candidateId),
    client: app.client || clientMap.get(app.clientId),
  }));

  const recentFinalStatuses = [...statusApplications]
    .filter((app) => app.status === 'accepted' || app.status === 'rejected')
    .sort(
      (a, b) =>
        new Date(b.lastActivityAt || b.submittedAt).getTime() -
        new Date(a.lastActivityAt || a.submittedAt).getTime()
    )
    .slice(0, 10);

  const handleCreate = async (data: { candidateId: string; clientId: string; jobId?: string; jobTitle?: string }) => {
    await createMutation.mutateAsync({
      ...data,
      clientId: currentClientId || data.clientId,
    });
    await refetch();
    toast.success('Application created successfully');
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Application deleted'),
    });
  };

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id, {
      onSuccess: () => toast.success('Application restored'),
    });
  };

  const handleFlag = (id: string, reason?: string) => {
    flagMutation.mutate({ id, reason }, {
      onSuccess: () => toast.success('Application flagged'),
    });
  };

  const handleUnflag = (id: string) => {
    unflagMutation.mutate(id, {
      onSuccess: () => toast.success('Application unflagged'),
    });
  };

  const searchComponent = (
    <EnhancedSearch
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search applications by candidate or job title..."
      className="w-80"
    />
  );

  // Loading state
  if (isLoadingApplications) {
    return (
      <DashboardLayout title="Applications" searchComponent={searchComponent}>
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
      <DashboardLayout title="Applications" searchComponent={searchComponent}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-destructive font-medium">Failed to load applications</p>
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
    <DashboardLayout title="Applications" searchComponent={searchComponent}>
      {/* Filters Bar */}
      <ApplicationFiltersBar filters={filters} onFiltersChange={setFilters} />

      <div className="p-6">
        {/* Header with Create button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">
            {filteredApplications.length} Applications
          </h2>
          <Button onClick={() => { setFormModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Application
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
          <section className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-base font-semibold">Application</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All applications appear in this column.
              </p>
            </div>

            <div className="grid gap-4">
              {filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onDelete={handleDelete}
                  onRestore={handleRestore}
                  onFlag={handleFlag}
                  onUnflag={handleUnflag}
                />
              ))}
            </div>

            {filteredApplications.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No applications found
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-base font-semibold">Application Status</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Last 10 final client decisions.
              </p>
            </div>

            <div className="space-y-3">
              {recentFinalStatuses.map((app) => (
                <div key={app.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {app.candidate?.name || 'Unknown Candidate'}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {app.client?.name || 'Unknown Client'} — {app.jobTitle}
                      </p>
                    </div>
                    <StatusBadge status={app.status} type="application" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {new Date(app.lastActivityAt || app.submittedAt).toLocaleString()}
                  </p>
                </div>
              ))}

              {recentFinalStatuses.length === 0 && (
                <div className="rounded-lg border border-dashed bg-card p-6 text-sm text-muted-foreground">
                  No final application statuses yet.
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Pagination */}
        {applicationsResponse && applicationsResponse.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {page} of {applicationsResponse.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
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

      {/* Form Modal */}
      <ApplicationFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        onSubmit={handleCreate}
        candidates={candidatesResponse?.data || []}
        clients={scopedClients}
        currentClientId={currentClientId}
        isLoading={createMutation.isPending}
      />
    </DashboardLayout>
  );
}

interface ApplicationCardProps {
  application: Application;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onFlag: (id: string, reason?: string) => void;
  onUnflag: (id: string) => void;
}

function ApplicationCard({ application, onDelete, onRestore, onFlag, onUnflag }: ApplicationCardProps) {
  return (
    <div className={`panel hover:border-primary/30 transition-colors ${application.isDeleted ? 'opacity-60' : ''}`}>
      <div className="p-4 flex items-start justify-between">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-medium shrink-0">
            {application.candidate?.name.split(' ').map(n => n[0]).join('') || '?'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{application.candidate?.name || 'Unknown Candidate'}</h3>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm">{application.jobTitle}</span>
              {application.isFlagged && (
                <Badge variant="warning" className="gap-1">
                  <Flag className="w-3 h-3" />
                  Flagged
                </Badge>
              )}
              {application.isDeleted && (
                <Badge variant="secondary" className="gap-1">
                  <Archive className="w-3 h-3" />
                  Archived
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline">{application.client?.name || 'Unknown Client'}</Badge>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(application.submittedAt).toLocaleDateString()}
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
          <ApplicationActionsMenu
            application={application}
            onDelete={onDelete}
            onRestore={onRestore}
            onFlag={onFlag}
            onUnflag={onUnflag}
          />
        </div>
      </div>
    </div>
  );
}
