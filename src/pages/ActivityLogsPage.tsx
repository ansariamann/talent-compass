import { useState } from "react";
import { DashboardLayout as Layout } from "@/components/layout/DashboardLayout";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { ActivityLog } from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCcw, FileText, Briefcase, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";

const ACTION_LABELS: Record<string, string> = {
  APPLICATION_CREATED: "Created an application",
  APPLICATION_UPDATED: "Updated an application",
  APPLICATION_DELETED: "Deleted an application",
  APPLICATION_SOFT_DELETED: "Archived an application",
  APPLICATION_RESTORED: "Restored an application",
  APPLICATION_FLAGGED: "Flagged an application",
  APPLICATION_UNFLAGGED: "Removed an application flag",
  CANDIDATE_CREATED: "Added a candidate",
  CANDIDATE_UPDATED: "Updated a candidate profile",
  CANDIDATE_DELETED: "Deleted a candidate",
  CANDIDATE_UPLOADED: "Uploaded a candidate resume",
  DIRECT_INTERVIEW: "Recorded a direct interview",
  DIRECT_INTERVIEW_UPDATED: "Updated a direct interview record",
  DIRECT_INTERVIEW_DELETED: "Deleted a direct interview record",
  CLIENT_CREATED: "Added a client",
  CLIENT_UPDATED: "Updated a client",
  CLIENT_DELETED: "Deleted a client",
  CLIENT_INVITE_GENERATED: "Sent a client invite",
  COMPANY_EMPLOYEE_CREATED: "Added a company employee",
  COMPANY_EMPLOYEE_UPDATED: "Updated a company employee",
  COMPANY_EMPLOYEE_DELETED: "Removed a company employee",
  JOB_CREATED: "Created a job",
  JOB_UPDATED: "Updated a job",
  JOB_DELETED: "Deleted a job",
  JOB_CLOSED_BY_CLIENT: "Marked a job as closed",
  RESUME_PROCESSING_STARTED: "Started resume processing",
  EMAIL_INGESTED: "Processed an email with resume attachments",
  EMAIL_DUPLICATE: "Skipped a duplicate email",
  EMAIL_SKIPPED: "Skipped an email without valid resume data",
  EMAIL_FAILED: "Email processing failed",
  IMAP_POLL_COMPLETED: "Checked the inbox",
  IMAP_MESSAGE_FAILED: "Could not process one inbox email",
  HR_DASHBOARD_API_REQUEST: "Used the HR dashboard",
};

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toReadableLabel(value: string): string {
  return toTitleCase(value.replace(/_/g, " "));
}

function toFriendlyActionText(actionType: string): string {
  return ACTION_LABELS[actionType] || toReadableLabel(actionType);
}

function endpointToArea(endpoint: string): string {
  if (endpoint.startsWith("/candidates")) return "Candidates";
  if (endpoint.startsWith("/applications")) return "Applications";
  if (endpoint.startsWith("/clients")) return "Clients";
  if (endpoint.startsWith("/jobs")) return "Jobs";
  if (endpoint.startsWith("/email")) return "Resume Processing";
  if (endpoint.startsWith("/monitoring")) return "Monitoring";
  if (endpoint.startsWith("/auth")) return "Authentication";
  return "the dashboard";
}

function toFriendlyDetails(log: ActivityLog): string[] {
  if (!log.details) return [];

  if (log.action_type === "HR_DASHBOARD_API_REQUEST") {
    const endpoint = typeof log.details.endpoint === "string" ? log.details.endpoint : "";
    const area = endpoint ? endpointToArea(endpoint) : "the dashboard";
    const statusCode =
      typeof log.details.status_code === "number" ? log.details.status_code : undefined;
    const failed = statusCode !== undefined && statusCode >= 400;
    return [failed ? `Tried to access ${area}, but it failed.` : `Accessed ${area}.`];
  }

  if (log.action_type === "IMAP_POLL_COMPLETED") {
    const seen = Number(log.details.messages_seen || 0);
    const imported = Number(log.details.messages_ingested || 0);
    const failed = Number(log.details.failures || 0);
    return [
      `Scanned ${seen} unread email(s), imported ${imported}, and ${failed} failed.`,
    ];
  }

  const lines: string[] = [];
  for (const [key, value] of Object.entries(log.details)) {
    const label = toReadableLabel(key);
    const readableValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    lines.push(`${label}: ${readableValue}`);
  }
  return lines;
}

function shouldHideLog(log: ActivityLog): boolean {
  if (log.action_type !== "HR_DASHBOARD_API_REQUEST") {
    return false;
  }

  const endpoint = typeof log.details?.endpoint === "string" ? log.details.endpoint : "";
  const statusCode =
    typeof log.details?.status_code === "number" ? log.details.status_code : undefined;

  if (statusCode !== undefined && statusCode >= 400) {
    return false;
  }

  return (
    endpoint.startsWith("/jobs") ||
    endpoint.startsWith("/applications") ||
    endpoint.startsWith("/clients")
  );
}

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ startDate: "", endDate: "" });
  const { data, isLoading, isError, refetch } = useActivityLogs(page, 50, appliedFilters);
  const { user } = useAuth();
  
  const isAdmin = user?.role?.toLowerCase() === "hr_admin";
  const visibleLogs = data?.data.filter((log) => !shouldHideLog(log)) || [];

  const renderIcon = (type: string) => {
    switch (type) {
      case "APPLICATION_CREATED":
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case "CANDIDATE_UPLOADED":
        return <FileText className="w-4 h-4 text-green-500" />;
      case "DIRECT_INTERVIEW":
        return <UserPlus className="w-4 h-4 text-muted-foreground" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatActionType = (type: string) => {
    return toFriendlyActionText(type);
  };

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({
      startDate: startDateInput,
      endDate: endDateInput,
    });
  };

  const handleClearFilters = () => {
    setPage(1);
    setStartDateInput("");
    setEndDateInput("");
    setAppliedFilters({ startDate: "", endDate: "" });
  };

  return (
    <Layout title="Activity Logs">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track system activities including applications, candidate uploads, and direct interviews.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Input
          type="date"
          placeholder="From"
          value={startDateInput}
          onChange={(event) => { setStartDateInput(event.target.value); setAppliedFilters(f => ({ ...f, startDate: event.target.value })); setPage(1); }}
          max={endDateInput || undefined}
          className="w-44"
        />
        <span className="text-muted-foreground text-sm">to</span>
        <Input
          type="date"
          placeholder="To"
          value={endDateInput}
          onChange={(event) => { setEndDateInput(event.target.value); setAppliedFilters(f => ({ ...f, endDate: event.target.value })); setPage(1); }}
          min={startDateInput || undefined}
          className="w-44"
        />
        {(startDateInput || endDateInput) && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>Clear</Button>
        )}
      </div>

      <Card className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-destructive">
                    Failed to load activity logs
                  </TableCell>
                </TableRow>
              ) : visibleLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              ) : (
                visibleLogs.map((log) => {
                  const details = toFriendlyDetails(log);
                  return (
                    <TableRow key={log.id} className="group transition-colors hover:bg-white/5">
                      <TableCell className="whitespace-nowrap font-medium">
                        {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {renderIcon(log.action_type)}
                          <span>{formatActionType(log.action_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user_name || "System"}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {details.length === 0 ? (
                            <span>No additional details</span>
                          ) : (
                            details.map((line) => (
                              <div key={line}>{line}</div>
                            ))
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/20">
            <span className="text-sm text-muted-foreground">
              Showing {visibleLogs.length} of {data.total} entries
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </Layout>
  );
}
