// API client for backend communication
// Uses fetchWithAuth for authenticated requests

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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Get token from localStorage
const getToken = () => localStorage.getItem('auth_token');

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Authenticated fetch wrapper
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || 'Request failed');
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text);
}

// ============ Type Transformers ============

// Backend Candidate → Frontend Candidate
interface BackendCandidate {
  id: string;
  client_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  skills?: { skills?: string[] } | null;
  experience?: Record<string, unknown> | null;
  ctc_current?: number | null;
  ctc_expected?: number | null;
  status: string;
  remark?: string | null;
  candidate_hash?: string | null;
  created_at: string;
  updated_at: string;
}

function transformCandidate(backend: BackendCandidate): Candidate {
  // Map backend status to frontend status
  const statusMap: Record<string, Candidate['currentStatus']> = {
    'ACTIVE': 'new',
    'INACTIVE': 'on_hold',
    'LEFT': 'withdrawn',
    'HIRED': 'hired',
    'REJECTED': 'rejected',
  };

  // Extract skills array from JSONB
  const skills = backend.skills?.skills || [];

  // Extract experience years from JSONB (default to 0 if not available)
  let experience = 0;
  if (backend.experience && typeof backend.experience === 'object') {
    experience = (backend.experience as { years?: number }).years || 0;
  }

  return {
    id: backend.id,
    name: backend.name,
    email: backend.email || '',
    phone: backend.phone || undefined,
    skills: Array.isArray(skills) ? skills : [],
    experience,
    currentStatus: statusMap[backend.status] || 'new',
    resumeUrl: undefined,
    resumeParsed: undefined,
    flags: [],
    isBlacklisted: backend.status === 'REJECTED',
    isLeaver: backend.status === 'LEFT',
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

// Frontend Candidate → Backend format for updates
function toBackendCandidate(frontend: Partial<Candidate>): Record<string, unknown> {
  const statusMap: Record<string, string> = {
    'new': 'ACTIVE',
    'screening': 'ACTIVE',
    'submitted': 'ACTIVE',
    'interview_scheduled': 'ACTIVE',
    'interviewed': 'ACTIVE',
    'offered': 'ACTIVE',
    'hired': 'HIRED',
    'rejected': 'REJECTED',
    'withdrawn': 'LEFT',
    'on_hold': 'INACTIVE',
  };

  const result: Record<string, unknown> = {};

  if (frontend.name !== undefined) result.name = frontend.name;
  if (frontend.email !== undefined) result.email = frontend.email;
  if (frontend.phone !== undefined) result.phone = frontend.phone;
  if (frontend.skills !== undefined) result.skills = { skills: frontend.skills };
  if (frontend.experience !== undefined) result.experience = { years: frontend.experience };
  if (frontend.currentStatus !== undefined) result.status = statusMap[frontend.currentStatus] || 'ACTIVE';

  return result;
}

// Backend Application → Frontend Application
interface BackendApplication {
  id: string;
  candidate_id: string;
  client_id: string;
  job_title?: string | null;
  status: string;
  is_flagged: boolean;
  flag_reason?: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

function transformApplication(backend: BackendApplication): Application {
  // Map backend status to frontend status
  const statusMap: Record<string, Application['status']> = {
    'NEW': 'pending',
    'IN_REVIEW': 'in_review',
    'SHORTLISTED': 'shortlisted',
    'INTERVIEW': 'interview',
    'OFFER': 'offer',
    'ACCEPTED': 'accepted',
    'DECLINED': 'declined',
    'REJECTED': 'rejected',
  };

  return {
    id: backend.id,
    candidateId: backend.candidate_id,
    clientId: backend.client_id,
    jobTitle: backend.job_title || 'Unknown Position',
    status: statusMap[backend.status] || 'pending',
    submittedAt: backend.created_at,
    lastActivityAt: backend.updated_at,
    notes: [],
    auditLog: [],
  };
}

// Backend list response transformer
interface BackendListResponse<T> {
  items?: T[];
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
}

function transformPaginatedResponse<B, F>(
  backend: BackendListResponse<B> | B[],
  transformer: (item: B) => F,
  page: number = 1,
  pageSize: number = 25
): PaginatedResponse<F> {
  // Handle array response (simple list)
  if (Array.isArray(backend)) {
    return {
      data: backend.map(transformer),
      total: backend.length,
      page: 1,
      pageSize: backend.length,
      totalPages: 1,
    };
  }

  // Handle paginated response object
  const items = backend.items || backend.data || [];
  const total = backend.total || items.length;

  return {
    data: items.map(transformer),
    total,
    page: backend.page || page,
    pageSize: backend.limit || pageSize,
    totalPages: Math.ceil(total / (backend.limit || pageSize)),
  };
}

// ============ API Endpoints ============

// Auth
export const authApi = {
  getCurrentUser: () => fetchWithAuth<User>('/auth/me'),
  logout: () => fetchWithAuth<void>('/auth/logout', { method: 'POST' }),
};

// Candidates
export const candidatesApi = {
  list: async (filters: CandidateFilters = {}, page = 1, pageSize = 25): Promise<PaginatedResponse<Candidate>> => {
    const params = new URLSearchParams({
      skip: String((page - 1) * pageSize),
      limit: String(pageSize),
    });

    // Add filters
    if (filters.search) params.set('name_pattern', filters.search);
    if (filters.skills?.length) params.set('skills', filters.skills.join(','));
    if (filters.status?.length) {
      // Map frontend statuses to backend
      const backendStatuses = filters.status.map(s => {
        const map: Record<string, string> = {
          'new': 'ACTIVE', 'hired': 'HIRED', 'rejected': 'REJECTED',
          'withdrawn': 'LEFT', 'on_hold': 'INACTIVE',
        };
        return map[s] || 'ACTIVE';
      });
      params.set('status', backendStatuses[0]); // Backend only supports single status filter
    }

    const response = await fetchWithAuth<BackendCandidate[]>(`/candidates?${params}`);
    return transformPaginatedResponse(response, transformCandidate, page, pageSize);
  },

  get: async (id: string): Promise<Candidate> => {
    const response = await fetchWithAuth<BackendCandidate>(`/candidates/${id}`);
    return transformCandidate(response);
  },

  create: async (data: Partial<Candidate>): Promise<Candidate> => {
    const backendData = toBackendCandidate(data);
    const response = await fetchWithAuth<BackendCandidate>('/candidates', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
    return transformCandidate(response);
  },

  update: async (id: string, data: Partial<Candidate>): Promise<Candidate> => {
    const backendData = toBackendCandidate(data);
    const response = await fetchWithAuth<BackendCandidate>(`/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(backendData),
    });
    return transformCandidate(response);
  },

  search: async (query: string): Promise<Candidate[]> => {
    // Backend only has email search, so we use list with name_pattern
    const params = new URLSearchParams({
      name_pattern: query,
      limit: '50',
    });
    const response = await fetchWithAuth<BackendCandidate[]>(`/candidates?${params}`);
    return response.map(transformCandidate);
  },

  getStatistics: () => fetchWithAuth<{
    total_candidates: number;
    by_status: Record<string, number>;
  }>('/candidates/statistics'),
};

// Applications
export const applicationsApi = {
  list: async (filters: ApplicationFilters = {}, page = 1, pageSize = 25): Promise<PaginatedResponse<Application>> => {
    const params = new URLSearchParams({
      skip: String((page - 1) * pageSize),
      limit: String(pageSize),
    });

    // Add filters
    if (filters.status?.length) params.set('status', filters.status[0]);
    if (filters.candidateId) params.set('candidate_id', filters.candidateId);

    const response = await fetchWithAuth<BackendApplication[]>(`/applications?${params}`);
    return transformPaginatedResponse(response, transformApplication, page, pageSize);
  },

  get: async (id: string): Promise<Application> => {
    const response = await fetchWithAuth<BackendApplication>(`/applications/${id}`);
    return transformApplication(response);
  },

  updateStatus: async (id: string, status: string, note?: string): Promise<Application> => {
    // Map frontend status to backend
    const statusMap: Record<string, string> = {
      'pending': 'NEW',
      'in_review': 'IN_REVIEW',
      'shortlisted': 'SHORTLISTED',
      'interview': 'INTERVIEW',
      'offer': 'OFFER',
      'accepted': 'ACCEPTED',
      'declined': 'DECLINED',
      'rejected': 'REJECTED',
    };

    const params = new URLSearchParams({
      new_status: statusMap[status] || status,
    });
    if (note) params.set('note', note);

    const response = await fetchWithAuth<BackendApplication>(
      `/applications/${id}/status?${params}`,
      { method: 'PATCH' }
    );
    return transformApplication(response);
  },

  addNote: async (id: string, content: string, isInternal = false): Promise<Application> => {
    // Note: Backend may not have notes endpoint, this is a placeholder
    const response = await fetchWithAuth<BackendApplication>(`/applications/${id}`);
    return transformApplication(response);
  },

  getByCandidate: async (candidateId: string): Promise<Application[]> => {
    const response = await fetchWithAuth<BackendApplication[]>(
      `/applications/candidate/${candidateId}`
    );
    return response.map(transformApplication);
  },

  getStatistics: () => fetchWithAuth<{
    total_applications: number;
    by_status: Record<string, number>;
    flagged_count: number;
    deleted_count: number;
  }>('/applications/statistics'),
};

// Clients - Note: Backend may not have this endpoint yet
export const clientsApi = {
  list: async (): Promise<Client[]> => {
    try {
      const response = await fetchWithAuth<Client[]>('/clients');
      return response;
    } catch {
      // Fallback to empty array if endpoint doesn't exist
      console.warn('Clients endpoint not available, using empty list');
      return [];
    }
  },
  get: async (id: string): Promise<Client> => {
    return fetchWithAuth<Client>(`/clients/${id}`);
  },
};

// Copilot (LLM) - Note: Backend may not have this endpoint
export const copilotApi = {
  query: (data: CopilotQuery) =>
    fetchWithAuth<CopilotResponse>('/copilot/query', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// SSE Connection
export function createSSEConnection(
  onEvent: (event: { type: string; payload: unknown }) => void,
  onError?: (error: Error) => void
): () => void {
  const token = getToken();
  const url = token
    ? `${API_BASE}/events/stream?token=${token}`
    : `${API_BASE}/events/stream`;

  const eventSource = new EventSource(url);

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

// Export types for use in hooks
export type { BackendCandidate, BackendApplication };
