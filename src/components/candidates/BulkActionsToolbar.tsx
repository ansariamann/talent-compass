import { useState } from 'react';
import { 
  X, 
  Download, 
  UserPlus, 
  RefreshCw, 
  ChevronDown,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { Candidate, CandidateStatus, Client } from '@/types/ats';

interface BulkActionsToolbarProps {
  selectedCandidates: Candidate[];
  clients: Client[];
  onClearSelection: () => void;
  onStatusChange: (candidateIds: string[], status: CandidateStatus) => void;
  onAssignToClient: () => void;
}

const statusOptions: { value: CandidateStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-status-info' },
  { value: 'screening', label: 'Screening', color: 'bg-status-pending' },
  { value: 'submitted', label: 'Submitted', color: 'bg-status-warning' },
  { value: 'interview_scheduled', label: 'Interview Scheduled', color: 'bg-status-warning' },
  { value: 'interviewed', label: 'Interviewed', color: 'bg-status-warning' },
  { value: 'offered', label: 'Offered', color: 'bg-primary' },
  { value: 'hired', label: 'Hired', color: 'bg-status-success' },
  { value: 'rejected', label: 'Rejected', color: 'bg-status-error' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-muted-foreground' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-muted-foreground' },
];

export function BulkActionsToolbar({
  selectedCandidates,
  clients,
  onClearSelection,
  onStatusChange,
  onAssignToClient,
}: BulkActionsToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);

  const count = selectedCandidates.length;

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      // Simulate export - in real app, this would call backend API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = selectedCandidates.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        skills: c.skills.join(', '),
        experience: c.experience,
        status: c.currentStatus,
      }));

      if (format === 'csv') {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `candidates-export-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `candidates-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast.success(`Exported ${count} candidate${count > 1 ? 's' : ''} as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatusChange = (status: CandidateStatus) => {
    onStatusChange(selectedCandidates.map(c => c.id), status);
    toast.success(`Updated status of ${count} candidate${count > 1 ? 's' : ''} to ${status}`);
  };

  const handleAssignToClient = () => {
    onAssignToClient();
  };

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
          {count}
        </div>
        <span className="text-sm font-medium">
          candidate{count > 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Export dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            Export
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Export Format</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('json')}>
            <FileJson className="w-4 h-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Submit to Client — opens modal */}
      <Button variant="ghost" size="sm" onClick={handleAssignToClient}>
        <UserPlus className="w-4 h-4 mr-2" />
        Submit to Client
      </Button>

      {/* Change Status dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Change Status
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>New Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {statusOptions.map(status => (
            <DropdownMenuItem 
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                {status.label}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      {/* Clear selection */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClearSelection}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4 mr-1" />
        Clear
      </Button>
    </div>
  );
}
