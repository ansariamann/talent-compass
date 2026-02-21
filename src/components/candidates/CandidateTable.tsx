import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal,
  Flag,
  AlertCircle,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from './StatusBadge';
import type { Candidate, CandidateFlag } from '@/types/ats';

interface CandidateTableProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  selectedId?: string;
  isLoading?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const flagIcons: Record<CandidateFlag['type'], React.ComponentType<{ className?: string }>> = {
  duplicate: AlertCircle,
  incomplete: AlertCircle,
  verified: CheckCircle2,
  priority: Star,
  internal: Flag,
};

export function CandidateTable({ 
  candidates, 
  onSelectCandidate, 
  selectedId,
  isLoading,
  selectedIds = [],
  onSelectionChange,
}: CandidateTableProps) {
  const [sortField, setSortField] = useState<'name' | 'experience' | 'updatedAt'>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'experience':
        comparison = a.experience - b.experience;
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }
    return sortDir === 'asc' ? comparison : -comparison;
  });

  const handleCheckboxChange = (candidateId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedIds, candidateId]);
    } else {
      onSelectionChange(selectedIds.filter(id => id !== candidateId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange(sortedCandidates.map(c => c.id));
    } else {
      onSelectionChange([]);
    }
  };

  const allSelected = sortedCandidates.length > 0 && selectedIds.length === sortedCandidates.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < sortedCandidates.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-subtle text-muted-foreground">Loading candidates...</div>
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
                  className={cn(someSelected && "data-[state=unchecked]:bg-primary/30")}
                  aria-label="Select all candidates"
                />
              </th>
            )}
            <th 
              className="cursor-pointer select-none" 
              onClick={() => handleSort('name')}
            >
              <span className="flex items-center gap-1">
                Candidate <SortIcon field="name" />
              </span>
            </th>
            <th>Skills</th>
            <th 
              className="cursor-pointer select-none" 
              onClick={() => handleSort('experience')}
            >
              <span className="flex items-center gap-1">
                Experience <SortIcon field="experience" />
              </span>
            </th>
            <th>Status</th>
            <th>CTC</th>
            <th>Flags</th>
            <th 
              className="cursor-pointer select-none" 
              onClick={() => handleSort('updatedAt')}
            >
              <span className="flex items-center gap-1">
                Updated <SortIcon field="updatedAt" />
              </span>
            </th>
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
                  <td onClick={e => e.stopPropagation()}>
                    <Checkbox 
                      checked={isChecked}
                      onCheckedChange={(checked) => handleCheckboxChange(candidate.id, checked as boolean)}
                      aria-label={`Select ${candidate.name}`}
                    />
                  </td>
                )}
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium">{candidate.name}</div>
                      <div className="text-xs text-muted-foreground">{candidate.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {candidate.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{candidate.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td>
                  <span className="font-mono text-sm">{candidate.experience} yrs</span>
                </td>
                <td>
                  <StatusBadge status={candidate.currentStatus} type="candidate" />
                </td>
                <td>
                  <div className="text-xs text-muted-foreground">
                    {candidate.ctcCurrent || candidate.ctcExpected ? (
                      <>
                        {candidate.ctcCurrent ? `Cur: ₹${candidate.ctcCurrent.toLocaleString()}` : 'Cur: -'}
                        <br />
                        {candidate.ctcExpected ? `Exp: ₹${candidate.ctcExpected.toLocaleString()}` : 'Exp: -'}
                      </>
                    ) : (
                      '-'
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex gap-1">
                    {candidate.flags.map((flag, i) => {
                      const Icon = flagIcons[flag.type];
                      return (
                        <Badge 
                          key={i} 
                          variant={flag.type}
                          className="gap-1"
                        >
                          <Icon className="w-3 h-3" />
                          {flag.type}
                        </Badge>
                      );
                    })}
                  </div>
                </td>
                <td>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(candidate.updatedAt).toLocaleDateString()}
                  </span>
                </td>
                <td>
                  <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
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
