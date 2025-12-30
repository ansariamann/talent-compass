import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { CandidateFilters } from '@/components/candidates/CandidateFilters';
import { CandidateDetailPanel } from '@/components/candidates/CandidateDetailPanel';
import { CopilotPanel } from '@/components/copilot/CopilotPanel';
import { mockCandidates, mockClients } from '@/lib/mock-data';
import type { Candidate, CandidateFilters as CandidateFiltersType } from '@/types/ats';

export default function CandidatesPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CandidateFiltersType>({
    excludeBlacklisted: true,
    excludeLeavers: true,
  });

  // Filter and search candidates
  const filteredCandidates = useMemo(() => {
    let results = mockCandidates;

    // Apply default exclusions
    if (filters.excludeBlacklisted) {
      results = results.filter(c => !c.isBlacklisted);
    }
    if (filters.excludeLeavers) {
      results = results.filter(c => !c.isLeaver);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.skills.some(s => s.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filters.status?.length) {
      results = results.filter(c => filters.status!.includes(c.currentStatus));
    }

    // Apply skills filter
    if (filters.skills?.length) {
      results = results.filter(c => 
        filters.skills!.some(skill => c.skills.includes(skill))
      );
    }

    return results;
  }, [searchQuery, filters]);

  return (
    <DashboardLayout title="Candidates" onSearch={setSearchQuery}>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Filters */}
          <CandidateFilters 
            filters={filters}
            onFiltersChange={setFilters}
            clients={mockClients.map(c => ({ id: c.id, name: c.name }))}
          />

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <CandidateTable
              candidates={filteredCandidates}
              onSelectCandidate={setSelectedCandidate}
              selectedId={selectedCandidate?.id}
            />
          </div>

          {/* Footer stats */}
          <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing <span className="font-mono text-foreground">{filteredCandidates.length}</span> candidates
            </span>
            <div className="flex gap-4">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-success" />
                <span className="kbd">↑↓</span> Navigate
              </span>
              <span className="flex items-center gap-2">
                <span className="kbd">Enter</span> View details
              </span>
              <span className="flex items-center gap-2">
                <span className="kbd">⌘K</span> Search
              </span>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedCandidate && (
          <CandidateDetailPanel
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
          />
        )}

        {/* Copilot panel - always visible */}
        <div className="w-80 shrink-0">
          <CopilotPanel 
            context={selectedCandidate ? {
              candidateId: selectedCandidate.id,
              candidateName: selectedCandidate.name,
            } : undefined}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
