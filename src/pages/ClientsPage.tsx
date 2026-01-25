import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { ClientActionsMenu } from '@/components/clients/ClientActionsMenu';
import { 
  useClients, 
  useCreateClient, 
  useUpdateClient, 
  useDeleteClient, 
  useSendClientInvite,
  useToggleClientActive 
} from '@/hooks/useClients';
import { mockApplications } from '@/lib/mock-data';
import { Building2, Mail, User, Phone, Plus, Search, Link, CheckCircle2, Clock } from 'lucide-react';
import type { Client } from '@/types/ats';

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const sendInvite = useSendClientInvite();
  const toggleActive = useToggleClientActive();

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClient = () => {
    setSelectedClient(null);
    setShowFormModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowFormModal(true);
  };

  const handleSubmitClient = (data: Partial<Client>) => {
    if (selectedClient) {
      updateClient.mutate({ id: selectedClient.id, data });
    } else {
      createClient.mutate(data);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClient.mutate(clientId);
  };

  const handleSendInvite = (clientId: string) => {
    sendInvite.mutate(clientId);
  };

  const handleToggleActive = (clientId: string, isActive: boolean) => {
    toggleActive.mutate({ id: clientId, isActive });
  };

  return (
    <DashboardLayout title="Clients">
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleAddClient} className="btn-vibrant">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass p-4 rounded-lg">
            <div className="text-2xl font-bold gradient-text">{clients.length}</div>
            <div className="text-sm text-muted-foreground">Total Clients</div>
          </div>
          <div className="glass p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{clients.filter(c => c.isActive).length}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="glass p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{clients.filter(c => c.isRegistered).length}</div>
            <div className="text-sm text-muted-foreground">Registered</div>
          </div>
          <div className="glass p-4 rounded-lg">
            <div className="text-2xl font-bold text-amber-400">
              {clients.filter(c => c.registrationToken && !c.isRegistered).length}
            </div>
            <div className="text-sm text-muted-foreground">Pending Invite</div>
          </div>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="panel animate-pulse h-64" />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No clients found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Add your first client to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={handleAddClient} className="btn-vibrant">
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => {
              const applicationCount = mockApplications.filter(a => a.clientId === client.id).length;
              
              return (
                <div 
                  key={client.id}
                  className="panel hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-vibrant-purple/20 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <ClientActionsMenu 
                        client={client}
                        onEdit={handleEditClient}
                        onDelete={handleDeleteClient}
                        onSendInvite={handleSendInvite}
                        onToggleActive={handleToggleActive}
                      />
                    </div>

                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {client.name}
                    </h3>
                    <Badge variant="secondary" className="mb-4">{client.industry}</Badge>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{client.contactName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{client.contactEmail}</span>
                      </div>
                      {client.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{client.contactPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Registration Status */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        {client.isRegistered ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Registered
                          </Badge>
                        ) : client.registrationToken ? (
                          <Badge variant="warning" className="gap-1">
                            <Clock className="w-3 h-3" />
                            Invite Sent
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Link className="w-3 h-3" />
                            Not Invited
                          </Badge>
                        )}
                        <Badge variant={client.isActive ? 'success' : 'neutral'}>
                          {client.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {applicationCount} active application{applicationCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ClientFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        client={selectedClient}
        onSubmit={handleSubmitClient}
      />
    </DashboardLayout>
  );
}
