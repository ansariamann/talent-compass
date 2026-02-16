
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
            setError("Failed to load resume processing jobs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();

        // Auto-refresh every 10 seconds if there are pending/processing jobs
        const interval = setInterval(() => {
            // Simple check: if any job is not completed/failed, refresh
            // For a more robust solution, we'd check the state of the *current* jobs list
            fetchJobs();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const getStatusBadge = (status: ResumeJob["status"]) => {
        switch (status) {
            case "COMPLETED":
                return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
            case "Processing": // Case sensitivity might vary, backend usually uses uppercase
            case "PROCESSING":
                return <Badge className="bg-blue-500 hover:bg-blue-600 animate-pulse">Processing</Badge>;
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
                {error && (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {jobs.length === 0 && !loading && !error ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No resume processing jobs found.
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
                                            <div className="flex items-center text-green-600 dark:text-green-400 text-sm gap-1">
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
