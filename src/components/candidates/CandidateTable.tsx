import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { SkillsOverflowTooltip } from "./SkillsOverflowTooltip";
import { CandidateActionsMenu } from "./CandidateActionsMenu";
import type { Candidate } from "@/types/ats";

interface CandidateTableProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onEditCandidate: (candidate: Candidate) => void;
  onDeleteCandidate: (candidateId: string) => void;
  selectedId?: string;
  isLoading?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

type SortField = "name" | "experience" | "updatedAt";

function formatCurrency(value?: number) {
  if (value == null) return "-";
  return `Rs ${value.toLocaleString()}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function summarizePreviousEmployment(previousEmployment?: Candidate["previousEmployment"]) {
  if (!previousEmployment?.length) return "-";
  return previousEmployment
    .map((job) => {
      const company = typeof job.company === "string" ? job.company : undefined;
      const title =
        typeof job.title === "string"
          ? job.title
          : typeof job.role === "string"
          ? job.role
          : undefined;
      return [company, title].filter(Boolean).join(" - ");
    })
    .filter(Boolean)
    .join(", ") || "-";
}

export function CandidateTable({
  candidates,
  onSelectCandidate,
  onEditCandidate,
  onDeleteCandidate,
  selectedId,
  isLoading,
  selectedIds = [],
  onSelectionChange,
}: CandidateTableProps) {
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
      return;
    }
    setSortField(field);
    setSortDir(field === "name" ? "asc" : "desc");
  };

  const SortIcon = ({ field }: { field: SortField }) => {
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
      case "updatedAt":
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }
    return sortDir === "asc" ? comparison : -comparison;
  });

  const handleCheckboxChange = (candidateId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      checked ? [...selectedIds, candidateId] : selectedIds.filter((id) => id !== candidateId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    onSelectionChange(checked ? sortedCandidates.map((candidate) => candidate.id) : []);
  };

  const allSelected =
    sortedCandidates.length > 0 && selectedIds.length === sortedCandidates.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < sortedCandidates.length;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Loading candidates...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table min-w-[2200px]">
        <thead>
          <tr>
            {onSelectionChange && (
              <th className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className={cn(someSelected && "data-[state=unchecked]:bg-muted")}
                  aria-label="Select all candidates"
                />
              </th>
            )}
            <th className="cursor-pointer select-none" onClick={() => handleSort("name")}>
              <span className="flex items-center gap-1">
                Name <SortIcon field="name" />
              </span>
            </th>
            <th>Email</th>
            <th>Phone</th>
            <th>Company</th>
            <th>Location</th>
            <th>Date of Birth</th>
            <th>Key Skill</th>
            <th>Skills</th>
            <th>Previous Employment</th>
            <th className="cursor-pointer select-none" onClick={() => handleSort("experience")}>
              <span className="flex items-center gap-1">
                Experience <SortIcon field="experience" />
              </span>
            </th>
            <th>Total Experience</th>
            <th>Notice Period</th>
            <th>Current CTC</th>
            <th>Expected CTC</th>
            <th>Source</th>
            <th>Client</th>
            <th>LinkedIn</th>
            <th>Resume URL</th>
            <th>Resume File Path</th>
            <th>Status</th>
            <th>Selected</th>
            <th>Direct Interview</th>
            <th>Blacklisted</th>
            <th>Leaver</th>
            <th>Remark</th>
            <th>Assigned User</th>
            <th>Candidate ID</th>
            <th>Client ID</th>
            <th className="cursor-pointer select-none" onClick={() => handleSort("updatedAt")}>
              <span className="flex items-center gap-1">
                Updated <SortIcon field="updatedAt" />
              </span>
            </th>
            <th>Created</th>
            <th className="w-12">Actions</th>
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
                  selectedId === candidate.id && "bg-muted",
                  isChecked && "bg-muted/60"
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
                <td>{candidate.name}</td>
                <td>{candidate.email || "-"}</td>
                <td>{candidate.phone || "-"}</td>
                <td>{candidate.company || "-"}</td>
                <td>{candidate.location || "-"}</td>
                <td>{formatDate(candidate.dateOfBirth)}</td>
                <td>{candidate.keySkill || "-"}</td>
                <td>
                  <SkillsOverflowTooltip skills={candidate.skills} visibleCount={3} />
                </td>
                <td className="max-w-[260px] whitespace-normal break-words">
                  {summarizePreviousEmployment(candidate.previousEmployment)}
                </td>
                <td>{candidate.experience} yrs</td>
                <td>{candidate.totalExperienceYears ?? "-"}</td>
                <td>
                  {candidate.noticePeriodDays != null ? `${candidate.noticePeriodDays} days` : "-"}
                </td>
                <td>{formatCurrency(candidate.ctcCurrent)}</td>
                <td>{formatCurrency(candidate.ctcExpected)}</td>
                <td>{candidate.source || "-"}</td>
                <td>{candidate.client || "-"}</td>
                <td className="max-w-[220px] whitespace-normal break-all">
                  {candidate.linkedinUrl ? (
                    <a
                      href={candidate.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {candidate.linkedinUrl}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="max-w-[220px] whitespace-normal break-all">
                  {candidate.resumeUrl || "-"}
                </td>
                <td className="max-w-[220px] whitespace-normal break-all">
                  {candidate.resumeFilePath || "-"}
                </td>
                <td>
                  <StatusBadge status={candidate.currentStatus} type="candidate" />
                </td>
                <td>{candidate.currentStatus === "selected" ? "Yes" : "No"}</td>
                <td>{candidate.isDirectInterview ? "Yes" : "No"}</td>
                <td>{candidate.isBlacklisted ? "Yes" : "No"}</td>
                <td>{candidate.isLeaver ? "Yes" : "No"}</td>
                <td className="max-w-[240px] whitespace-normal break-words">
                  {candidate.remark || "-"}
                </td>
                <td className="font-mono text-xs">{candidate.assignedUserId || "-"}</td>
                <td className="font-mono text-xs">{candidate.id}</td>
                <td className="font-mono text-xs">{candidate.clientId}</td>
                <td>{formatDateTime(candidate.updatedAt)}</td>
                <td>{formatDateTime(candidate.createdAt)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <CandidateActionsMenu
                    candidate={candidate}
                    onEdit={onEditCandidate}
                    onDelete={onDeleteCandidate}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {sortedCandidates.length === 0 && (
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          No candidates found
        </div>
      )}
    </div>
  );
}
