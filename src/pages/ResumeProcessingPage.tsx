
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ResumeJobsList } from "@/components/ResumeJobsList";
import { ResumeUploadDialog } from "@/components/ResumeUploadDialog";
import { Button } from "@/components/ui/button";
import { Upload, Mail, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { emailApi } from "@/lib/api";
import { toast } from "sonner";

export default function ResumeProcessingPage() {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isPollingInbox, setIsPollingInbox] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handlePollInbox = async () => {
        setIsPollingInbox(true);
        try {
            const result = await emailApi.pollInbox();
            setRefreshKey((value) => value + 1);

            if (!result.success && result.failures > 0) {
                toast.error("Inbox poll failed. Check IMAP settings and backend worker logs.");
            } else if (result.messages_ingested > 0) {
                toast.success(`Imported ${result.messages_ingested} email message(s) from the inbox.`);
            } else if (result.duplicate_messages > 0) {
                toast.info("Inbox checked. The latest email was already processed.");
            } else if (result.messages_seen > 0) {
                toast.info("Inbox checked, but no supported resume attachments were imported.");
            } else {
                toast.info("Inbox checked. No unread resume emails were found.");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to poll inbox";
            toast.error(message);
        } finally {
            setIsPollingInbox(false);
        }
    };

    const HeaderActions = (
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePollInbox} disabled={isPollingInbox}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isPollingInbox ? "animate-spin" : ""}`} />
                Check Inbox
            </Button>
            <Button onClick={() => setIsUploadOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Resume
            </Button>
        </div>
    );

    return (
        <DashboardLayout title="Resume Processing" searchComponent={HeaderActions}>
            <div className="p-6 space-y-6">
                <p className="text-muted-foreground -mt-2">
                    Upload resumes individually or monitor email ingestion status.
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Email Ingestion Guide
                        </CardTitle>
                        <CardDescription>
                            Forward resumes to the system email address to automatically process them.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm space-y-2">
                            <p>
                                <strong>System Email:</strong>{" "}
                                <code className="bg-muted px-2 py-1 rounded">
                                    teatoast364@gmail.com
                                </code>
                            </p>
                            <p className="text-muted-foreground">
                                Supported formats: PDF, PNG, JPG, TIFF. Ensure the resume file is
                                attached to the email.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <ResumeJobsList refreshKey={refreshKey} />
            </div>

            <ResumeUploadDialog
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                onSuccess={() => setRefreshKey((value) => value + 1)}
            />
        </DashboardLayout>
    );
}

