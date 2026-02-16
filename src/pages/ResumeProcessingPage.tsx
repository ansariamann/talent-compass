
import { useState } from "react";
import { ResumeJobsList } from "@/components/ResumeJobsList";
import { ResumeUploadDialog } from "@/components/ResumeUploadDialog";
import { Button } from "@/components/ui/button";
import { Upload, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResumeProcessingPage() {
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Resume Processing</h1>
                    <p className="text-muted-foreground mt-2">
                        Upload resumes individually or monitor email ingestion status.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsUploadOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Resume
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
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
                                <strong>System Email:</strong> <code className="bg-muted px-2 py-1 rounded">resume-ingest@hr-system.local</code>
                            </p>
                            <p className="text-muted-foreground">
                                Supported formats: PDF, PNG, JPG, TIFF. Ensure the resume file is attached to the email.
                                The subject line will be used as the initial remark.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <ResumeJobsList />
            </div>

            <ResumeUploadDialog
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                onSuccess={() => {
                    // Optionally trigger a refresh of the list here if we lifted state, 
                    // but the list has auto-refresh or manual refresh so it's fine.
                }}
            />
        </div>
    );
}
