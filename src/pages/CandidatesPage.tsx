import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { CandidateFilters } from '@/components/candidates/CandidateFilters';
import { CandidateDetailPanel } from '@/components/candidates/CandidateDetailPanel';
import { CandidateDetailModal } from '@/components/candidates/CandidateDetailModal';
import { FloatingCopilot } from '@/components/copilot/FloatingCopilot';
import { EnhancedSearch } from '@/components/search/EnhancedSearch';
import { BulkActionsToolbar } from '@/components/candidates/BulkActionsToolbar';
import { useCandidates, useUpdateCandidate } from '@/hooks/useCandidates';
import { mockClients } from '@/lib/mock-data'; // Clients still from mock until backend endpoint exists
import { Loader2, AlertCircle } from 'lucide-react';
import type { Candidate, CandidateFilters as CandidateFiltersType, CandidateStatus } from '@/types/ats';

export default function CandidatesPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalCandidate, setModalCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CandidateFiltersType>({
    excludeBlacklisted: true,
    excludeLeavers: true,
  });

  // Fetch candidates from API
  const {
    data: candidatesResponse,
    isLoading,
    error,
    refetch
  } = useCandidates(
    { ...filters, search: searchQuery },
    page,
    25
  );

  const updateCandidateMutation = useUpdateCandidate();

  // Get candidates array from response
  const candidates = useMemo(() => {
    return candidatesResponse?.data || [];
  }, [candidatesResponse]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        searchInput?.focus();
      }

      // Escape to close panels/modal (priority: modal > detail panel)
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isModalOpen) {
          setIsModalOpen(false);
          setModalCandidate(null);
        } else if (selectedCandidate) {
          setSelectedCandidate(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCandidate, isModalOpen]);

  // Parse search query for special syntax
  const parseSearchQuery = useCallback((query: string) => {
    const terms: { type: string; value: string }[] = [];
    const regex = /(\w+):([^\s]+)/g;
    let match;
    let remainingQuery = query;

    while ((match = regex.exec(query)) !== null) {
      terms.push({ type: match[1], value: match[2] });
      remainingQuery = remainingQuery.replace(match[0], '').trim();
    }

    return { terms, freeText: remainingQuery };
  }, []);

  // Filter candidates locally for client-side filters not supported by API
  const filteredCandidates = useMemo(() => {
    let result = candidates;

    // Apply local filters that aren't handled by API
    if (filters.excludeBlacklisted) {
      result = result.filter(c => !c.isBlacklisted);
    }

    if (filters.excludeLeavers) {
      result = result.filter(c => !c.isLeaver);
    }

    // Apply skill filters locally if search has special syntax
    if (searchQuery) {
      const { terms, freeText } = parseSearchQuery(searchQuery);

      terms.forEach(term => {
        switch (term.type.toLowerCase()) {
          case 'skill':
            result = result.filter(c =>
              c.skills.some(s => s.toLowerCase().includes(term.value.toLowerCase()))
            );
            break;
          case 'status':
            result = result.filter(c =>
              c.currentStatus.toLowerCase().includes(term.value.toLowerCase())
            );
            break;
          case 'exp':
            const expMatch = term.value.match(/([<>]=?)?(\d+)/);
            if (expMatch) {
              const op = expMatch[1] || '>=';
              const value = parseInt(expMatch[2]);
              result = result.filter(c => {
                switch (op) {
                  case '>': return c.experience > value;
                  case '>=': return c.experience >= value;
                  case '<': return c.experience < value;
                  case '<=': return c.experience <= value;
                  default: return c.experience >= value;
                }
              });
            }
            break;
        }
      });

      // Apply free text search locally
      if (freeText) {
        const lower = freeText.toLowerCase();
        result = result.filter(c =>
          c.name.toLowerCase().includes(lower) ||
          c.email.toLowerCase().includes(lower) ||
          c.skills.some(s => s.toLowerCase().includes(lower))
        );
      }
    }

    return result;
  }, [candidates, filters, searchQuery, parseSearchQuery]);

  // Get selected candidates for bulk actions
  const selectedCandidates = useMemo(() => {
    return filteredCandidates.filter(c => selectedIds.includes(c.id));
  }, [filteredCandidates, selectedIds]);

  const handleOpenDetail = (candidate: Candidate) => {
    setModalCandidate(candidate);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalCandidate(null);
  };

  const handleClosePanel = () => {
    setSelectedCandidate(null);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkStatusChange = async (candidateIds: string[], status: CandidateStatus) => {
    // Update each candidate via API
    for (const id of candidateIds) {
      await updateCandidateMutation.mutateAsync({
        id,
        data: { currentStatus: status },
      });
    }
    setSelectedIds([]);
    refetch();
  };

  const handleBulkAssignToClient = (candidateIds: string[], clientId: string) => {
    console.log('Assigning candidates', candidateIds, 'to client', clientId);
    setSelectedIds([]);
  };

  const SearchComponent = (
    <EnhancedSearch
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search candidates... (⌘K)"
    />
  );

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout title="Candidates" searchComponent={SearchComponent}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading candidates...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout title="Candidates" searchComponent={SearchComponent}>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-destructive font-medium">Failed to load candidates</p>
            <p className="text-sm text-muted-foreground max-w-md">
              {error.message || 'An unexpected error occurred. Please try again.'}
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
    <DashboardLayout title="Candidates" searchComponent={SearchComponent}>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="shrink-0">
            <CandidateFilters
              filters={filters}
              onFiltersChange={setFilters}
              clients={mockClients}
            />
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedIds.length > 0 && (
            <div className="shrink-0 p-4 border-b border-border">
              <BulkActionsToolbar
                selectedCandidates={selectedCandidates}
                clients={mockClients}
                onClearSelection={handleClearSelection}
                onStatusChange={handleBulkStatusChange}
                onAssignToClient={handleBulkAssignToClient}
              />
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <CandidateTable
              candidates={filteredCandidates}
              onSelectCandidate={setSelectedCandidate}
              selectedId={selectedCandidate?.id}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </div>

          {/* Pagination */}
          {candidatesResponse && candidatesResponse.totalPages > 1 && (
            <div className="shrink-0 p-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Showing {filteredCandidates.length} of {candidatesResponse.total} candidates
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
                  Page {page} of {candidatesResponse.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(candidatesResponse.totalPages, p + 1))}
                  disabled={page === candidatesResponse.totalPages}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedCandidate && (
          <div className="w-96 shrink-0 border-l border-border overflow-auto animate-in slide-in-from-right-4 duration-200">
            <CandidateDetailPanel
              candidate={selectedCandidate}
              onClose={handleClosePanel}
              onOpenFull={() => handleOpenDetail(selectedCandidate)}
            />
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {modalCandidate && (
        <CandidateDetailModal
          candidate={modalCandidate}
          open={isModalOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseModal();
          }}
        />
      )}

      {/* Floating AI Copilot - bottom right */}
      <FloatingCopilot
        context={selectedCandidate ? {
          candidateId: selectedCandidate.id,
          candidateName: selectedCandidate.name,
        } : undefined}
      />
    </DashboardLayout>
  );
}
