import { useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Upload,
    FileText,
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    IndianRupee,
    Save,
} from 'lucide-react';
import { candidatesApi, emailApi, authApi } from '@/lib/api';

interface ResumeUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

type DialogStep = 'upload' | 'ingesting' | 'review' | 'saving' | 'success' | 'error';

const ACCEPTED_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/tiff',
];

const ACCEPTED_EXTENSIONS = '.pdf,.png,.jpg,.jpeg,.tiff,.tif';



/** Read file as base64 string */
function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Strip the data:...;base64, prefix
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

export function ResumeUploadDialog({
    open,
    onOpenChange,
    onSuccess,
}: ResumeUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<DialogStep>('upload');
    const [resultMessage, setResultMessage] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Candidate form fields
    const [candidateName, setCandidateName] = useState('');
    const [candidateEmail, setCandidateEmail] = useState('');
    const [candidatePhone, setCandidatePhone] = useState('');
    const [candidateLocation, setCandidateLocation] = useState('');
    const [candidateSkills, setCandidateSkills] = useState('');
    const [candidateExperience, setCandidateExperience] = useState('');
    const [candidateCtcCurrent, setCandidateCtcCurrent] = useState('');
    const [candidateCtcExpected, setCandidateCtcExpected] = useState('');
    const [candidateRemark, setCandidateRemark] = useState('');

    const reset = () => {
        setFile(null);
        setStep('upload');
        setResultMessage('');
        setIsDragging(false);
        setCandidateName('');
        setCandidateEmail('');
        setCandidatePhone('');
        setCandidateLocation('');
        setCandidateSkills('');
        setCandidateExperience('');
        setCandidateCtcCurrent('');
        setCandidateCtcExpected('');
        setCandidateRemark('');
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            if (step === 'success') onSuccess?.();
            reset();
        }
        onOpenChange(isOpen);
    };

    const handleFileSelect = (selectedFile: File) => {
        if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
            setResultMessage('Unsupported file type. Please upload PDF, PNG, JPG, or TIFF.');
            setStep('error');
            return;
        }
        if (selectedFile.size > 50 * 1024 * 1024) {
            setResultMessage('File size exceeds 50MB limit.');
            setStep('error');
            return;
        }
        setFile(selectedFile);
        setStep('upload');
        setResultMessage('');
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFileSelect(droppedFile);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) handleFileSelect(selectedFile);
    };

    // Step 1: Send file to backend via /email/ingest, then move to review form
    const handleIngest = async () => {
        if (!file) return;

        setStep('ingesting');
        setResultMessage('');

        try {
            const base64Content = await readFileAsBase64(file);

            // Get client_id from /auth/me
            const currentUser = await authApi.getCurrentUser();
            // In the current User type, strictly speaking there isn't a top-level client_id, 
            // but the backend response usually has it effectively as tenantId or similar in this context?
            // Checking User type: tenantId is string. Let's use that or fallback.
            // Actually API response from /auth/me for HR might be different. 
            // The backend `get_current_user` returns a User model which has client_id.
            // The frontend `User` type has `tenantId`. We should likely use `tenantId` or cast if needed.
            // However, for ingestion we need the Client ID associated with the user context.
            // Let's assume tenantId maps to client_id for this purpose or strict typing needs adjustment.
            // The previous code did: const meData = await meResp.json(); const clientId = meData.client_id;
            // Let's rely on that structure being present in the API response even if the TS type `User` is strict.
            const clientId = (currentUser as unknown as { client_id: string }).client_id || currentUser.tenantId;

            if (!clientId) throw new Error('No client_id found for current user');

            // Build EmailIngestionRequest payload
            const messageId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

            const ingestData = await emailApi.ingest({
                client_id: clientId,
                email: {
                    message_id: messageId,
                    sender: currentUser.email || 'upload@hrdashboard.local',
                    subject: `Resume Upload: ${file.name}`,
                    body: `Resume uploaded via HR Dashboard: ${file.name}`,
                    received_at: new Date().toISOString(),
                    attachments: [
                        {
                            filename: file.name,
                            content_type: file.type || 'application/pdf',
                            content_base64: base64Content,
                            size: file.size,
                        },
                    ],
                },
            });

            if (!ingestData.success) {
                throw new Error(ingestData.message || 'Ingestion returned unsuccessful');
            }

            // Ingestion succeeded — file is stored. 
            // Default remark
            setCandidateRemark(`Resume: ${file.name}`);

            // Now try to parse it synchronously via the new endpoint.
            if (ingestData.job_ids && ingestData.job_ids.length > 0) {
                const jobId = ingestData.job_ids[0];
                setResultMessage('Parsing resume details...');

                try {
                    const parseResult = await emailApi.parseJob(jobId);

                    if (parseResult.success && parseResult.data) {
                        const d = parseResult.data;

                        // Use parsed name or fallback to filename (without extension)
                        const initialName = d.name || file.name.replace(/\.[^/.]+$/, "");
                        setCandidateName(initialName);

                        if (d.email) setCandidateEmail(d.email);
                        if (d.phone) setCandidatePhone(d.phone);
                        if (d.location) setCandidateLocation(d.location);
                        if (d.location) setCandidateLocation(d.location);
                        if (d.skills && Array.isArray(d.skills)) {
                            // Skills might be strings or objects {name: "Python", category: "Programming"}.
                            // Handle both cases.
                            const skillNames = d.skills.map((s: any) => (typeof s === 'string' ? s : s.name || JSON.stringify(s)));
                            setCandidateSkills(skillNames.join(', '));
                        }
                        if (d.experience_years) setCandidateExperience(String(d.experience_years));

                        // Update remark with summary if available
                        if (d.raw_text_summary) {
                            setCandidateRemark(`Resume: ${file.name}\nSummary: ${d.raw_text_summary.substring(0, 100)}...`);
                        }
                    }
                } catch (parseErr) {
                    console.warn('Auto-parsing failed, user must fill details manually', parseErr);
                }
            }

            // Move to review form
            setStep('review');
            setResultMessage('');
        } catch (err) {
            console.error('Ingestion error:', err);
            setStep('error');
            setResultMessage(err instanceof Error ? err.message : 'Ingestion failed');
        }
    };

    // Step 2: Save candidate record to database
    const handleSave = async () => {
        if (!candidateName.trim()) {
            setResultMessage('Name is required.');
            return;
        }

        setStep('saving');
        setResultMessage('');

        try {
            // Ensure valid auth token
            // await ensureRealToken(); // Removed as api client handles it


            const skillsArray = candidateSkills
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

            await candidatesApi.create({
                name: candidateName.trim(),
                email: candidateEmail.trim() || undefined,
                phone: candidatePhone.trim() || undefined,
                location: candidateLocation.trim() || undefined,
                skills: skillsArray.length > 0 ? skillsArray : undefined,
                experience: candidateExperience
                    ? parseFloat(candidateExperience.replace(/[^0-9.]/g, '')) || undefined
                    : undefined,
                ctcCurrent: candidateCtcCurrent ? parseFloat(candidateCtcCurrent) : undefined,
                ctcExpected: candidateCtcExpected ? parseFloat(candidateCtcExpected) : undefined,
                remark: candidateRemark.trim() || `Resume: ${file?.name || 'uploaded'}`,
            });

            setStep('success');
            setResultMessage('Candidate record saved successfully!');
        } catch (err) {
            setStep('review');
            setResultMessage(err instanceof Error ? err.message : 'Failed to save candidate.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'upload' || step === 'error' || step === 'ingesting'
                            ? 'Upload Resume'
                            : step === 'review' || step === 'saving'
                                ? 'Review Candidate Details'
                                : 'Record Saved'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'upload' || step === 'error'
                            ? 'Upload a PDF resume to process via the ingestion pipeline.'
                            : step === 'ingesting'
                                ? 'Processing your resume through the backend...'
                                : step === 'review' || step === 'saving'
                                    ? 'Fill in the candidate details and submit to save to the database.'
                                    : 'The candidate has been added to the database.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* ========== STEP 1: Upload ========== */}
                    {(step === 'upload' || step === 'error' || step === 'ingesting') && (
                        <>
                            <div
                                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${step === 'ingesting' ? 'pointer-events-none opacity-60' : ''}
                  ${isDragging
                                        ? 'border-primary bg-primary/5'
                                        : file
                                            ? 'border-primary/50 bg-primary/5'
                                            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                                    }
                `}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => step !== 'ingesting' && fileInputRef.current?.click()}
                            >
                                {file ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="w-10 h-10 text-primary" />
                                        <p className="font-medium text-sm">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024).toFixed(1)} KB — Click or drop to replace
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-10 h-10 text-muted-foreground" />
                                        <p className="font-medium text-sm">
                                            {isDragging ? 'Drop file here' : 'Click or drag & drop to upload'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Supports PDF, PNG, JPG, TIFF (max 50MB)
                                        </p>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={ACCEPTED_EXTENSIONS}
                                    onChange={handleInputChange}
                                    className="hidden"
                                />
                            </div>

                            {step === 'ingesting' && (
                                <div className="flex flex-col items-center gap-3 py-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">
                                        Sending resume to ingestion pipeline...
                                    </p>
                                </div>
                            )}

                            {step === 'error' && resultMessage && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{resultMessage}</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* ========== STEP 2: Review / Candidate Form ========== */}
                    {(step === 'review' || step === 'saving') && (
                        <>
                            {/* Success banner for ingestion */}
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 text-sm">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span>
                                    <strong>{file?.name}</strong> uploaded and queued for processing.
                                    Fill in the candidate details below.
                                </span>
                            </div>

                            {/* Form fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="name" className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" /> Full Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={candidateName}
                                        onChange={(e) => setCandidateName(e.target.value)}
                                        placeholder="Candidate full name"
                                        disabled={step === 'saving'}
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" /> Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={candidateEmail}
                                        onChange={(e) => setCandidateEmail(e.target.value)}
                                        placeholder="email@example.com"
                                        disabled={step === 'saving'}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5" /> Phone
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={candidatePhone}
                                        onChange={(e) => setCandidatePhone(e.target.value)}
                                        placeholder="+91 98765 43210"
                                        disabled={step === 'saving'}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location" className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" /> Location
                                    </Label>
                                    <Input
                                        id="location"
                                        value={candidateLocation}
                                        onChange={(e) => setCandidateLocation(e.target.value)}
                                        placeholder="City, Country"
                                        disabled={step === 'saving'}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="experience" className="flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5" /> Experience (years)
                                    </Label>
                                    <Input
                                        id="experience"
                                        value={candidateExperience}
                                        onChange={(e) => setCandidateExperience(e.target.value)}
                                        placeholder="e.g. 5"
                                        disabled={step === 'saving'}
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="skills" className="flex items-center gap-1.5">
                                        Skills (comma-separated)
                                    </Label>
                                    <Input
                                        id="skills"
                                        value={candidateSkills}
                                        onChange={(e) => setCandidateSkills(e.target.value)}
                                        placeholder="React, Node.js, Python, SQL"
                                        disabled={step === 'saving'}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ctcCurrent" className="flex items-center gap-1.5">
                                        <IndianRupee className="w-3.5 h-3.5" /> Current CTC (LPA)
                                    </Label>
                                    <Input
                                        id="ctcCurrent"
                                        type="number"
                                        value={candidateCtcCurrent}
                                        onChange={(e) => setCandidateCtcCurrent(e.target.value)}
                                        placeholder="e.g. 12.5"
                                        disabled={step === 'saving'}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ctcExpected" className="flex items-center gap-1.5">
                                        <IndianRupee className="w-3.5 h-3.5" /> Expected CTC (LPA)
                                    </Label>
                                    <Input
                                        id="ctcExpected"
                                        type="number"
                                        value={candidateCtcExpected}
                                        onChange={(e) => setCandidateCtcExpected(e.target.value)}
                                        placeholder="e.g. 18.0"
                                        disabled={step === 'saving'}
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="remark" className="flex items-center gap-1.5">
                                        Remarks / Notes
                                    </Label>
                                    <Input
                                        id="remark"
                                        value={candidateRemark}
                                        onChange={(e) => setCandidateRemark(e.target.value)}
                                        placeholder="Any additional notes..."
                                        disabled={step === 'saving'}
                                    />
                                </div>
                            </div>

                            {resultMessage && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{resultMessage}</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* ========== STEP 3: Success ========== */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center gap-3 py-6">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                            <p className="font-medium text-green-600">{resultMessage}</p>
                            <p className="text-sm text-muted-foreground">
                                {candidateName} has been added to the database.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 'success' ? (
                        <Button onClick={() => handleClose(false)}>Done</Button>
                    ) : step === 'review' || step === 'saving' ? (
                        <div className="flex gap-2 w-full justify-between">
                            <Button
                                variant="outline"
                                onClick={() => { setStep('upload'); setResultMessage(''); }}
                                disabled={step === 'saving'}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleClose(false)}
                                    disabled={step === 'saving'}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={step === 'saving'}>
                                    {step === 'saving' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Candidate
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2 w-full justify-end">
                            <Button
                                variant="outline"
                                onClick={() => handleClose(false)}
                                disabled={step === 'ingesting'}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleIngest}
                                disabled={!file || step === 'ingesting'}
                            >
                                {step === 'ingesting' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Process Resume
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
