import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { AlertCircle, Check, Loader2, RefreshCw, X } from "lucide-react";
import { emailApi } from "@/lib/api";
import type { ResumeJob } from "@/types/ats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResumeJobsListProps {
  refreshKey?: number;
}

export function ResumeJobsList({ refreshKey = 0 }: ResumeJobsListProps) {
  const [jobs, setJobs] = useState<ResumeJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchJobs = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await emailApi.getJobs(undefined, 1, 10);
      const recentJobs = [...response.data]
        .filter((job) => isRecentJob(job.created_at))
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
        .slice(0, 10);
      setJobs(recentJobs);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [refreshKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      const hasActiveJobs = jobs.some((job) => job.status === "PENDING" || job.status === "PROCESSING");
      if (hasActiveJobs) {
        fetchJobs(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [jobs]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Resume Processing Status</CardTitle>

          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="text-xs text-muted-foreground">
                Updated {formatDistanceToNowStrict(lastUpdated, { addSuffix: true })}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => fetchJobs()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading recent uploads...
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No recent resume uploads.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate Name</TableHead>
                <TableHead>Upload Status</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{getCandidateName(job)}</TableCell>
                  <TableCell>{renderUploadStatus(job.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(job.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function isRecentJob(createdAt: string) {
  const createdAtTime = new Date(createdAt).getTime();
  const recentThreshold = Date.now() - 24 * 60 * 60 * 1000;
  return createdAtTime >= recentThreshold;
}

function getCandidateName(job: ResumeJob) {
  const rawName = job.file_name || job.resume_file_path || job.file_path || "Unknown candidate";
  const fileName = rawName.split(/[\\/]/).pop() || rawName;
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized || "Unknown candidate";
}

function renderUploadStatus(status: ResumeJob["status"]) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-2 text-status-success">
        <Check className="h-4 w-4" />
        Success
      </span>
    );
  }

  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-2 text-destructive">
        <X className="h-4 w-4" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Uploading
    </span>
  );
}
