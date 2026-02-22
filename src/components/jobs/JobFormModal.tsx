import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface JobFormData {
  title: string;
  companyName: string;
  postingDate?: string;
  requirements?: string;
  experienceRequired?: number;
  salaryLpa?: number;
  location?: string;
}

interface JobFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JobFormData) => Promise<void> | void;
}

export function JobFormModal({ open, onOpenChange, onSubmit }: JobFormModalProps) {
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    companyName: '',
    postingDate: '',
    requirements: '',
    experienceRequired: undefined,
    salaryLpa: undefined,
    location: '',
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        title: '',
        companyName: '',
        postingDate: '',
        requirements: '',
        experienceRequired: undefined,
        salaryLpa: undefined,
        location: '',
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Job title is required');
      return;
    }
    if (!formData.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    await onSubmit({
      ...formData,
      postingDate: formData.postingDate || undefined,
      requirements: formData.requirements?.trim() || undefined,
      location: formData.location?.trim() || undefined,
      experienceRequired: formData.experienceRequired,
      salaryLpa: formData.salaryLpa,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-2xl">
        <DialogHeader>
          <DialogTitle className="gradient-text text-xl">Add New Job</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Senior Backend Engineer"
                className="mt-1"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Acme Corp"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="postingDate">Posting Date</Label>
              <Input
                id="postingDate"
                type="date"
                value={formData.postingDate}
                onChange={(e) => setFormData({ ...formData, postingDate: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Bengaluru, India"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="experienceRequired">Experience Required (Years)</Label>
              <Input
                id="experienceRequired"
                type="number"
                min={0}
                max={60}
                value={formData.experienceRequired ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    experienceRequired: value === '' ? undefined : Number(value),
                  });
                }}
                placeholder="3"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="salaryLpa">Salary (LPA)</Label>
              <Input
                id="salaryLpa"
                type="number"
                min={0}
                step={0.1}
                value={formData.salaryLpa ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    salaryLpa: value === '' ? undefined : Number(value),
                  });
                }}
                placeholder="12.5"
                className="mt-1"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Key skills, responsibilities, and must-have qualifications"
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-vibrant">
              Add Job
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
