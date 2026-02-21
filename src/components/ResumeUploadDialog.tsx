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
import { candidatesApi } from '@/lib/api';

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






export function ResumeUploadDialog({ open, onOpenChange, onSuccess }: ResumeUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<DialogStep>('upload');
    const [resultMessage, setResultMessage] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [candidate, setCandidate] = useState<any>(null);

    const reset = () => {
        setFile(null);
        setStep('upload');
        setResultMessage('');
        setIsDragging(false);
        setCandidate(null);
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

    const handleUpload = async () => {
        if (!file) return;

        setStep('ingesting');
        setResultMessage('');

        try {
            const candidateData = await candidatesApi.uploadResume(file);
            setCandidate(candidateData);
            setStep('success');
            setResultMessage('Candidate record saved successfully!');
        } catch (err) {
            console.error('Upload error:', err);
            setStep('error');
            setResultMessage(err instanceof Error ? err.message : 'Upload failed');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'upload' || step === 'error' || step === 'ingesting'
                            ? 'Upload Resume'
                            : 'Upload Successful'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'upload' || step === 'error'
                            ? 'Upload a PDF resume to parse and save directly.'
                            : step === 'ingesting'
                                ? 'Processing and saving candidate...'
                                : 'The candidate has been added to the database.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* ========== STEP 1: Upload ========== */}
                    {(step === 'upload' || step === 'error' || step === 'ingesting') && (
                        <>
                            <div
                        className={`
                  relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                  transition-all duration-300
                  ${step === 'ingesting' ? 'pointer-events-none opacity-60' : ''}
                  ${isDragging
                    ? 'border-primary bg-primary/10 shadow-[0_0_24px_4px_hsl(var(--primary)/0.25)] scale-[1.02]'
                    : file
                      ? 'border-primary/60 bg-primary/5 shadow-[0_0_12px_2px_hsl(var(--primary)/0.12)]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_16px_2px_hsl(var(--primary)/0.15)]'
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
                                    <div className="flex flex-col items-center gap-3">
                                        <div className={`p-4 rounded-full transition-all duration-300 ${isDragging ? 'bg-primary/20 scale-110' : 'bg-muted/60'}`}>
                                            <Upload className={`w-8 h-8 transition-colors duration-300 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                        </div>
                                        <div>
                                            <p className={`font-semibold text-sm transition-colors duration-200 ${isDragging ? 'text-primary' : 'text-foreground'}`}>
                                                {isDragging ? '✦ Release to upload' : 'Click or drag & drop to upload'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                PDF, PNG, JPG, TIFF — up to 50MB
                                            </p>
                                        </div>
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
                                        Parsing resume and creating candidate...
                                    </p>
                                </div>
                            )}

                            {step === 'error' && resultMessage && (
                                <div className="flex items-center gap-2 p-3 mt-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{resultMessage}</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* ========== STEP 2: Success (Detailed View) ========== */}
                    {step === 'success' && candidate && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 bg-green-50/50 border border-green-200 rounded-lg">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-900">Success</p>
                                    <p className="text-sm text-green-700">{resultMessage}</p>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-lg p-4 space-y-4 border">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg">{candidate.name}</h3>
                                        <p className="text-sm text-muted-foreground capitalize">{candidate.location || 'Location not specified'}</p>
                                    </div>
                                    {candidate.resumeParsed?.confidence_score && (
                                        <div className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
                                            {Math.round(candidate.resumeParsed.confidence_score * 100)}% Match
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate">{candidate.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-4 h-4" />
                                        <span className="truncate">{candidate.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Briefcase className="w-4 h-4" />
                                        <span>{candidate.experience} Years Exp.</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <IndianRupee className="w-4 h-4" />
                                        <span>
                                            {candidate.ctcCurrent ? `${candidate.ctcCurrent} LPA` : 'N/A'} (Cur.)
                                        </span>
                                    </div>
                                </div>

                                {candidate.skills && candidate.skills.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Skills</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {candidate.skills.slice(0, 10).map((skill: any, i: number) => (
                                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                                    {typeof skill === 'string' ? skill : skill.name}
                                                </span>
                                            ))}
                                            {candidate.skills.length > 10 && (
                                                <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                                                    +{candidate.skills.length - 10} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 'success' ? (
                        <div className="flex w-full justify-between sm:justify-end gap-2">
                            <Button variant="outline" onClick={reset}>
                                Upload Another
                            </Button>
                            <Button onClick={() => handleClose(false)}>
                                Done
                            </Button>
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
                                onClick={handleUpload}
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
