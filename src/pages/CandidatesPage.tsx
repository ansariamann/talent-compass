import { useState, useMemo, useCallback, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { CandidateFilters } from '@/components/candidates/CandidateFilters';
import { CandidateDetailPanel } from '@/components/candidates/CandidateDetailPanel';
import { CandidateDetailModal } from '@/components/candidates/CandidateDetailModal';
import { CopilotPanel } from '@/components/copilot/CopilotPanel';
import { EnhancedSearch } from '@/components/search/EnhancedSearch';
import { mockCandidates, mockClients } from '@/lib/mock-data';
import type { Candidate, CandidateFilters as CandidateFiltersType } from '@/types/ats';

export default function CandidatesPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalCandidate, setModalCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CandidateFiltersType>({
    excludeBlacklisted: true,
    excludeLeavers: true,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        searchInput?.focus();
      }
      
      // Escape to close panels
      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false);
        } else if (selectedCandidate) {
          setSelectedCandidate(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedCandidate]);

  // Parse advanced search syntax
  const parseSearch = useCallback((query: string) => {
    const parsed: { text: string; skill?: string; status?: string; minExp?: number } = { text: '' };
    
    // Extract skill: prefix
    const skillMatch = query.match(/skill:(\w+)/i);
    if (skillMatch) {
      parsed.skill = skillMatch[1];
      query = query.replace(skillMatch[0], '');
    }
    
    // Extract status: prefix
    const statusMatch = query.match(/status:(\w+)/i);
    if (statusMatch) {
      parsed.status = statusMatch[1];
      query = query.replace(statusMatch[0], '');
    }
    
    // Extract exp:>N prefix
    const expMatch = query.match(/exp:>(\d+)/i);
    if (expMatch) {
      parsed.minExp = parseInt(expMatch[1]);
      query = query.replace(expMatch[0], '');
    }
    
    parsed.text = query.trim();
    return parsed;
  }, []);

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

    // Parse and apply search
    if (searchQuery) {
      const parsed = parseSearch(searchQuery);
      
      // Text search
      if (parsed.text) {
        const query = parsed.text.toLowerCase();
        results = results.filter(c => 
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.skills.some(s => s.toLowerCase().includes(query))
        );
      }
      
      // Skill filter from search
      if (parsed.skill) {
        results = results.filter(c => 
          c.skills.some(s => s.toLowerCase().includes(parsed.skill!.toLowerCase()))
        );
      }
      
      // Status filter from search
      if (parsed.status) {
        results = results.filter(c => 
          c.currentStatus.toLowerCase().includes(parsed.status!.toLowerCase())
        );
      }
      
      // Experience filter from search
      if (parsed.minExp) {
        results = results.filter(c => c.experience > parsed.minExp!);
      }
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
  }, [searchQuery, filters, parseSearch]);

  const handleOpenDetail = (candidate: Candidate) => {
    setModalCandidate(candidate);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout 
      title="Candidates" 
      searchComponent={
        <EnhancedSearch 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search candidates, skills, or use filters..."
          className="w-80"
        />
      }
    >
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
              onSelectCandidate={(c) => {
                setSelectedCandidate(c);
                handleOpenDetail(c);
              }}
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
              <span className="flex items-center gap-2">
                <span className="kbd">Esc</span> Close
              </span>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedCandidate && (
          <CandidateDetailPanel
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
            onOpenFull={() => handleOpenDetail(selectedCandidate)}
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

      {/* Detail Modal */}
      {modalCandidate && (
        <CandidateDetailModal
          candidate={modalCandidate}
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setModalCandidate(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
