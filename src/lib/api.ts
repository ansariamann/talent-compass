// API client for backend communication
// This is a mock implementation - connect to your FastAPI backend

import type {
  Candidate,
  CandidateFilters,
  Application,
  ApplicationFilters,
  Client,
  PaginatedResponse,
  CopilotQuery,
  CopilotResponse,
  User,
} from '@/types/ats';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }

  return response.json();
}

// Auth
export const authApi = {
  getCurrentUser: () => fetchApi<User>('/auth/me'),
  logout: () => fetchApi<void>('/auth/logout', { method: 'POST' }),
};

// Candidates
export const candidatesApi = {
  list: (filters: CandidateFilters = {}, page = 1, pageSize = 25) =>
    fetchApi<PaginatedResponse<Candidate>>(
      `/candidates?${new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== undefined)
        ),
      })}`
    ),

  get: (id: string) => fetchApi<Candidate>(`/candidates/${id}`),

  update: (id: string, data: Partial<Candidate>) =>
    fetchApi<Candidate>(`/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  search: (query: string) =>
    fetchApi<Candidate[]>(`/candidates/search?q=${encodeURIComponent(query)}`),
};

// Applications
export const applicationsApi = {
  list: (filters: ApplicationFilters = {}, page = 1, pageSize = 25) =>
    fetchApi<PaginatedResponse<Application>>(
      `/applications?${new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== undefined)
        ),
      })}`
    ),

  get: (id: string) => fetchApi<Application>(`/applications/${id}`),

  updateStatus: (id: string, status: string, note?: string) =>
    fetchApi<Application>(`/applications/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, note }),
    }),

  addNote: (id: string, content: string, isInternal = false) =>
    fetchApi<Application>(`/applications/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content, isInternal }),
    }),
};

// Clients
export const clientsApi = {
  list: () => fetchApi<Client[]>('/clients'),
  get: (id: string) => fetchApi<Client>(`/clients/${id}`),
};

// Copilot (LLM)
export const copilotApi = {
  query: (data: CopilotQuery) =>
    fetchApi<CopilotResponse>('/copilot/query', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// SSE Connection
export function createSSEConnection(
  onEvent: (event: { type: string; payload: unknown }) => void,
  onError?: (error: Error) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/events/stream`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch (e) {
      console.error('Failed to parse SSE event:', e);
    }
  };

  eventSource.onerror = (event) => {
    console.error('SSE error:', event);
    onError?.(new Error('SSE connection failed'));
  };

  return () => {
    eventSource.close();
  };
}
