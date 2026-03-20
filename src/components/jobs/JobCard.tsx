import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Briefcase, IndianRupee, Calendar } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { Job } from '@/types/ats';
import { extractPreferredSkills, extractRequiredSkills, formatExperienceYears, formatLpa, summarizeRequirements } from './jobText';

export function JobCard({
  job,
  onClick,
}: {
  job: Job;
  onClick: () => void;
}) {
  const requiredSkills = extractRequiredSkills(job.requirements);
  const preferredSkills = extractPreferredSkills(job.requirements);
  const description = summarizeRequirements(job.requirements);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className="group cursor-pointer hover:shadow-md transition-shadow border-border bg-card/80 backdrop-blur-sm"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold leading-tight truncate">{job.title}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{job.companyName}</span>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">
                {job.postingDate ? formatDistanceToNow(parseISO(job.postingDate), { addSuffix: true }) : 'Recently'}
              </span>
            </div>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{job.location || 'Remote/Any'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground justify-end">
            <Briefcase className="h-4 w-4" />
            <span className="truncate">{formatExperienceYears(job.experienceRequired)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <IndianRupee className="h-4 w-4" />
            <span className="truncate">{formatLpa(job.salaryLpa)}</span>
          </div>
        </div>

        {description && (
          <div className="text-sm text-foreground/80 leading-relaxed">
            {description}
          </div>
        )}

        {(requiredSkills.length > 0 || preferredSkills.length > 0) && (
          <div className="space-y-2">
            {requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.slice(0, 6).map((s) => (
                  <Badge key={`req-${job.id}-${s}`} variant="default" className="text-xs font-medium">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {preferredSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {preferredSkills.slice(0, 4).map((s) => (
                  <Badge key={`pref-${job.id}-${s}`} variant="outline" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          Open job profile
        </div>
      </CardContent>
    </Card>
  );
}

