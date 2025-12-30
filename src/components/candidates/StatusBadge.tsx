import { Badge } from '@/components/ui/badge';
import type { CandidateStatus, ApplicationStatus } from '@/types/ats';

const candidateStatusConfig: Record<CandidateStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral' }> = {
  new: { label: 'New', variant: 'info' },
  screening: { label: 'Screening', variant: 'pending' },
  submitted: { label: 'Submitted', variant: 'info' },
  interview_scheduled: { label: 'Interview Scheduled', variant: 'warning' },
  interviewed: { label: 'Interviewed', variant: 'warning' },
  offered: { label: 'Offered', variant: 'success' },
  hired: { label: 'Hired', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  withdrawn: { label: 'Withdrawn', variant: 'neutral' },
  on_hold: { label: 'On Hold', variant: 'neutral' },
};

const applicationStatusConfig: Record<ApplicationStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral' }> = {
  pending: { label: 'Pending', variant: 'neutral' },
  in_review: { label: 'In Review', variant: 'info' },
  shortlisted: { label: 'Shortlisted', variant: 'warning' },
  interview: { label: 'Interview', variant: 'pending' },
  offer: { label: 'Offer', variant: 'success' },
  accepted: { label: 'Accepted', variant: 'success' },
  declined: { label: 'Declined', variant: 'error' },
  rejected: { label: 'Rejected', variant: 'error' },
};

interface StatusBadgeProps {
  status: CandidateStatus | ApplicationStatus;
  type?: 'candidate' | 'application';
  className?: string;
}

export function StatusBadge({ status, type = 'candidate', className }: StatusBadgeProps) {
  const config = type === 'candidate' 
    ? candidateStatusConfig[status as CandidateStatus]
    : applicationStatusConfig[status as ApplicationStatus];

  if (!config) {
    return <Badge variant="neutral" className={className}>{status}</Badge>;
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
