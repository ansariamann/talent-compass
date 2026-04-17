import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CandidateTable } from "@/components/candidates/CandidateTable";
import { CandidateFilters } from "@/components/candidates/CandidateFilters";
import { CandidateDetailModal } from "@/components/candidates/CandidateDetailModal";
import { CandidateCreateModal } from "@/components/candidates/CandidateCreateModal";
import { EnhancedSearch } from "@/components/search/EnhancedSearch";
import { BulkActionsToolbar } from "@/components/candidates/BulkActionsToolbar";
import { SubmitApplicationModal } from "@/components/candidates/SubmitApplicationModal";
import { MergeCandidatesModal } from "@/components/candidates/MergeCandidatesModal";
import { useCandidates, useDeleteCandidate, useUpdateCandidate } from "@/hooks/useCandidates";
import { useClients } from "@/hooks/useClients";
import { enrichCandidatesWithDuplicateInfo } from "@/lib/duplicateDetection";
import { Loader2, AlertCircle, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type {
  Candidate,
  CandidateFilters as CandidateFiltersType,
  CandidateStatus,
} from "@/types/ats";

export default function CandidatesPage() {
  const pageSize = 25;
  const [modalCandidate, setModalCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [candidatesToMerge, setCandidatesToMerge] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<CandidateFiltersType>({
    excludeBlacklisted: true,
    excludeLeavers: true,
  });

  // Debounce the search query to avoid re-fetching on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch candidates from API
  const {
    data: candidatesResponse,
    isLoading,
    error,
    refetch,
  } = useCandidates({ ...filters, search: debouncedSearch }, 1, 1000);

  // Fetch clients for filters and assignment
  const { data: clients = [] } = useClients();

  const updateCandidateMutation = useUpdateCandidate();
  const deleteCandidateMutation = useDeleteCandidate();

  // Get candidates array from response
  const candidates = useMemo(() => {
    return candidatesResponse?.data || [];
  }, [candidatesResponse]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector(
          "[data-search-input]"
        ) as HTMLInputElement;
        searchInput?.focus();
      }

      // Escape to close the full candidate modal.
      if (e.key === "Escape") {
        e.preventDefault();
        if (isModalOpen) {
          setIsModalOpen(false);
          setModalCandidate(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Filter candidates locally only for toggles not supported by backend query params.
  const filteredCandidates = useMemo(() => {
    let result = candidates;

    // Apply local filters that aren't handled by API
    if (filters.excludeBlacklisted) {
      result = result.filter((c) => !c.isBlacklisted);
    }

    if (filters.excludeLeavers) {
      result = result.filter((c) => !c.isLeaver);
    }

    // Enrich with duplicate detection info
    return enrichCandidatesWithDuplicateInfo(result);
  }, [candidates, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / pageSize));

  const paginatedCandidates = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredCandidates.slice(startIndex, startIndex + pageSize);
  }, [filteredCandidates, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Get selected candidates for bulk actions
  const selectedCandidates = useMemo(() => {
    return filteredCandidates.filter((c) => selectedIds.includes(c.id));
  }, [filteredCandidates, selectedIds]);

  const handleOpenDetail = (candidate: Candidate) => {
    setModalCandidate(candidate);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalCandidate(null);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setIsCreateModalOpen(true);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      await deleteCandidateMutation.mutateAsync(candidateId);
      setSelectedIds((current) => current.filter((id) => id !== candidateId));
      setModalCandidate((current) => (current?.id === candidateId ? null : current));
      toast.success("Candidate deleted");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete candidate");
    }
  };

  const handleBulkDeleteCandidates = async (candidateIds: string[]) => {
    try {
      for (const candidateId of candidateIds) {
        await deleteCandidateMutation.mutateAsync(candidateId);
      }

      setSelectedIds([]);
      setModalCandidate((current) =>
        current && candidateIds.includes(current.id) ? null : current
      );
      toast.success(
        `Deleted ${candidateIds.length} candidate${candidateIds.length > 1 ? "s" : ""}`
      );
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete selected candidates");
    }
  };

  const handleBulkStatusChange = async (
    candidateIds: string[],
    status: CandidateStatus
  ) => {
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

  const handleBulkAssignToClient = (
    _candidateIds: string[],
    _clientId: string
  ) => {
    // Handled via SubmitApplicationModal
    setIsSubmitModalOpen(true);
  };

  const handleMergeDuplicates = (candidateIds: string[]) => {
    const toMerge = filteredCandidates.filter((c) =>
      candidateIds.includes(c.id)
    );
    if (toMerge.length < 2) {
      toast.error("Select at least 2 candidates to merge");
      return;
    }
    setCandidatesToMerge(toMerge);
    setIsMergeModalOpen(true);
  };

  const handleMergeConfirm = async (
    primaryId: string,
    secondaryIds: string[]
  ) => {
    // Call merge API endpoint - this would be integrated with your backend
    try {
      // Update candidates in state
      for (const secondaryId of secondaryIds) {
        await updateCandidateMutation.mutateAsync({
          id: secondaryId,
          data: {
            isDuplicate: true,
            duplicateOf: primaryId,
          },
        });
      }

      refetch();
      setSelectedIds([]);
      toast.success(
        `Successfully merged ${secondaryIds.length} candidate${
          secondaryIds.length > 1 ? "s" : ""
        }`
      );
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Failed to merge candidates");
    }
  };

  const SearchComponent = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => refetch()}
        disabled={isLoading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setEditingCandidate(null);
          setIsCreateModalOpen(true);
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Candidate
      </Button>
    </div>
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
            <p className="text-destructive font-medium">
              Failed to load candidates
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              {error.message ||
                "An unexpected error occurred. Please try again."}
            </p>
            <Button onClick={() => refetch()} size="sm">
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Candidates" searchComponent={SearchComponent}>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 px-6 pt-4 pb-2">
            <EnhancedSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, email, skill, location... (Ctrl/Cmd+K)"
              className="max-w-2xl"
            />
          </div>
          <div className="shrink-0">
            <CandidateFilters
              filters={filters}
              onFiltersChange={setFilters}
              clients={clients}
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="shrink-0 p-4 border-b border-border">
              <BulkActionsToolbar
                selectedCandidates={selectedCandidates}
                clients={clients}
                onClearSelection={handleClearSelection}
                onStatusChange={handleBulkStatusChange}
                onAssignToClient={() => setIsSubmitModalOpen(true)}
                onMergeDuplicates={handleMergeDuplicates}
                onDeleteCandidates={handleBulkDeleteCandidates}
              />
            </div>
          )}

          <div className="flex-1 overflow-auto">
            <CandidateTable
              candidates={paginatedCandidates}
              onSelectCandidate={handleOpenDetail}
              onEditCandidate={handleEditCandidate}
              onDeleteCandidate={handleDeleteCandidate}
              selectedId={isModalOpen ? modalCandidate?.id : undefined}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </div>

          {filteredCandidates.length > pageSize && (
            <div className="shrink-0 px-6 py-3 border-t border-border flex items-center justify-between bg-muted/20">
              <span className="text-sm text-muted-foreground">
                Showing {paginatedCandidates.length} of{" "}
                {filteredCandidates.length} candidates
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="px-2 text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {modalCandidate && (
        <CandidateDetailModal
          candidate={modalCandidate}
          open={isModalOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseModal();
          }}
          onCandidateUpdated={(updatedCandidate) => {
            setModalCandidate(updatedCandidate);
            refetch();
          }}
        />
      )}

      {/* Submit Application Modal */}
      <SubmitApplicationModal
        open={isSubmitModalOpen}
        onOpenChange={setIsSubmitModalOpen}
        candidates={selectedCandidates}
        onSuccess={() => {
          setSelectedIds([]);
          refetch();
        }}
      />

      {/* Merge Candidates Modal */}
      <MergeCandidatesModal
        candidates={candidatesToMerge}
        open={isMergeModalOpen}
        onOpenChange={setIsMergeModalOpen}
        onMerge={handleMergeConfirm}
      />

      <CandidateCreateModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            setEditingCandidate(null);
          }
        }}
        candidate={editingCandidate}
        onSuccess={(savedCandidate) => {
          setEditingCandidate(null);
          setModalCandidate((current) =>
            current?.id === savedCandidate.id ? savedCandidate : current
          );
          refetch();
        }}
      />
    </DashboardLayout>
  );
}
