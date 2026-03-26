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

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ startDate: "", endDate: "" });
  const { data, isLoading, isError, refetch } = useActivityLogs(page, 50, appliedFilters);
  const { user } = useAuth();
  
  const isAdmin = user?.role?.toLowerCase() === "hr_admin";

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
    return type.replace(/_/g, " ");
  };

  const renderDetails = (log: ActivityLog) => {
    if (!log.details) return null;
    return (
      <div className="text-xs text-muted-foreground">
        {Object.entries(log.details).map(([key, value]) => (
          <div key={key}>
            <span className="font-medium mr-1">{key.replace(/_/g, " ")}:</span>
            <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
          </div>
        ))}
      </div>
    );
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
              ) : !data || data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No activity logs found.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((log) => (
                  <TableRow key={log.id} className="group transition-colors hover:bg-white/5">
                    <TableCell className="whitespace-nowrap font-medium">
                      {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderIcon(log.action_type)}
                        <span className="capitalize">{formatActionType(log.action_type).toLowerCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.user_name || "System"}
                    </TableCell>
                    <TableCell>
                      {renderDetails(log)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex justify-between items-center bg-black/20">
            <span className="text-sm text-muted-foreground">
              Showing {data.data.length} of {data.total} entries
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
