import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { CandidateFilters } from '@/components/candidates/CandidateFilters';
import { CandidateDetailPanel } from '@/components/candidates/CandidateDetailPanel';
import { CandidateDetailModal } from '@/components/candidates/CandidateDetailModal';
import { FloatingCopilot } from '@/components/copilot/FloatingCopilot';
import { EnhancedSearch } from '@/components/search/EnhancedSearch';
import { BulkActionsToolbar } from '@/components/candidates/BulkActionsToolbar';
import { mockCandidates, mockClients } from '@/lib/mock-data';
import type { Candidate, CandidateFilters as CandidateFiltersType, CandidateStatus } from '@/types/ats';

export default function CandidatesPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalCandidate, setModalCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [filters, setFilters] = useState<CandidateFiltersType>({
    excludeBlacklisted: true,
    excludeLeavers: true,
  });

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

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    let result = candidates;

    // Apply status filters
    if (filters.status?.length) {
      result = result.filter(c => filters.status!.includes(c.currentStatus));
    }

    // Apply skill filters
    if (filters.skills?.length) {
      result = result.filter(c => 
        filters.skills!.some(skill => 
          c.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        )
      );
    }

    // Apply client filter
    if (filters.clientId) {
      // In real app, this would filter by associated applications
    }

    // Apply search query
    if (searchQuery) {
      const { terms, freeText } = parseSearchQuery(searchQuery);

      // Apply structured terms
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

      // Apply free text search
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
    return candidates.filter(c => selectedIds.includes(c.id));
  }, [candidates, selectedIds]);

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

  const handleBulkStatusChange = (candidateIds: string[], status: CandidateStatus) => {
    setCandidates(prev => prev.map(c => 
      candidateIds.includes(c.id) ? { ...c, currentStatus: status, updatedAt: new Date().toISOString() } : c
    ));
    setSelectedIds([]);
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
