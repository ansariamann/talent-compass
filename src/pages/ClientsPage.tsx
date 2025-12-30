import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockClients, mockApplications } from '@/lib/mock-data';
import { Building2, Mail, User, MoreHorizontal } from 'lucide-react';

export default function ClientsPage() {
  return (
    <DashboardLayout title="Clients">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockClients.map((client) => {
            const applicationCount = mockApplications.filter(a => a.clientId === client.id).length;
            
            return (
              <div 
                key={client.id}
                className="panel hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <h3 className="font-semibold mb-1">{client.name}</h3>
                  <Badge variant="secondary" className="mb-4">{client.industry}</Badge>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {client.contactName}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {client.contactEmail}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {applicationCount} active applications
                    </span>
                    <Badge variant={client.isActive ? 'success' : 'neutral'}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
