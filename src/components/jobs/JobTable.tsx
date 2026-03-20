import { useState } from 'react';
import { Job } from '@/types/ats';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Briefcase, MapPin, Building2, Calendar, FileText, Send } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface JobTableProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onSubmitCandidates: (job: Job) => void;
}

export function JobTable({ jobs, onSelectJob, onSubmitCandidates }: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/20 rounded-lg m-4 border border-dashed border-border">
        <Briefcase className="w-12 h-12 mb-4 opacity-20" />
        <p>No jobs found matching your criteria</p>
      </div>
    );
  }

  const formatLpa = (lpa: number | undefined) => {
    if (!lpa) return 'Not specified';
    return `Rs ${lpa} LPA`;
  };

  return (
    <Table>
      <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-md z-10">
        <TableRow>
          <TableHead>Job Title / Role</TableHead>
          <TableHead>Client / Company</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Experience</TableHead>
          <TableHead>Salary</TableHead>
          <TableHead>Posted</TableHead>
          <TableHead className="w-[80px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow
            key={job.id}
            className="group cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => onSelectJob(job)}
          >
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{job.title}</span>
              </div>
            </TableCell>
            
            <TableCell>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{job.companyName}</span>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{job.location || 'Remote/Any'}</span>
              </div>
            </TableCell>

            <TableCell>
              <span className="text-muted-foreground">
                {job.experienceRequired !== undefined ? `${job.experienceRequired}+ years` : 'Not specified'}
              </span>
            </TableCell>

            <TableCell>
              <span className="text-muted-foreground">
                {formatLpa(job.salaryLpa)}
              </span>
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="w-3 h-3" />
                <span>
                  {job.postingDate
                    ? formatDistanceToNow(parseISO(job.postingDate), { addSuffix: true })
                    : 'Recently'}
                </span>
              </div>
            </TableCell>

            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onSelectJob(job)}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSubmitCandidates(job)}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Candidates
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
