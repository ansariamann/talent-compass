import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar, Building2, Clock3, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Candidate, Client, DirectInterviewRecord } from "@/types/ats";
import { candidatesApi } from "@/lib/api";
import { useClients } from "@/hooks/useClients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DirectInterviewForm } from "@/components/candidates/DirectInterviewForm";

interface InterviewHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onChanged: () => Promise<void> | void;
}

export function InterviewHistoryDialog({
  open,
  onOpenChange,
  candidate,
  onChanged,
}: InterviewHistoryDialogProps) {
  const { data: clients = [] } = useClients();
  const [history, setHistory] = useState<DirectInterviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingInterview, setEditingInterview] = useState<DirectInterviewRecord | null>(null);
  const [deletingInterview, setDeletingInterview] = useState<DirectInterviewRecord | null>(null);
  const canMutate = candidate?.currentStatus === "new";

  const clientMap = useMemo(
    () => new Map(clients.map((client: Client) => [client.id, client.name])),
    [clients]
  );

  const loadHistory = async () => {
    if (!candidate) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await candidatesApi.getInterviewHistory(candidate.id);
      setHistory(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load interview history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !candidate) return;
    loadHistory();
  }, [candidate, open]);

  const handleDelete = async () => {
    if (!candidate || !deletingInterview) return;
    try {
      await candidatesApi.deleteInterviewRecord(candidate.id, deletingInterview.id);
      toast.success("Interview deleted");
      setDeletingInterview(null);
      await loadHistory();
      await onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete interview");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Interview History</DialogTitle>
            <DialogDescription>
              {candidate ? `Recorded direct interviews for ${candidate.name}` : "Candidate interview history"}
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading interview history...
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No direct interviews recorded yet.
            </div>
          ) : (
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-4">
                {history.map((interview) => {
                  const companyName = clientMap.get(interview.companyId) || "Unknown company";
                  return (
                    <div key={interview.id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{companyName}</Badge>
                            {typeof interview.rating === "number" && (
                              <Badge variant="outline">Rating {interview.rating}/5</Badge>
                            )}
                            <Badge variant="outline">
                              {format(new Date(interview.createdAt), "dd MMM yyyy")}
                            </Badge>
                          </div>

                          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(interview.interviewDate), "dd MMM yyyy, hh:mm a")}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4" />
                              Updated {format(new Date(interview.updatedAt), "dd MMM yyyy, hh:mm a")}
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                              <Building2 className="h-4 w-4" />
                              Company assignment target: {companyName}
                            </div>
                            {interview.position && (
                              <div className="sm:col-span-2">
                                Position: <span className="text-foreground">{interview.position}</span>
                              </div>
                            )}
                          </div>

                          {interview.skills && interview.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {interview.skills.map((skill) => (
                                <Badge key={`${interview.id}-${skill}`} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="rounded-md bg-muted/40 p-3 text-sm leading-relaxed text-foreground/90">
                            {interview.notes?.trim() || "No notes recorded."}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {canMutate ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingInterview(interview)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeletingInterview(interview)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Badge variant="outline">Locked</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <DirectInterviewForm
        open={Boolean(editingInterview)}
        onOpenChange={(value) => {
          if (!value) setEditingInterview(null);
        }}
        candidate={candidate}
        interview={editingInterview}
        onSuccess={async () => {
          await loadHistory();
          await onChanged();
          setEditingInterview(null);
        }}
      />

      <AlertDialog open={Boolean(deletingInterview)} onOpenChange={(value) => !value && setDeletingInterview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete interview record?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the interview from active history. If it is the last active direct interview for this
              candidate, the candidate returns to the pending interview state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
