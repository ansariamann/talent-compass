import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/candidates/StatusBadge';
import { mockApplications } from '@/lib/mock-data';
import { MoreHorizontal, Calendar, MessageSquare } from 'lucide-react';
import type { Application } from '@/types/ats';

export default function ApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApplications = mockApplications.filter(app => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.candidate?.name.toLowerCase().includes(query) ||
      app.client?.name.toLowerCase().includes(query) ||
      app.jobTitle.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout title="Applications" onSearch={setSearchQuery}>
      <div className="p-6">
        <div className="grid gap-4">
          {filteredApplications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No applications found
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  return (
    <div className="panel hover:border-primary/30 transition-colors cursor-pointer">
      <div className="p-4 flex items-start justify-between">
        <div className="flex gap-4">
          {/* Candidate avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-medium shrink-0">
            {application.candidate?.name.split(' ').map(n => n[0]).join('')}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{application.candidate?.name}</h3>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm">{application.jobTitle}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline">{application.client?.name}</Badge>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Submitted {new Date(application.submittedAt).toLocaleDateString()}
              </span>
              {application.notes.length > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {application.notes.length} notes
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={application.status} type="application" />
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Audit log preview */}
      {application.auditLog.length > 0 && (
        <div className="px-4 pb-4 pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Latest:</span>
            {application.auditLog.slice(-1).map(entry => (
              <span key={entry.id}>
                {entry.performedByName} changed status to{' '}
                <Badge variant="neutral" className="text-[10px] px-1.5 py-0">
                  {entry.toStatus}
                </Badge>
                {' • '}
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
