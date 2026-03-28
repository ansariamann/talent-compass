import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Calendar, CheckCircle, Loader2, MessageSquare, Send, UserMinus, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { applicationsApi, candidatesApi } from '@/lib/api';
import type {
  Application,
  ApplicationTimeline,
  Candidate,
  Client,
  InterviewFeedbackPayload,
  LeftCompanyPayload,
  RejectPayload,
  ScheduleInterviewPayload,
} from '@/types/ats';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type WorkflowDialog = 'schedule' | 'feedback' | 'reject' | 'left' | 'ack' | null;

interface CandidateWorkflowActionsProps {
  candidate: Candidate;
  timeline: ApplicationTimeline[];
  applications: Application[];
  clients: Client[];
  onUpdated: (candidate: Candidate) => void;
  onAcknowledged: () => void;
}

function getLatestRound(timeline: ApplicationTimeline[]): number {
  const rounds = timeline
    .filter((event) => event.eventType === 'interview_round')
    .map((event) => event.interviewDetails?.roundNumber || 0);
  return rounds.length ? Math.max(...rounds) : 1;
}

export function CandidateWorkflowActions({
  candidate,
  timeline,
  applications,
  clients,
  onUpdated,
  onAcknowledged,
}: CandidateWorkflowActionsProps) {
  const [dialog, setDialog] = useState<WorkflowDialog>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduleMode, setScheduleMode] = useState<ScheduleInterviewPayload['mode']>('video');
  const [scheduleRound, setScheduleRound] = useState(1);
  const [scheduleInterviewer, setScheduleInterviewer] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');

  const [feedbackRating, setFeedbackRating] = useState<InterviewFeedbackPayload['rating']>(3);
  const [feedbackRecommendation, setFeedbackRecommendation] =
    useState<InterviewFeedbackPayload['recommendation']>('neutral');
  const [feedbackText, setFeedbackText] = useState('');
  const [scheduleNextRound, setScheduleNextRound] = useState(false);
  const [nextRoundDate, setNextRoundDate] = useState('');
  const [nextRoundTime, setNextRoundTime] = useState('');
  const [nextRoundMode, setNextRoundMode] = useState<ScheduleInterviewPayload['mode']>('video');
  const [nextRoundInterviewer, setNextRoundInterviewer] = useState('');

  const [rejectReason, setRejectReason] = useState<RejectPayload['reason']>('other');
  const [rejectFeedback, setRejectFeedback] = useState('');

  const [leftReason, setLeftReason] = useState<LeftCompanyPayload['reason']>('other');
  const [leftFeedback, setLeftFeedback] = useState('');
  const [lastWorkingDate, setLastWorkingDate] = useState('');

  const [ackApplicationId, setAckApplicationId] = useState('');
  const [ackNote, setAckNote] = useState('');

  const latestRound = useMemo(() => getLatestRound(timeline), [timeline]);
  const reviewableApplications = useMemo(
    () => applications.filter((application) => !application.isDeleted),
    [applications]
  );

  const canScheduleInterview = ['new', 'screening', 'submitted', 'interviewed'].includes(candidate.currentStatus);
  const canAddFeedback = candidate.currentStatus === 'interview_scheduled';
  const canSelect = candidate.currentStatus === 'interview_scheduled';
  const canReject = !['selected', 'hired', 'rejected', 'withdrawn'].includes(candidate.currentStatus);
  const canMarkLeft = ['selected', 'hired'].includes(candidate.currentStatus);
  const canAcknowledge = reviewableApplications.length > 0 && ['interview_scheduled', 'selected'].includes(candidate.currentStatus);

  const closeDialog = () => {
    setDialog(null);
    setLoadingAction(null);
    setScheduledDate('');
    setScheduledTime('');
    setScheduleMode('video');
    setScheduleRound(1);
    setScheduleInterviewer('');
    setScheduleNotes('');
    setFeedbackRating(3);
    setFeedbackRecommendation('neutral');
    setFeedbackText('');
    setScheduleNextRound(false);
    setNextRoundDate('');
    setNextRoundTime('');
    setNextRoundMode('video');
    setNextRoundInterviewer('');
    setRejectReason('other');
    setRejectFeedback('');
    setLeftReason('other');
    setLeftFeedback('');
    setLastWorkingDate('');
    setAckApplicationId('');
    setAckNote('');
  };

  const openFeedback = () => {
    setScheduleRound(latestRound);
    setDialog('feedback');
  };

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Interview date and time are required');
      return;
    }

    setLoadingAction('schedule');
    try {
      const updated = await candidatesApi.scheduleInterview({
        candidateId: candidate.id,
        scheduledDate: new Date(`${scheduledDate}T${scheduledTime}`).toISOString(),
        mode: scheduleMode,
        roundNumber: scheduleRound,
        interviewerName: scheduleInterviewer || undefined,
        notes: scheduleNotes || undefined,
      });
      toast.success('Interview scheduled');
      onUpdated(updated);
      closeDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to schedule interview');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error('Feedback is required');
      return;
    }
    if (scheduleNextRound && (!nextRoundDate || !nextRoundTime || !nextRoundInterviewer.trim())) {
      toast.error('Next round date, time, and interviewer are required');
      return;
    }

    setLoadingAction('feedback');
    try {
      let updated = await candidatesApi.submitFeedback({
        candidateId: candidate.id,
        roundNumber: latestRound,
        rating: feedbackRating,
        recommendation: feedbackRecommendation,
        feedback: feedbackText.trim(),
      });

      if (scheduleNextRound) {
        updated = await candidatesApi.scheduleInterview({
          candidateId: candidate.id,
          scheduledDate: new Date(`${nextRoundDate}T${nextRoundTime}`).toISOString(),
          mode: nextRoundMode,
          roundNumber: latestRound + 1,
          interviewerName: nextRoundInterviewer.trim(),
        });
      }

      toast.success(scheduleNextRound ? 'Feedback saved and next round scheduled' : 'Feedback saved');
      onUpdated(updated);
      closeDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSelect = async () => {
    setLoadingAction('select');
    try {
      const updated = await candidatesApi.selectForWorkflow(candidate.id);
      toast.success('Candidate selected');
      onUpdated(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to select candidate');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    if (!rejectFeedback.trim()) {
      toast.error('Rejection feedback is required');
      return;
    }
    setLoadingAction('reject');
    try {
      const updated = await candidatesApi.rejectForWorkflow({
        candidateId: candidate.id,
        reason: rejectReason,
        feedback: rejectFeedback.trim(),
      });
      toast.success('Candidate rejected');
      onUpdated(updated);
      closeDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject candidate');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLeft = async () => {
    if (!leftFeedback.trim()) {
      toast.error('Reason is required');
      return;
    }
    setLoadingAction('left');
    try {
      const updated = await candidatesApi.markLeftCompany({
        candidateId: candidate.id,
        reason: leftReason,
        feedback: leftFeedback.trim(),
        lastWorkingDate: lastWorkingDate || undefined,
      });
      toast.success('Candidate marked as left company');
      onUpdated(updated);
      closeDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark candidate as left');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAcknowledge = async () => {
    if (!ackApplicationId) {
      toast.error('Select a client application');
      return;
    }
    setLoadingAction('ack');
    try {
      await applicationsApi.updateStatus(ackApplicationId, 'interview', ackNote.trim() || undefined);
      toast.success('Interview acknowledgement sent to client for review');
      onAcknowledged();
      closeDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send acknowledgement');
    } finally {
      setLoadingAction(null);
    }
  };

  const getClientName = (application: Application) =>
    clients.find((client) => client.id === application.clientId)?.name || application.client?.name || 'Client';

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canScheduleInterview && (
          <Button size="sm" variant="outline" onClick={() => setDialog('schedule')} disabled={!!loadingAction}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Interview
          </Button>
        )}
        {canAddFeedback && (
          <Button size="sm" variant="outline" onClick={openFeedback} disabled={!!loadingAction}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Feedback & Next Round
          </Button>
        )}
        {canSelect && (
          <Button size="sm" onClick={handleSelect} disabled={!!loadingAction}>
            {loadingAction === 'select' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Select Candidate
          </Button>
        )}
        {canReject && (
          <Button size="sm" variant="destructive" onClick={() => setDialog('reject')} disabled={!!loadingAction}>
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
        )}
        {canMarkLeft && (
          <Button size="sm" variant="outline" onClick={() => setDialog('left')} disabled={!!loadingAction}>
            <UserMinus className="mr-2 h-4 w-4" />
            Mark as Left
          </Button>
        )}
        {canAcknowledge && (
          <Button size="sm" variant="secondary" onClick={() => setDialog('ack')} disabled={!!loadingAction}>
            <Send className="mr-2 h-4 w-4" />
            Send To Client Review
          </Button>
        )}
      </div>

      <Dialog open={dialog === 'schedule'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>Schedule an interview for {candidate.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Round</Label>
                <Select value={String(scheduleRound)} onValueChange={(value) => setScheduleRound(Number(value))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3', '4', '5'].map((value) => (
                      <SelectItem key={value} value={value}>Round {value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={scheduleMode} onValueChange={(value) => setScheduleMode(value as ScheduleInterviewPayload['mode'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Interviewer</Label>
              <Input value={scheduleInterviewer} onChange={(e) => setScheduleInterviewer(e.target.value)} placeholder="Interviewer name" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={scheduleNotes} onChange={(e) => setScheduleNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={loadingAction === 'schedule'}>
              {loadingAction === 'schedule' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'feedback'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Interview Feedback</DialogTitle>
            <DialogDescription>Save interview feedback for {candidate.name} and optionally schedule the next round.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Rating</Label>
                <Select value={String(feedbackRating)} onValueChange={(value) => setFeedbackRating(Number(value) as InterviewFeedbackPayload['rating'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3', '4', '5'].map((value) => (
                      <SelectItem key={value} value={value}>{value} / 5</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recommendation</Label>
                <Select
                  value={feedbackRecommendation}
                  onValueChange={(value) => setFeedbackRecommendation(value as InterviewFeedbackPayload['recommendation'])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strong_yes">Strong Yes</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="strong_no">Strong No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Feedback</Label>
              <Textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} rows={4} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">Schedule next round</div>
                <div className="text-xs text-muted-foreground">Round {latestRound + 1}</div>
              </div>
              <Switch checked={scheduleNextRound} onCheckedChange={setScheduleNextRound} />
            </div>
            {scheduleNextRound && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={nextRoundDate} onChange={(e) => setNextRoundDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input type="time" value={nextRoundTime} onChange={(e) => setNextRoundTime(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Mode</Label>
                    <Select value={nextRoundMode} onValueChange={(value) => setNextRoundMode(value as ScheduleInterviewPayload['mode'])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="in_person">In Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Interviewer</Label>
                    <Input value={nextRoundInterviewer} onChange={(e) => setNextRoundInterviewer(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleFeedback} disabled={loadingAction === 'feedback'}>
              {loadingAction === 'feedback' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {scheduleNextRound ? 'Submit & Schedule' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'reject'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Candidate</DialogTitle>
            <DialogDescription>Record the rejection reason for {candidate.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Select value={rejectReason} onValueChange={(value) => setRejectReason(value as RejectPayload['reason'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="skill_mismatch">Skill mismatch</SelectItem>
                  <SelectItem value="experience_insufficient">Experience insufficient</SelectItem>
                  <SelectItem value="culture_fit">Culture fit</SelectItem>
                  <SelectItem value="salary_expectation">Salary expectation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Feedback</Label>
              <Textarea value={rejectFeedback} onChange={(e) => setRejectFeedback(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loadingAction === 'reject'}>
              {loadingAction === 'reject' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'left'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Left</DialogTitle>
            <DialogDescription>Record that {candidate.name} has left the company.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Select value={leftReason} onValueChange={(value) => setLeftReason(value as LeftCompanyPayload['reason'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="resigned">Resigned</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="contract_ended">Contract ended</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Last working date</Label>
              <Input type="date" value={lastWorkingDate} onChange={(e) => setLastWorkingDate(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={leftFeedback} onChange={(e) => setLeftFeedback(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleLeft} disabled={loadingAction === 'left'}>
              {loadingAction === 'left' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark Left
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'ack'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Interview Acknowledgement</DialogTitle>
            <DialogDescription>
              Notify a client that HR has completed the interview and the candidate is ready for client review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client Application</Label>
              <Select value={ackApplicationId} onValueChange={setAckApplicationId}>
                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                <SelectContent>
                  {reviewableApplications.map((application) => (
                    <SelectItem key={application.id} value={application.id}>
                      {getClientName(application)} - {application.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Review Note</Label>
              <Textarea
                value={ackNote}
                onChange={(e) => setAckNote(e.target.value)}
                rows={4}
                placeholder="Interview completed. Please review and accept or reject this proposal."
              />
            </div>
            {ackApplicationId && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                Client status will be updated to <strong>Interviewed</strong>. That client can then review the candidate in the client portal and decide whether to select or reject.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleAcknowledge} disabled={loadingAction === 'ack'}>
              {loadingAction === 'ack' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Acknowledgement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
