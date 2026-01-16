import { 
  X, 
  Mail, 
  Phone, 
  FileText, 
  Briefcase, 
  GraduationCap,
  Calendar,
  ExternalLink,
  Edit2,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Candidate } from '@/types/ats';

interface CandidateDetailPanelProps {
  candidate: Candidate;
  onClose: () => void;
  onOpenFull: () => void;
}

export function CandidateDetailPanel({ candidate, onClose, onOpenFull }: CandidateDetailPanelProps) {
  return (
    <div className="w-[420px] h-full border-l border-border bg-card flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start justify-between bg-gradient-to-b from-muted/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-lg font-semibold shadow-lg">
            {candidate.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-lg font-bold">{candidate.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={candidate.currentStatus} type="candidate" />
              <span className="text-xs text-muted-foreground font-mono">
                {candidate.experience} yrs
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onOpenFull} title="Open full details">
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Contact info */}
      <div className="p-4 border-b border-border flex flex-wrap gap-3">
        <a 
          href={`mailto:${candidate.email}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          <Mail className="w-4 h-4" />
          {candidate.email}
        </a>
        {candidate.phone && (
          <a 
            href={`tel:${candidate.phone}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            <Phone className="w-4 h-4" />
            {candidate.phone}
          </a>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 h-auto py-0">
          <TabsTrigger 
            value="profile" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary py-3"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="resume" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary py-3"
          >
            Resume
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary py-3"
          >
            History
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="profile" className="p-4 space-y-5 mt-0">
            {/* Skills */}
            <div>
              <h3 className="text-xs font-medium mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                <Briefcase className="w-3.5 h-3.5" />
                Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                ))}
              </div>
            </div>

            {/* Flags */}
            {candidate.flags.length > 0 && (
              <div>
                <h3 className="text-xs font-medium mb-2 uppercase tracking-wide text-muted-foreground">Flags</h3>
                <div className="space-y-2">
                  {candidate.flags.map((flag, i) => (
                    <div 
                      key={i}
                      className="p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={flag.type} className="text-xs">{flag.type}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(flag.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{flag.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2 pt-2">
              {candidate.resumeUrl && (
                <Button variant="outline" size="sm" className="gap-2 flex-1">
                  <FileText className="w-4 h-4" />
                  Resume
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={onOpenFull}>
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button variant="glow" size="sm" className="gap-2 flex-1" onClick={onOpenFull}>
                <ExternalLink className="w-4 h-4" />
                Full View
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="resume" className="p-4 mt-0">
            {candidate.resumeParsed ? (
              <div className="space-y-5">
                {/* Summary */}
                {candidate.resumeParsed.summary && (
                  <div>
                    <h3 className="text-xs font-medium mb-2 uppercase tracking-wide text-muted-foreground">Summary</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {candidate.resumeParsed.summary}
                    </p>
                  </div>
                )}

                {/* Work History */}
                {candidate.resumeParsed.workHistory.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium mb-3 flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
                      <Briefcase className="w-3.5 h-3.5" />
                      Experience
                    </h3>
                    <div className="space-y-3">
                      {candidate.resumeParsed.workHistory.slice(0, 2).map((job, i) => (
                        <div key={i} className="relative pl-4 border-l-2 border-primary/30">
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
                          <h4 className="font-medium text-sm">{job.title}</h4>
                          <p className="text-xs text-primary">{job.company}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {job.startDate} — {job.endDate || 'Present'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {candidate.resumeParsed.education.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium mb-2 flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Education
                    </h3>
                    {candidate.resumeParsed.education.slice(0, 1).map((edu, i) => (
                      <div key={i}>
                        <h4 className="font-medium text-sm">{edu.institution}</h4>
                        <p className="text-xs text-muted-foreground">
                          {edu.degree} in {edu.field} ({edu.year})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No parsed resume data</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="p-4 mt-0">
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Application history</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={onOpenFull}>
                View Full Timeline
              </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
