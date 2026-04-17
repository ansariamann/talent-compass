import { useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Briefcase,
  Calendar,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  User,
  Video,
} from 'lucide-react';

import { candidatesApi } from '@/lib/api';
import { useApplicationsByCandidate } from '@/hooks/useApplications';
import { useClients } from '@/hooks/useClients';
import type { ApplicationTimeline, Candidate } from '@/types/ats';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from './StatusBadge';
import { CandidateWorkflowActions } from './CandidateWorkflowActions';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCandidateUpdated: (candidate: Candidate) => void;
}

function formatDateTime(value?: string): string {
  if (!value) return 'Not specified';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : format(date, 'MMM d, yyyy - h:mm a');
}

function getMostRecentWorkSummary(candidate: Candidate): { title?: string; company?: string; dates?: string } | null {
  const work = candidate.resumeParsed?.workHistory || [];
  if (!Array.isArray(work) || work.length === 0) return null;
  const first = work[0];
  if (!first) return null;
  const dates = first.startDate ? `${first.startDate} - ${first.endDate || 'Present'}` : undefined;
  return { title: first.title, company: first.company, dates };
}

function toReadableLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value == null || value === '') return 'Not specified';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function renderUnknownObject(value: Record<string, unknown>) {
  return (
    <div className="space-y-2">
      {Object.entries(value).map(([key, entry]) => {
        if (entry == null || entry === '') return null;
        if (Array.isArray(entry)) {
          const items = entry.map((item) => formatValue(item)).filter(Boolean);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <div className="text-xs text-muted-foreground">{toReadableLabel(key)}</div>
              <div className="mt-1 text-sm text-foreground">{items.join(', ')}</div>
            </div>
          );
        }
        if (typeof entry === 'object') {
          return (
            <div key={key}>
              <div className="text-xs text-muted-foreground">{toReadableLabel(key)}</div>
              <div className="mt-1 rounded-md border border-border bg-muted/20 p-3">
                {renderUnknownObject(entry as Record<string, unknown>)}
              </div>
            </div>
          );
        }
        return (
          <div key={key}>
            <div className="text-xs text-muted-foreground">{toReadableLabel(key)}</div>
            <div className="mt-1 text-sm text-foreground">{String(entry)}</div>
          </div>
        );
      })}
    </div>
  );
}

