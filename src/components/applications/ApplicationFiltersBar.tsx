import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Flag, Archive } from 'lucide-react';
import type { ApplicationFilters } from '@/types/ats';

interface ApplicationFiltersBarProps {
  filters: ApplicationFilters;
  onFiltersChange: (filters: ApplicationFilters) => void;
}

export function ApplicationFiltersBar({ filters, onFiltersChange }: ApplicationFiltersBarProps) {
  return (
    <div className="flex items-center gap-6 p-4 border-b border-border bg-card/50">
      <div className="flex items-center gap-2">
        <Switch
          id="flagged-only"
          checked={filters.flaggedOnly || false}
          onCheckedChange={(checked) =>
            onFiltersChange({ ...filters, flaggedOnly: checked })
          }
        />
        <Label htmlFor="flagged-only" className="flex items-center gap-2 cursor-pointer">
          <Flag className="w-4 h-4 text-warning" />
          Flagged Only
        </Label>
        {filters.flaggedOnly && (
          <Badge variant="warning" className="ml-1">Active</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="include-deleted"
          checked={filters.includeDeleted || false}
          onCheckedChange={(checked) =>
            onFiltersChange({ ...filters, includeDeleted: checked })
          }
        />
        <Label htmlFor="include-deleted" className="flex items-center gap-2 cursor-pointer">
          <Archive className="w-4 h-4 text-muted-foreground" />
          Show Archived
        </Label>
        {filters.includeDeleted && (
          <Badge variant="secondary" className="ml-1">Active</Badge>
        )}
      </div>
    </div>
  );
}