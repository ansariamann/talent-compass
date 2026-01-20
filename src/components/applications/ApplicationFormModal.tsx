import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Application, Candidate, Client } from '@/types/ats';

interface ApplicationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { candidateId: string; clientId: string; jobTitle: string }) => Promise<void>;
  onUpdate?: (id: string, data: { jobTitle?: string }) => Promise<void>;
  application?: Application | null;
  candidates: Candidate[];
  clients: Client[];
  isLoading?: boolean;
}

export function ApplicationFormModal({
  open,
  onOpenChange,
  onSubmit,
  onUpdate,
  application,
  candidates,
  clients,
  isLoading,
}: ApplicationFormModalProps) {
  const [candidateId, setCandidateId] = useState('');
  const [clientId, setClientId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!application;

  useEffect(() => {
    if (application) {
      setCandidateId(application.candidateId);
      setClientId(application.clientId);
      setJobTitle(application.jobTitle);
    } else {
      setCandidateId('');
      setClientId('');
      setJobTitle('');
    }
    setError(null);
  }, [application, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!jobTitle.trim()) {
      setError('Job title is required');
      return;
    }

    try {
      if (isEditing && onUpdate) {
        await onUpdate(application.id, { jobTitle });
      } else {
        if (!candidateId || !clientId) {
          setError('Please select both candidate and client');
          return;
        }
        await onSubmit({ candidateId, clientId, jobTitle });
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Application' : 'Create Application'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the application details.'
              : 'Create a new application by selecting a candidate and client.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="candidate">Candidate</Label>
                <Select value={candidateId} onValueChange={setCandidateId}>
                  <SelectTrigger id="candidate">
                    <SelectValue placeholder="Select a candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name} ({candidate.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}