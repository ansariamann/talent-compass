
import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { emailApi } from "@/lib/api";
import { ResumeJob } from "@/types/ats";

export function ResumeJobsList() {
    const [jobs, setJobs] = useState<ResumeJob[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await emailApi.getJobs();
            setJobs(response.data);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
            setError("Backend unavailable — showing offline state.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();

        // Only auto-refresh if the last fetch succeeded (no error)
        const interval = setInterval(() => {
            setJobs(prev => {
                const hasPending = prev.some(j => j.status === 'PENDING' || j.status === 'PROCESSING');
                if (hasPending) fetchJobs();
                return prev;
            });
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const getStatusBadge = (status: ResumeJob["status"]) => {
        switch (status) {
            case "COMPLETED":
                return <Badge className="bg-status-success hover:bg-status-success/90 text-white">Completed</Badge>;
            case "PROCESSING":
                return <Badge className="bg-status-info hover:bg-status-info/90 text-white animate-pulse">Processing</Badge>;
            case "FAILED":
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="secondary">Pending</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Resume Processing Status</CardTitle>
                        <CardDescription>
                            Monitor the status of background email ingestion and resume parsing.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="text-center py-10 space-y-3">
                        <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            No connection to backend — jobs will appear here once the service is reachable.
                        </p>
                        <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Retry
                        </Button>
                    </div>
                ) : jobs.length === 0 && !loading ? (
                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                        <FileText className="w-7 h-7 opacity-40" />
                        <p className="text-sm">No resume processing jobs found.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Job ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Attempts</TableHead>
                                <TableHead>Result</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.map((job) => (
                                <TableRow key={job.id}>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {job.id.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        {new Date(job.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                                    <TableCell>{job.attempts}</TableCell>
                                    <TableCell>
                                        {job.error_message ? (
                                            <span className="text-destructive text-sm truncate max-w-[200px] block" title={job.error_message}>
                                                {job.error_message}
                                            </span>
                                        ) : job.parsed_data ? (
                                            <div className="flex items-center text-status-success text-sm gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Parsed
                                            </div>
                                        ) : (
                                            "-"
                                        )}
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
