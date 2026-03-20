import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "./StatusBadge";
import { SkillsOverflowTooltip } from "./SkillsOverflowTooltip";
import type { Candidate } from "@/types/ats";

interface CandidateTableProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  selectedId?: string;
  isLoading?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function CandidateTable({
  candidates,
  onSelectCandidate,
  selectedId,
  isLoading,
  selectedIds = [],
  onSelectionChange,
}: CandidateTableProps) {
  const [sortField, setSortField] = useState<
    "name" | "experience"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "experience":
        comparison = a.experience - b.experience;
        break;
    }
    return sortDir === "asc" ? comparison : -comparison;
  });

  const handleCheckboxChange = (candidateId: string, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedIds, candidateId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== candidateId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange(sortedCandidates.map((c) => c.id));
    } else {
      onSelectionChange([]);
    }
  };

  const allSelected =
    sortedCandidates.length > 0 &&
    selectedIds.length === sortedCandidates.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < sortedCandidates.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-subtle text-muted-foreground">
          Loading candidates...
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {onSelectionChange && (
              <th className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className={cn(
                    someSelected && "data-[state=unchecked]:bg-primary/30"
                  )}
                  aria-label="Select all candidates"
                />
              </th>
            )}
            <th
              className="cursor-pointer select-none"
              onClick={() => handleSort("name")}
            >
              <span className="flex items-center gap-1">
                Candidate <SortIcon field="name" />
              </span>
            </th>
            <th>Company</th>
            <th>Skills</th>
            <th
              className="cursor-pointer select-none"
              onClick={() => handleSort("experience")}
            >
              <span className="flex items-center gap-1">
                Experience <SortIcon field="experience" />
              </span>
            </th>
            <th>Status</th>
            <th>CTC</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {sortedCandidates.map((candidate) => {
            const isChecked = selectedIds.includes(candidate.id);
            return (
              <tr
                key={candidate.id}
                onClick={() => onSelectCandidate(candidate)}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedId === candidate.id && "bg-accent",
                  isChecked && "bg-primary/5"
                )}
              >
                {onSelectionChange && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(candidate.id, checked as boolean)
                      }
                      aria-label={`Select ${candidate.name}`}
                    />
                  </td>
                )}
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {candidate.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {candidate.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="text-sm text-muted-foreground">
                    {candidate.company || "-"}
                  </span>
                </td>
                <td>
                  <SkillsOverflowTooltip
                    skills={candidate.skills}
                    visibleCount={3}
                  />
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-sm font-medium">
                      {candidate.experience} yrs
                    </span>
                  </div>
                </td>
                <td>
                  <StatusBadge
                    status={candidate.currentStatus}
                    type="candidate"
                  />
                </td>
                <td>
                  <div className="text-xs space-y-1">
                    {candidate.ctcCurrent ? (
                      <div>
                        Current:{" "}
                        <span className="font-medium">
                          ₹{candidate.ctcCurrent.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        Current: <span className="italic">Not Disclosed</span>
                      </div>
                    )}
                    {candidate.ctcExpected ? (
                      <div>
                        Expected:{" "}
                        <span className="font-medium">
                          ₹{candidate.ctcExpected.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        Expected: <span className="italic">Not Disclosed</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {sortedCandidates.length === 0 && (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No candidates found
        </div>
      )}
    </div>
  );
}
