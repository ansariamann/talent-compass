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
}

export function CandidateDetailPanel({ candidate, onClose }: CandidateDetailPanelProps) {
  return (
    <div className="w-[480px] h-full border-l border-border bg-card flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-lg font-medium">
            {candidate.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{candidate.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={candidate.currentStatus} type="candidate" />
              <span className="text-xs text-muted-foreground font-mono">
                {candidate.experience} yrs exp
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Contact info */}
      <div className="p-4 border-b border-border flex gap-4">
        <a 
          href={`mailto:${candidate.email}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Mail className="w-4 h-4" />
          {candidate.email}
        </a>
        {candidate.phone && (
          <a 
            href={`tel:${candidate.phone}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="resume" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
          >
            Resume
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
          >
            History
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="profile" className="p-4 space-y-6 mt-0">
            {/* Skills */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map(skill => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>

            {/* Flags */}
            {candidate.flags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Flags</h3>
                <div className="space-y-2">
                  {candidate.flags.map((flag, i) => (
                    <div 
                      key={i}
                      className="p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={flag.type}>{flag.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(flag.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{flag.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resume actions */}
            <div className="flex gap-2">
              {candidate.resumeUrl && (
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  View Resume
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
              <Button variant="ghost" className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="resume" className="p-4 mt-0">
            {candidate.resumeParsed ? (
              <div className="space-y-6">
                {/* Summary */}
                {candidate.resumeParsed.summary && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Summary</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {candidate.resumeParsed.summary}
                    </p>
                  </div>
                )}

                {/* Work History */}
                {candidate.resumeParsed.workHistory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      Experience
                    </h3>
                    <div className="space-y-4">
                      {candidate.resumeParsed.workHistory.map((job, i) => (
                        <div key={i} className="relative pl-4 border-l-2 border-border">
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
                          <h4 className="font-medium">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {job.startDate} — {job.endDate || 'Present'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">{job.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {candidate.resumeParsed.education.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      Education
                    </h3>
                    <div className="space-y-3">
                      {candidate.resumeParsed.education.map((edu, i) => (
                        <div key={i}>
                          <h4 className="font-medium">{edu.institution}</h4>
                          <p className="text-sm text-muted-foreground">
                            {edu.degree} in {edu.field} ({edu.year})
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {candidate.resumeParsed.certifications.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.resumeParsed.certifications.map(cert => (
                        <Badge key={cert} variant="outline">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No parsed resume data available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="p-4 mt-0">
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Application history will appear here</p>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
