import { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  FileText, 
  Briefcase, 
  GraduationCap,
  Calendar,
  ExternalLink,
  Edit2,
  Check,
  ChevronRight,
  Clock,
  User,
  Shield,
  Download,
  Maximize2,
  Minimize2,
  Save,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from './StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { Candidate, AuditEntry } from '@/types/ats';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock audit entries for FSM timeline
const mockAuditEntries: AuditEntry[] = [
  {
    id: 'aud_001',
    action: 'status_change',
    fromStatus: 'new',
    toStatus: 'screening',
    performedBy: 'usr_001',
    performedByName: 'Sarah Chen',
    timestamp: '2024-12-20T10:30:00Z',
  },
  {
    id: 'aud_002',
    action: 'resume_parsed',
    performedBy: 'system',
    performedByName: 'System',
    timestamp: '2024-12-20T10:31:00Z',
    metadata: { parser: 'ai_parser_v2', confidence: 0.95 },
  },
  {
    id: 'aud_003',
    action: 'flag_added',
    performedBy: 'usr_001',
    performedByName: 'Sarah Chen',
    timestamp: '2024-12-21T14:00:00Z',
    metadata: { flagType: 'verified', reason: 'References checked' },
  },
  {
    id: 'aud_004',
    action: 'profile_updated',
    performedBy: 'usr_001',
    performedByName: 'Sarah Chen',
    timestamp: '2024-12-22T09:15:00Z',
    metadata: { fields: ['skills', 'experience'] },
  },
];

function getActionIcon(action: string) {
  switch (action) {
    case 'status_change': return <ChevronRight className="w-3.5 h-3.5" />;
    case 'resume_parsed': return <FileText className="w-3.5 h-3.5" />;
    case 'flag_added': return <Shield className="w-3.5 h-3.5" />;
    case 'profile_updated': return <Edit2 className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
}

function getActionLabel(entry: AuditEntry): string {
  switch (entry.action) {
    case 'status_change':
      return `Status changed from ${entry.fromStatus} to ${entry.toStatus}`;
    case 'resume_parsed':
      return 'Resume automatically parsed';
    case 'flag_added':
      return `Flag added: ${(entry.metadata as { flagType?: string })?.flagType || 'unknown'}`;
    case 'profile_updated':
      return `Profile updated: ${((entry.metadata as { fields?: string[] })?.fields || []).join(', ')}`;
    default:
      return entry.action;
  }
}

export function CandidateDetailModal({ candidate, open, onOpenChange }: CandidateDetailModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCandidate, setEditedCandidate] = useState(candidate);

  // Update edited candidate when candidate prop changes
  useEffect(() => {
    if (candidate) {
      setEditedCandidate(candidate);
    }
  }, [candidate]);

  const handleSave = () => {
    // In real app, call API to save
    console.log('Saving candidate:', editedCandidate);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedCandidate(candidate);
    setIsEditing(false);
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          ${isFullscreen ? 'max-w-[95vw] h-[95vh]' : 'max-w-4xl h-[85vh]'} 
          p-0 gap-0 flex flex-col bg-card border-border overflow-hidden
        `}
      >
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-xl font-semibold shadow-lg">
                {candidate.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  {candidate.name}
                  <StatusBadge status={candidate.currentStatus} type="candidate" />
                </DialogTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <a href={`mailto:${candidate.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                    {candidate.email}
                  </a>
                  {candidate.phone && (
                    <a href={`tel:${candidate.phone}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                      {candidate.phone}
                    </a>
                  )}
                  <span className="flex items-center gap-1.5 font-mono">
                    <Briefcase className="w-3.5 h-3.5" />
                    {candidate.experience} years exp
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-1.5">
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button variant="glow" size="sm" onClick={handleSave} className="gap-1.5">
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/30 px-4 h-auto py-0 flex-shrink-0">
            {['Profile', 'Resume', 'PDF View', 'Audit Trail'].map((tab) => (
              <TabsTrigger 
                key={tab}
                value={tab.toLowerCase().replace(' ', '-')}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary py-3 px-4 font-medium"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1">
            {/* Profile Tab */}
            <TabsContent value="profile" className="p-6 space-y-6 mt-0">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Editable Info */}
                <div className="space-y-6">
                  {/* Skills */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="w-4 h-4" />
                      Skills
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedCandidate.skills.join(', ')}
                        onChange={(e) => setEditedCandidate({
                          ...editedCandidate,
                          skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        placeholder="Python, React, PostgreSQL..."
                        className="bg-muted/50"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map(skill => (
                          <Badge key={skill} variant="secondary" className="px-3 py-1">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Experience */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Years of Experience
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedCandidate.experience}
                        onChange={(e) => setEditedCandidate({
                          ...editedCandidate,
                          experience: parseInt(e.target.value) || 0
                        })}
                        className="w-32 bg-muted/50"
                      />
                    ) : (
                      <p className="text-lg font-mono">{candidate.experience} years</p>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      Contact Information
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          type="email"
                          value={editedCandidate.email}
                          onChange={(e) => setEditedCandidate({ ...editedCandidate, email: e.target.value })}
                          placeholder="Email"
                          className="bg-muted/50"
                        />
                        <Input
                          type="tel"
                          value={editedCandidate.phone || ''}
                          onChange={(e) => setEditedCandidate({ ...editedCandidate, phone: e.target.value })}
                          placeholder="Phone"
                          className="bg-muted/50"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <p>{candidate.email}</p>
                        {candidate.phone && <p>{candidate.phone}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Flags & Summary */}
                <div className="space-y-6">
                  {/* Flags */}
                  {candidate.flags.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        Flags
                      </label>
                      <div className="space-y-2">
                        {candidate.flags.map((flag, i) => (
                          <div 
                            key={i}
                            className="p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={flag.type}>{flag.type}</Badge>
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

                  {/* Summary */}
                  {candidate.resumeParsed?.summary && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        Summary
                      </label>
                      {isEditing ? (
                        <Textarea
                          value={editedCandidate.resumeParsed?.summary || ''}
                          onChange={(e) => setEditedCandidate({
                            ...editedCandidate,
                            resumeParsed: { ...editedCandidate.resumeParsed!, summary: e.target.value }
                          })}
                          className="min-h-[100px] bg-muted/50"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {candidate.resumeParsed.summary}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Resume Tab */}
            <TabsContent value="resume" className="p-6 space-y-6 mt-0">
              {candidate.resumeParsed ? (
                <div className="grid grid-cols-2 gap-6">
                  {/* Work History */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      Work Experience
                    </h3>
                    <div className="space-y-4">
                      {candidate.resumeParsed.workHistory.map((job, i) => (
                        <div 
                          key={i} 
                          className="relative pl-5 border-l-2 border-primary/30 hover:border-primary transition-colors"
                        >
                          <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                          <h4 className="font-semibold">{job.title}</h4>
                          <p className="text-sm text-primary">{job.company}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {job.startDate} — {job.endDate || 'Present'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{job.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education & Certs */}
                  <div className="space-y-6">
                    {/* Education */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        Education
                      </h3>
                      <div className="space-y-3">
                        {candidate.resumeParsed.education.map((edu, i) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border">
                            <h4 className="font-medium">{edu.institution}</h4>
                            <p className="text-sm text-muted-foreground">
                              {edu.degree} in {edu.field}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              Class of {edu.year}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Certifications */}
                    {candidate.resumeParsed.certifications.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Certifications</h3>
                        <div className="flex flex-wrap gap-2">
                          {candidate.resumeParsed.certifications.map(cert => (
                            <Badge key={cert} variant="outline" className="px-3 py-1.5">
                              <Check className="w-3 h-3 mr-1.5 text-status-success" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {candidate.resumeParsed.languages.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Languages</h3>
                        <div className="flex flex-wrap gap-2">
                          {candidate.resumeParsed.languages.map(lang => (
                            <Badge key={lang} variant="secondary">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">No parsed resume data available</p>
                  <p className="text-sm mt-1">Upload a resume to extract information</p>
                </div>
              )}
            </TabsContent>

            {/* PDF View Tab */}
            <TabsContent value="pdf-view" className="mt-0 h-full">
              {candidate.resumeUrl ? (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-medium">Resume Document</span>
                      <Badge variant="secondary" className="font-mono text-xs">PDF</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Open in new tab
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 bg-muted/20 flex items-center justify-center min-h-[400px]">
                    {/* PDF Viewer Placeholder - In production, use react-pdf or similar */}
                    <div className="text-center p-8">
                      <div className="w-64 h-80 mx-auto bg-card border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-4 mb-4">
                        <FileText className="w-16 h-16 text-muted-foreground/30" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium">PDF Preview</p>
                          <p className="text-xs mt-1">{candidate.resumeUrl}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Connect to backend to enable PDF viewing
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No resume uploaded</p>
                    <Button variant="outline" className="mt-4 gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Upload Resume
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Audit Trail Tab - FSM Timeline */}
            <TabsContent value="audit-trail" className="p-6 mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    State Machine History
                  </h3>
                  <Badge variant="outline" className="font-mono text-xs">
                    {mockAuditEntries.length} events
                  </Badge>
                </div>
                
                <Separator />

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />
                  
                  <div className="space-y-0">
                    {mockAuditEntries.map((entry, i) => (
                      <div 
                        key={entry.id} 
                        className="relative flex gap-4 py-4 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors group"
                      >
                        {/* Timeline node */}
                        <div className={`
                          relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                          ${entry.action === 'status_change' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted border border-border text-muted-foreground'
                          }
                          group-hover:ring-4 ring-primary/10 transition-all
                        `}>
                          {getActionIcon(entry.action)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-sm">
                                {getActionLabel(entry)}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                <span>{entry.performedByName}</span>
                                <span className="opacity-50">•</span>
                                <span className="font-mono">
                                  {new Date(entry.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {entry.action === 'status_change' && (
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="neutral" className="text-xs">
                                  {entry.fromStatus}
                                </Badge>
                                <ChevronRight className="w-4 h-4 text-primary" />
                                <Badge variant="success" className="text-xs">
                                  {entry.toStatus}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Metadata */}
                          {entry.metadata && (
                            <div className="mt-2 p-2 rounded bg-muted/50 text-xs font-mono text-muted-foreground">
                              {JSON.stringify(entry.metadata, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
