import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { mockClients } from '@/lib/mock-data';
import type { Client } from '@/types/ats';
import { toast } from 'sonner';

// Use mock data for now until backend is connected
const useMockData = true;

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      if (useMockData) {
        // Add registration fields to mock data
        return mockClients.map(client => ({
          ...client,
          isRegistered: false,
          registrationToken: undefined,
          registrationSentAt: undefined,
          registeredAt: undefined,
        })) as Client[];
      }
      return clientsApi.list();
    },
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      if (useMockData) {
        const client = mockClients.find(c => c.id === id);
        if (!client) throw new Error('Client not found');
        return {
          ...client,
          isRegistered: false,
        } as Client;
      }
      return clientsApi.get(id);
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Client>) => {
      if (useMockData) {
        const newClient: Client = {
          id: `client_${Date.now()}`,
          name: data.name || '',
          industry: data.industry || '',
          contactEmail: data.contactEmail || '',
          contactName: data.contactName || '',
          contactPhone: data.contactPhone,
          address: data.address,
          website: data.website,
          isActive: data.isActive ?? true,
          isRegistered: false,
          createdAt: new Date().toISOString(),
        };
        // In real app, this would be an API call
        mockClients.push(newClient);
        return newClient;
      }
      return clientsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create client: ${error.message}`);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      if (useMockData) {
        const index = mockClients.findIndex(c => c.id === id);
        if (index !== -1) {
          mockClients[index] = { ...mockClients[index], ...data, updatedAt: new Date().toISOString() };
          return mockClients[index] as Client;
        }
        throw new Error('Client not found');
      }
      return clientsApi.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (useMockData) {
        const index = mockClients.findIndex(c => c.id === id);
        if (index !== -1) {
          mockClients.splice(index, 1);
          return;
        }
        throw new Error('Client not found');
      }
      return clientsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });
}

export function useSendClientInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      if (useMockData) {
        const index = mockClients.findIndex(c => c.id === clientId);
        if (index !== -1) {
          // Generate a mock registration token
          const token = `reg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          (mockClients[index] as Client).registrationToken = token;
          (mockClients[index] as Client).registrationSentAt = new Date().toISOString();
          return { 
            token, 
            link: `${window.location.origin}/client-register?token=${token}` 
          };
        }
        throw new Error('Client not found');
      }
      // In real app: return clientsApi.sendInvite(clientId);
      throw new Error('Not implemented');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Registration link sent successfully');
      // Copy link to clipboard
      navigator.clipboard.writeText(data.link);
      toast.info('Link copied to clipboard');
    },
    onError: (error) => {
      toast.error(`Failed to send invite: ${error.message}`);
    },
  });
}

export function useToggleClientActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (useMockData) {
        const index = mockClients.findIndex(c => c.id === id);
        if (index !== -1) {
          mockClients[index].isActive = isActive;
          return mockClients[index] as Client;
        }
        throw new Error('Client not found');
      }
      return clientsApi.update(id, { isActive });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`Client ${variables.isActive ? 'activated' : 'deactivated'}`);
    },
    onError: (error) => {
      toast.error(`Failed to update client status: ${error.message}`);
    },
  });
}
