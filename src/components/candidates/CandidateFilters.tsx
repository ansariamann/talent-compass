import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CandidateFilters as CandidateFiltersType, CandidateStatus } from '@/types/ats';

interface CandidateFiltersProps {
  filters: CandidateFiltersType;
  onFiltersChange: (filters: CandidateFiltersType) => void;
  clients: { id: string; name: string }[];
}

const statusOptions: { value: CandidateStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'screening', label: 'Screening' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'interviewed', label: 'Interviewed' },
  { value: 'offered', label: 'Offered' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'on_hold', label: 'On Hold' },
];

const skillOptions = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 
  'Java', 'Go', 'Rust', 'PostgreSQL', 'MongoDB', 
  'AWS', 'GCP', 'Kubernetes', 'Docker', 'DevOps',
];

export function CandidateFilters({ filters, onFiltersChange, clients }: CandidateFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = [
    filters.status?.length ? 1 : 0,
    filters.skills?.length ? 1 : 0,
    filters.location ? 1 : 0,
    filters.clientId ? 1 : 0,
    filters.minExperience !== undefined ? 1 : 0,
    filters.maxExperience !== undefined ? 1 : 0,
    filters.minCtcCurrent !== undefined ? 1 : 0,
    filters.maxCtcCurrent !== undefined ? 1 : 0,
    filters.minCtcExpected !== undefined ? 1 : 0,
    filters.maxCtcExpected !== undefined ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const toggleStatus = (status: CandidateStatus) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, status: updated.length ? updated : undefined });
  };

  const toggleSkill = (skill: string) => {
    const current = filters.skills || [];
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill];
    onFiltersChange({ ...filters, skills: updated.length ? updated : undefined });
  };

  const clearFilters = () => {
    onFiltersChange({
      excludeBlacklisted: true,
      excludeLeavers: true,
    });
  };

  return (
    <div className="border-b border-border bg-muted/30">
      {/* Filter bar */}
      <div className="px-6 py-3 flex items-center gap-3">
        <Button 
          variant={isExpanded ? "secondary" : "ghost"} 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="info" className="ml-1 h-5 w-5 p-0 justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Active filter chips */}
        {filters.status?.map(status => (
          <Badge 
            key={status} 
            variant="secondary" 
            className="gap-1 cursor-pointer hover:bg-destructive/20"
            onClick={() => toggleStatus(status)}
          >
            {statusOptions.find(s => s.value === status)?.label}
            <X className="w-3 h-3" />
          </Badge>
        ))}

        {filters.skills?.map(skill => (
          <Badge 
            key={skill} 
            variant="secondary" 
            className="gap-1 cursor-pointer hover:bg-destructive/20"
            onClick={() => toggleSkill(skill)}
          >
            {skill}
            <X className="w-3 h-3" />
          </Badge>
        ))}

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            Clear all
          </Button>
        )}
      </div>

      {/* Expanded filter panel */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-border bg-card animate-fade-in">
          <div className="grid grid-cols-3 gap-6">
            {/* Status */}
            <div>
              <h4 className="text-sm font-medium mb-3">Status</h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <Badge
                    key={option.value}
                    variant={filters.status?.includes(option.value) ? "info" : "outline"}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => toggleStatus(option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h4 className="text-sm font-medium mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {skillOptions.map(skill => (
                  <Badge
                    key={skill}
                    variant={filters.skills?.includes(skill) ? "info" : "outline"}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Client */}
            <div>
              <h4 className="text-sm font-medium mb-3">Client</h4>
              <div className="flex flex-wrap gap-2">
                {clients.map(client => (
                  <Badge
                    key={client.id}
                    variant={filters.clientId === client.id ? "info" : "outline"}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => onFiltersChange({ 
                      ...filters, 
                      clientId: filters.clientId === client.id ? undefined : client.id 
                    })}
                  >
                    {client.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              placeholder="Location"
              value={filters.location || ''}
              onChange={(e) => onFiltersChange({ ...filters, location: e.target.value || undefined })}
            />
            <Input
              type="number"
              placeholder="Min Exp"
              value={filters.minExperience ?? ''}
              onChange={(e) => onFiltersChange({ ...filters, minExperience: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              type="number"
              placeholder="Max Exp"
              value={filters.maxExperience ?? ''}
              onChange={(e) => onFiltersChange({ ...filters, maxExperience: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              type="number"
              placeholder="Min CTC Cur"
              value={filters.minCtcCurrent ?? ''}
              onChange={(e) => onFiltersChange({ ...filters, minCtcCurrent: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              type="number"
              placeholder="Max CTC Cur"
              value={filters.maxCtcCurrent ?? ''}
              onChange={(e) => onFiltersChange({ ...filters, maxCtcCurrent: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              type="number"
              placeholder="Min CTC Exp"
              value={filters.minCtcExpected ?? ''}
              onChange={(e) => onFiltersChange({ ...filters, minCtcExpected: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Input
              type="number"
              placeholder="Max CTC Exp"
              value={filters.maxCtcExpected ?? ''}
              onChange={(e) => onFiltersChange({ ...filters, maxCtcExpected: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
