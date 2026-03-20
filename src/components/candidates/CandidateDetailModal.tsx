import { useMemo } from 'react';
import {
  Mail,
  Phone,
  FileText,
  Briefcase,
  GraduationCap,
  Calendar,
  Download,
  ExternalLink,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from './StatusBadge';
import type { Candidate } from '@/types/ats';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getMostRecentWorkSummary(candidate: Candidate): { title?: string; company?: string; dates?: string } | null {
  const work = candidate.resumeParsed?.workHistory || [];
  if (!Array.isArray(work) || work.length === 0) return null;
  const first = work[0];
  if (!first) return null;
  const dates = first.startDate ? `${first.startDate} - ${first.endDate || 'Present'}` : undefined;
  return { title: first.title, company: first.company, dates };
}

export function CandidateDetailModal({ candidate, open, onOpenChange }: CandidateDetailModalProps) {
  const workSummary = useMemo(() => (candidate ? getMostRecentWorkSummary(candidate) : null), [candidate]);
  if (!candidate) return null;

  const resumeUrl = candidate.resumeUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 flex flex-col bg-card border-border overflow-hidden">
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
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
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 h-auto py-0">
            <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary py-3">
              Profile
            </TabsTrigger>
            <TabsTrigger value="resume" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary py-3">
              Resume
            </TabsTrigger>
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
                    <Calendar className="w-4 h-4 text-primary" />
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
                          <div className="text-sm font-semibold flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-primary" />
                            Education
                          </div>
                          <div className="mt-3 text-sm text-muted-foreground">
                            {candidate.resumeParsed.education.slice(0, 2).map((e, i) => (
                              <div key={i} className="mb-2">
                                <div className="font-medium text-foreground">{e.institution}</div>
                                <div>{e.degree} in {e.field} ({e.year})</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {candidate.resumeParsed.workHistory.length > 0 && (
                        <div className="rounded-lg border border-border bg-card p-4">
                          <div className="text-sm font-semibold flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" />
                            Work History
                          </div>
                          <div className="mt-3 text-sm text-muted-foreground">
                            {candidate.resumeParsed.workHistory.slice(0, 3).map((j, i) => (
                              <div key={i} className="mb-3">
                                <div className="font-medium text-foreground">{j.title}</div>
                                <div>{j.company}</div>
                                <div className="text-xs font-mono mt-1">{j.startDate} - {j.endDate || 'Present'}</div>
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
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