function renderOtherDetails(otherDetails?: Record<string, unknown>) {
  if (!otherDetails) {
    return <div className="text-sm text-muted-foreground">Not specified</div>;
  }

  const unmappedSections =
    typeof otherDetails.unmapped_resume_sections === 'object' && otherDetails.unmapped_resume_sections
      ? (otherDetails.unmapped_resume_sections as Record<string, unknown>)
      : undefined;
  const profileLinks = Array.isArray(otherDetails.profile_links)
    ? otherDetails.profile_links.map((item) => formatValue(item)).filter(Boolean)
    : [];

  return (
    <div className="space-y-4">
      {unmappedSections && Object.keys(unmappedSections).length > 0 ? (
        <div className="grid gap-3">
          {Object.entries(unmappedSections).map(([sectionName, rawSection]) => {
            if (!rawSection || typeof rawSection !== 'object') return null;
            const section = rawSection as Record<string, unknown>;
            const items = Array.isArray(section.items)
              ? section.items.map((item) => formatValue(item)).filter(Boolean)
              : [];
            const text = typeof section.text === 'string' ? section.text : '';

            return (
              <div key={sectionName} className="rounded-lg border border-border bg-card p-3">
                <div className="text-xs text-muted-foreground">{toReadableLabel(sectionName)}</div>
                {items.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {items.map((item, index) => (
                      <div key={`${sectionName}-${index}`} className="text-sm text-foreground">
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 whitespace-pre-wrap text-sm text-foreground">{text || 'Not specified'}</div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {profileLinks.length > 0 ? (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Profile Links</div>
          <div className="mt-2 space-y-2">
            {profileLinks.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="block break-all text-sm text-primary underline-offset-4 hover:underline"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-3">
        <div className="text-xs text-muted-foreground">Additional Parsed Details</div>
        <div className="mt-2">
          {renderUnknownObject(
            Object.fromEntries(
              Object.entries(otherDetails).filter(
                ([key]) =>
                  key !== 'unmapped_resume_sections' &&
                  key !== 'raw_text_excerpt' &&
                  key !== 'detected_urls' &&
                  key !== 'profile_links'
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function CandidateDetailModal({
  candidate,
  open,
  onOpenChange,
  onCandidateUpdated,
}: CandidateDetailModalProps) {
  const [timeline, setTimeline] = useState<ApplicationTimeline[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const { data: applications = [], refetch: refetchApplications } = useApplicationsByCandidate(candidate?.id);
  const { data: clients = [] } = useClients();

  const workSummary = useMemo(() => (candidate ? getMostRecentWorkSummary(candidate) : null), [candidate]);

  useEffect(() => {
    if (!candidate?.id || !open) {
      setTimeline([]);
      return;
    }

    setTimelineLoading(true);
    candidatesApi
      .getTimeline(candidate.id)
      .then(setTimeline)
      .catch(() => setTimeline([]))
      .finally(() => setTimelineLoading(false));
  }, [candidate?.id, open]);

  if (!candidate) return null;

  const resumeUrl = candidate.resumeUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[88vh] p-0 gap-0 flex flex-col bg-card border-border overflow-hidden">
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                {candidate.name}
                <StatusBadge status={candidate.currentStatus} type="candidate" />
              </DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {candidate.experience} yrs
                </span>
                {candidate.company && (
                  <span className="inline-flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {candidate.company}
                  </span>
                )}
                <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="w-4 h-4" />
                  <span className="truncate max-w-[320px]">{candidate.email}</span>
                </a>
                {candidate.phone && (
                  <a href={`tel:${candidate.phone}`} className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                    <Phone className="w-4 h-4" />
                    {candidate.phone}
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {resumeUrl && (
                <>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(resumeUrl, '_blank')}>
                    <ExternalLink className="w-4 h-4" />
                    Open Resume
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = resumeUrl;
                      a.download = `${candidate.name}-resume.pdf`;
                      a.click();
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 h-auto py-0">
            <TabsTrigger value="profile" className="rounded-none py-3">Profile</TabsTrigger>
            <TabsTrigger value="resume" className="rounded-none py-3">Resume</TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-none py-3">Timeline</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="profile" className="p-6 mt-0 space-y-6">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Company</div>
                  <div className="mt-2 text-sm">{candidate.company || 'Not specified'}</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Location</div>
                  <div className="mt-2 text-sm">{candidate.location || 'Not specified'}</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">CTC</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {candidate.ctcCurrent ? `Current: Rs ${candidate.ctcCurrent.toLocaleString()}` : 'Current: -'}
                    {' | '}
                    {candidate.ctcExpected ? `Expected: Rs ${candidate.ctcExpected.toLocaleString()}` : 'Expected: -'}
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Skills
                  </h3>
                  <Badge variant="outline" className="font-mono text-xs">
                    {candidate.skills.length}
                  </Badge>
                </div>
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No skills listed</span>
                  ) : (
                    candidate.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))
                  )}
                </div>
              </section>

              {candidate.remark && (
                <section>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Notes
                  </h3>
                  <Separator className="my-3" />
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{candidate.remark}</div>
                </section>
              )}

              {workSummary && (
                <section>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Most Recent Role
                  </h3>
                  <Separator className="my-3" />
                  <div className="text-sm">
                    <div className="font-medium">{workSummary.title || 'Role'}</div>
                    <div className="text-muted-foreground">{workSummary.company || candidate.company || 'Company'}</div>
                    {workSummary.dates && <div className="text-xs text-muted-foreground font-mono mt-1">{workSummary.dates}</div>}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-sm font-semibold">All Candidate Details</h3>
                <Separator className="my-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Candidate ID</div>
                    <div className="mt-1 text-sm break-all">{candidate.id}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Client ID</div>
                    <div className="mt-1 text-sm break-all">{candidate.clientId || 'Not specified'}</div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Date of Birth</div>
                    <div className="mt-1 text-sm">{candidate.dateOfBirth || 'Not specified'}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Key Skill</div>
                    <div className="mt-1 text-sm">{candidate.keySkill || 'Not specified'}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Total Experience (Years)</div>
                    <div className="mt-1 text-sm">{candidate.totalExperienceYears ?? 'Not specified'}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Notice Period (Days)</div>
                    <div className="mt-1 text-sm">{candidate.noticePeriodDays ?? 'Not specified'}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Source</div>
                    <div className="mt-1 text-sm">{candidate.source || 'Not specified'}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">LinkedIn URL</div>
                    <div className="mt-1 text-sm break-all">
                      {candidate.linkedinUrl ? (
                        <a
                          href={candidate.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {candidate.linkedinUrl}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Assigned Client</div>
                    <div className="mt-1 text-sm">{candidate.client || 'Not specified'}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Assigned User ID</div>
                    <div className="mt-1 text-sm break-all">{candidate.assignedUserId || 'Not specified'}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Resume File Path</div>
                    <div className="mt-1 text-sm break-all">{candidate.resumeFilePath || 'Not specified'}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Resume URL</div>
                    <div className="mt-1 text-sm break-all">{candidate.resumeUrl || 'Not specified'}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Current Status</div>
                    <div className="mt-1 text-sm">{candidate.currentStatus}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Flags</div>
                    <div className="mt-1 text-sm">
                      Direct Interview: {candidate.isDirectInterview ? 'Yes' : 'No'} | Blacklisted:{' '}
                      {candidate.isBlacklisted ? 'Yes' : 'No'} | Leaver: {candidate.isLeaver ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Created At</div>
                    <div className="mt-1 text-sm">{formatDateTime(candidate.createdAt)}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-xs text-muted-foreground">Updated At</div>
                    <div className="mt-1 text-sm">{formatDateTime(candidate.updatedAt)}</div>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-border bg-card p-3">
                  <div className="text-xs text-muted-foreground">Previous Employment</div>
                  <div className="mt-2 space-y-3">
                    {candidate.previousEmployment && candidate.previousEmployment.length > 0 ? (
                      candidate.previousEmployment.map((employment, index) => (
                        <div key={index} className="rounded-md border border-border bg-muted/20 p-3">
                          <div className="font-medium text-foreground">
                            {typeof employment.company === 'string' && employment.company
                              ? employment.company
                              : 'Company not specified'}
                          </div>
                          {typeof employment.position === 'string' && employment.position ? (
                            <div className="mt-1 text-sm text-muted-foreground">{employment.position}</div>
                          ) : null}
                          {typeof employment.duration === 'string' && employment.duration ? (
                            <div className="mt-1 text-xs text-muted-foreground">{employment.duration}</div>
                          ) : null}
                          {!employment.duration &&
                          (typeof employment.start_date === 'string' || typeof employment.end_date === 'string') ? (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {[employment.start_date, employment.end_date].filter(Boolean).join(' - ')}
                            </div>
                          ) : null}
                          {typeof employment.description === 'string' && employment.description ? (
                            <div className="mt-2 text-sm text-foreground whitespace-pre-wrap">
                              {employment.description}
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">Not specified</div>
                    )}
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-border bg-card p-3">
                  <div className="text-xs text-muted-foreground">Other Details</div>
                  <div className="mt-2">{renderOtherDetails(candidate.otherDetails)}</div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="resume" className="p-6 mt-0">
              {resumeUrl ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border overflow-hidden bg-muted/10 min-h-[460px]">
                    <iframe src={resumeUrl} className="h-[460px] w-full" title={`Resume for ${candidate.name}`} />
                  </div>

                  {candidate.resumeParsed ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {candidate.resumeParsed.summary && (
                        <div className="rounded-lg border border-border bg-card p-4 md:col-span-2">
                          <div className="text-sm font-semibold">Parsed Summary</div>
                          <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {candidate.resumeParsed.summary}
                          </div>
                        </div>
                      )}
                      {candidate.resumeParsed.education.length > 0 && (
                        <div className="rounded-lg border border-border bg-card p-4">
                          <div className="text-sm font-semibold">Education</div>
                          <div className="mt-3 text-sm text-muted-foreground">
                            {candidate.resumeParsed.education.slice(0, 2).map((education, index) => (
                              <div key={index} className="mb-2">
                                <div className="font-medium text-foreground">{education.institution}</div>
                                <div>{education.degree} in {education.field} ({education.year})</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {candidate.resumeParsed.workHistory.length > 0 && (
                        <div className="rounded-lg border border-border bg-card p-4">
                          <div className="text-sm font-semibold">Work History</div>
                          <div className="mt-3 text-sm text-muted-foreground">
                            {candidate.resumeParsed.workHistory.slice(0, 3).map((job, index) => (
                              <div key={index} className="mb-3">
                                <div className="font-medium text-foreground">{job.title}</div>
                                <div>{job.company}</div>
                                <div className="text-xs font-mono mt-1">{job.startDate} - {job.endDate || 'Present'}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No parsed resume data.</div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[460px] text-muted-foreground">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No resume uploaded</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="p-6 mt-0">
              {timelineLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading timeline...</div>
              ) : timeline.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No timeline events yet.</div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event) => {
                    const isInterview = event.eventType === 'interview_round';
                    const isFeedback = event.eventType === 'feedback';

                    const icon = isInterview ? (
                      event.interviewDetails?.mode === 'video' ? <Video className="h-3.5 w-3.5" /> :
                      event.interviewDetails?.mode === 'phone' ? <Phone className="h-3.5 w-3.5" /> :
                      <MapPin className="h-3.5 w-3.5" />
                    ) : isFeedback ? (
                      <MessageSquare className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    );

                    return (
                      <div key={event.id} className="flex gap-4">
                        <div className="relative flex flex-col items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                          <div className="flex-1 w-px bg-border" />
                        </div>
                        <div className="pb-4 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {isInterview
                                ? `Interview Round ${event.interviewDetails?.roundNumber || 1}`
                                : isFeedback
                                ? `Feedback - Round ${event.feedbackDetails?.roundNumber || 1}`
                                : event.state || 'Status Update'}
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              {icon}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(event.timestamp), 'MMM d, yyyy - h:mm a')}
                            {event.actor !== 'system' && ` - by ${event.actor}`}
                          </p>

                          {isFeedback && event.feedbackDetails && (
                            <div className="mt-2 flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${star <= event.feedbackDetails!.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
                                />
                              ))}
                            </div>
                          )}

                          {event.note && (
                            <div className="mt-2 rounded-md bg-muted p-2 text-sm text-muted-foreground">
                              {event.note}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="border-t border-border p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {applications.length} client application{applications.length === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Updated {formatDistanceToNow(new Date(candidate.updatedAt), { addSuffix: true })}
            </span>
          </div>
          <CandidateWorkflowActions
            candidate={candidate}
            timeline={timeline}
            applications={applications}
            clients={clients}
            showRejectAction={false}
            onUpdated={(updatedCandidate) => {
              onCandidateUpdated(updatedCandidate);
              candidatesApi.getTimeline(updatedCandidate.id).then(setTimeline).catch(() => undefined);
            }}
            onAcknowledged={() => {
              refetchApplications();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
