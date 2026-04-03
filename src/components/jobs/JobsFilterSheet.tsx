import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, X } from 'lucide-react';
import type { JobFilters } from '@/types/ats';

const SORT_ITEMS: Array<{ value: NonNullable<JobFilters['sort']>; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'salary_desc', label: 'Salary (High to Low)' },
  { value: 'salary_asc', label: 'Salary (Low to High)' },
  { value: 'exp_desc', label: 'Experience (High to Low)' },
  { value: 'exp_asc', label: 'Experience (Low to High)' },
  { value: 'location_asc', label: 'Location (A to Z)' },
  { value: 'company_asc', label: 'Company (A to Z)' },
];

function cleanNumber(v: string): number | undefined {
  const n = Number(v);
  if (Number.isNaN(n)) return undefined;
  return n;
}

export function JobsFilterSheet({
  value,
  onChange,
}: {
  value: JobFilters;
  onChange: (next: JobFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<JobFilters>(value);

  useEffect(() => {
    if (!open) setDraft(value);
  }, [open, value]);

  const activeCount = useMemo(() => {
    const keys: Array<keyof JobFilters> = [
      'location',
      'field',
      'minExperience',
      'maxExperience',
      'minSalaryLpa',
      'maxSalaryLpa',
    ];
    return keys.reduce((acc, k) => (value[k] == null || value[k] === '' ? acc : acc + 1), 0);
  }, [value]);

  const clear = () => {
    onChange({ ...value, location: undefined, field: undefined, minExperience: undefined, maxExperience: undefined, minSalaryLpa: undefined, maxSalaryLpa: undefined, sort: 'newest' });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:w-[520px]">
        <SheetHeader>
          <SheetTitle>Filter Jobs</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="job-location">Location</Label>
            <Input
              id="job-location"
              value={draft.location || ''}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value || undefined }))}
              placeholder="e.g. Bengaluru, Remote"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-field">Field / Skill Keyword</Label>
            <Input
              id="job-field"
              value={draft.field || ''}
              onChange={(e) => setDraft((d) => ({ ...d, field: e.target.value || undefined }))}
              placeholder="e.g. Python, React, Data"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-exp">Min Experience</Label>
              <Input
                id="min-exp"
                type="number"
                min={0}
                max={60}
                value={draft.minExperience ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, minExperience: e.target.value === '' ? undefined : cleanNumber(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-exp">Max Experience</Label>
              <Input
                id="max-exp"
                type="number"
                min={0}
                max={60}
                value={draft.maxExperience ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, maxExperience: e.target.value === '' ? undefined : cleanNumber(e.target.value) }))}
                placeholder="10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-salary">Min Salary (LPA)</Label>
              <Input
                id="min-salary"
                type="number"
                min={0}
                step={0.1}
                value={draft.minSalaryLpa ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, minSalaryLpa: e.target.value === '' ? undefined : cleanNumber(e.target.value) }))}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-salary">Max Salary (LPA)</Label>
              <Input
                id="max-salary"
                type="number"
                min={0}
                step={0.1}
                value={draft.maxSalaryLpa ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, maxSalaryLpa: e.target.value === '' ? undefined : cleanNumber(e.target.value) }))}
                placeholder="30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select
              value={draft.sort || 'newest'}
              onValueChange={(v) => setDraft((d) => ({ ...d, sort: v as JobFilters['sort'] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_ITEMS.map((it) => (
                  <SelectItem key={it.value} value={it.value}>
                    {it.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row gap-2">
          <Button variant="ghost" onClick={clear} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onChange({ ...value, ...draft });
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

