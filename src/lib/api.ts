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
  ResumeJob,
  EmailIngestionRequest,
  IngestionResponse,
  ParseJobResponse,
  Job,
  JobFilters,
} from '@/types/ats';

const API_BASE = import.meta.env.VITE_API_URL || '';

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


  const headers: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
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
  present_address?: string | null;
  permanent_address?: string | null;
  date_of_birth?: string | null;
  previous_employment?: Record<string, unknown>[] | null;
  key_skill?: string | null;
  skills?: { skills?: string[] } | null;
  experience?: Record<string, unknown> | null;
  ctc_current?: number | null;
  ctc_expected?: number | null;
  resume_url?: string | null;
  resume_file_path?: string | null;
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
  const rawResumeUrl = backend.resume_url || backend.resume_file_path;
  const resumeUrl = rawResumeUrl
    ? (rawResumeUrl.startsWith('http') ? rawResumeUrl : `${API_BASE}${rawResumeUrl}`)
    : undefined;
  const ctcCurrent = backend.ctc_current == null ? undefined : Number(backend.ctc_current);
  const ctcExpected = backend.ctc_expected == null ? undefined : Number(backend.ctc_expected);

  return {
    id: backend.id,
    name: backend.name,
    email: backend.email || '',
    phone: backend.phone || undefined,
    location: backend.location || undefined,
    presentAddress: backend.present_address || undefined,
    permanentAddress: backend.permanent_address || undefined,
    dateOfBirth: backend.date_of_birth || undefined,
    previousEmployment: backend.previous_employment || undefined,
    keySkill: backend.key_skill || undefined,
    skills: Array.isArray(skills) ? skills : [],
    experience,
    currentStatus: statusMap[backend.status] || 'new',
    resumeUrl,
    resumeParsed: undefined,
    flags: [],
    isBlacklisted: backend.status === 'REJECTED',
    isLeaver: backend.status === 'LEFT',
    remark: backend.remark || undefined,
    ctcCurrent,
    ctcExpected,
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
  if (frontend.location !== undefined) result.location = frontend.location;
  if (frontend.presentAddress !== undefined) result.present_address = frontend.presentAddress;
  if (frontend.permanentAddress !== undefined) result.permanent_address = frontend.permanentAddress;
  if (frontend.dateOfBirth !== undefined) result.date_of_birth = frontend.dateOfBirth;
  if (frontend.previousEmployment !== undefined) result.previous_employment = frontend.previousEmployment;
  if (frontend.keySkill !== undefined) result.key_skill = frontend.keySkill;
  if (frontend.skills !== undefined) result.skills = { skills: frontend.skills };
  if (frontend.experience !== undefined) result.experience = { years: frontend.experience };
  if (frontend.currentStatus !== undefined) result.status = statusMap[frontend.currentStatus] || 'ACTIVE';
  if (frontend.remark !== undefined) result.remark = frontend.remark;
  if (frontend.ctcCurrent !== undefined) result.ctc_current = frontend.ctcCurrent;
  if (frontend.ctcExpected !== undefined) result.ctc_expected = frontend.ctcExpected;

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

interface BackendJob {
  id: string;
  client_id: string;
  title: string;
  company_name: string;
  posting_date: string;
  requirements?: string | null;
  experience_required?: number | null;
  salary_lpa?: number | null;
  location?: string | null;
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
    isFlagged: backend.is_flagged,
    flagReason: backend.flag_reason || undefined,
    isDeleted: backend.is_deleted,
  };
}

function transformJob(backend: BackendJob): Job {
  return {
    id: backend.id,
    clientId: backend.client_id,
    title: backend.title,
    companyName: backend.company_name,
    postingDate: backend.posting_date,
    requirements: backend.requirements || undefined,
    experienceRequired: backend.experience_required ?? undefined,
    salaryLpa: backend.salary_lpa ?? undefined,
    location: backend.location || undefined,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
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
    if (filters.location) params.set('location', filters.location);
    if (filters.minExperience !== undefined) params.set('min_experience', String(filters.minExperience));
    if (filters.maxExperience !== undefined) params.set('max_experience', String(filters.maxExperience));
    if (filters.minCtcCurrent !== undefined) params.set('min_ctc_current', String(filters.minCtcCurrent));
    if (filters.maxCtcCurrent !== undefined) params.set('max_ctc_current', String(filters.maxCtcCurrent));
    if (filters.minCtcExpected !== undefined) params.set('min_ctc_expected', String(filters.minCtcExpected));
    if (filters.maxCtcExpected !== undefined) params.set('max_ctc_expected', String(filters.maxCtcExpected));
    if (filters.status?.length) {
      // Map frontend statuses to backend
      const backendStatuses = filters.status.map(s => {
        const map: Record<string, string> = {
          'new': 'ACTIVE', 'hired': 'HIRED', 'rejected': 'REJECTED',
          'withdrawn': 'LEFT', 'on_hold': 'INACTIVE',
        };
        return map[s] || 'ACTIVE';
      });
      params.set('candidate_status', backendStatuses[0]); // Backend currently supports single status filter
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

  uploadResume: async (file: File): Promise<Candidate> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchWithAuth<BackendCandidate>('/candidates/upload', {
      method: 'POST',
      body: formData,
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

  delete: async (id: string): Promise<void> => {
    await fetchWithAuth<void>(`/candidates/${id}`, {
      method: 'DELETE',
    });
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

  getByEmail: async (email: string): Promise<Candidate> => {
    const response = await fetchWithAuth<BackendCandidate>(`/candidates/email/${encodeURIComponent(email)}`);
    return transformCandidate(response);
  },

  findDuplicates: async (id: string): Promise<Candidate[]> => {
    const response = await fetchWithAuth<BackendCandidate[]>(`/candidates/${id}/duplicates`);
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
    if (filters.flaggedOnly) params.set('flagged_only', 'true');
    if (filters.includeDeleted) params.set('include_deleted', 'true');

    const response = await fetchWithAuth<BackendApplication[]>(`/applications?${params}`);
    return transformPaginatedResponse(response, transformApplication, page, pageSize);
  },

  get: async (id: string): Promise<Application> => {
    const response = await fetchWithAuth<BackendApplication>(`/applications/${id}`);
    return transformApplication(response);
  },

  create: async (data: { candidateId: string; clientId: string; jobTitle: string }): Promise<Application> => {
    const backendData = {
      candidate_id: data.candidateId,
      client_id: data.clientId,
      job_title: data.jobTitle,
    };
    const response = await fetchWithAuth<BackendApplication>('/applications/', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
    return transformApplication(response);
  },

  update: async (id: string, data: { jobTitle?: string; status?: string }): Promise<Application> => {
    const backendData: Record<string, unknown> = {};
    if (data.jobTitle) backendData.job_title = data.jobTitle;
    if (data.status) {
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
      backendData.status = statusMap[data.status] || data.status;
    }
    const response = await fetchWithAuth<BackendApplication>(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendData),
    });
    return transformApplication(response);
  },

  delete: async (id: string): Promise<void> => {
    await fetchWithAuth<void>(`/applications/${id}`, {
      method: 'DELETE',
    });
  },

  restore: async (id: string): Promise<Application> => {
    const response = await fetchWithAuth<BackendApplication>(`/applications/${id}/restore`, {
      method: 'POST',
    });
    return transformApplication(response);
  },

  flag: async (id: string, reason?: string): Promise<Application> => {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    const response = await fetchWithAuth<BackendApplication>(`/applications/${id}/flag${params}`, {
      method: 'POST',
    });
    return transformApplication(response);
  },

  unflag: async (id: string): Promise<Application> => {
    const response = await fetchWithAuth<BackendApplication>(`/applications/${id}/unflag`, {
      method: 'POST',
    });
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

// Jobs
export const jobsApi = {
  list: async (filters: JobFilters = {}, page = 1, pageSize = 100): Promise<PaginatedResponse<Job>> => {
    const params = new URLSearchParams({
      skip: String((page - 1) * pageSize),
      limit: String(pageSize),
    });

    if (filters.search) params.set('search', filters.search);
    if (filters.companyName) params.set('company_name', filters.companyName);
    if (filters.jobTitle) params.set('job_title', filters.jobTitle);
    if (filters.location) params.set('location', filters.location);
    if (filters.minExperience !== undefined) params.set('min_experience', String(filters.minExperience));
    if (filters.maxExperience !== undefined) params.set('max_experience', String(filters.maxExperience));

    const response = await fetchWithAuth<BackendJob[]>(`/jobs?${params}`);
    return transformPaginatedResponse(response, transformJob, page, pageSize);
  },

  create: async (data: {
    title: string;
    companyName: string;
    postingDate?: string;
    requirements?: string;
    experienceRequired?: number;
    salaryLpa?: number;
    location?: string;
  }): Promise<Job> => {
    const backendData = {
      title: data.title,
      company_name: data.companyName,
      posting_date: data.postingDate,
      requirements: data.requirements,
      experience_required: data.experienceRequired,
      salary_lpa: data.salaryLpa,
      location: data.location,
    };
    const response = await fetchWithAuth<BackendJob>('/jobs', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
    return transformJob(response);
  },

  update: async (
    id: string,
    data: {
      title?: string;
      companyName?: string;
      postingDate?: string;
      requirements?: string;
      experienceRequired?: number;
      salaryLpa?: number;
      location?: string;
    }
  ): Promise<Job> => {
    const backendData: Record<string, unknown> = {};
    if (data.title !== undefined) backendData.title = data.title;
    if (data.companyName !== undefined) backendData.company_name = data.companyName;
    if (data.postingDate !== undefined) backendData.posting_date = data.postingDate;
    if (data.requirements !== undefined) backendData.requirements = data.requirements;
    if (data.experienceRequired !== undefined) backendData.experience_required = data.experienceRequired;
    if (data.salaryLpa !== undefined) backendData.salary_lpa = data.salaryLpa;
    if (data.location !== undefined) backendData.location = data.location;

    const response = await fetchWithAuth<BackendJob>(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(backendData),
    });
    return transformJob(response);
  },

  delete: async (id: string): Promise<void> => {
    await fetchWithAuth<void>(`/jobs/${id}`, { method: 'DELETE' });
  },
};

// Email Ingestion & Resume Parsing
export const emailApi = {
  ingest: async (data: EmailIngestionRequest): Promise<IngestionResponse> => {
    return fetchWithAuth<IngestionResponse>('/email/ingest', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getJobs: async (status?: string, page = 1, pageSize = 25): Promise<PaginatedResponse<ResumeJob>> => {
    const params = new URLSearchParams({
      skip: String((page - 1) * pageSize),
      limit: String(pageSize),
    });
    if (status) params.set('status', status);

    const response = await fetchWithAuth<ResumeJob[]>(`/email/jobs?${params}`);
    return transformPaginatedResponse(response, (job) => job, page, pageSize);
  },

  getJob: async (id: string): Promise<ResumeJob> => {
    return fetchWithAuth<ResumeJob>(`/email/jobs/${id}`);
  },

  parseJob: async (id: string): Promise<ParseJobResponse> => {
    return fetchWithAuth<ParseJobResponse>(`/email/jobs/${id}/parse`, {
      method: 'POST',
    });
  },

  retryJob: async (id: string): Promise<ResumeJob> => {
    return fetchWithAuth<ResumeJob>(`/email/jobs/${id}/retry`, {
      method: 'POST',
    });
  }
};

// Clients API
interface BackendClient {
  id: string;
  name: string;
  email_domain?: string | null;
  created_at: string;
  updated_at: string;
}

interface BackendClientProvisionResponse extends BackendClient {
  credentials_generated?: boolean;
  admin_email?: string | null;
  admin_password?: string | null;
  portal_login_url?: string | null;
}

function toFrontendClient(backend: BackendClient): Client {
  return {
    id: backend.id,
    name: backend.name,
    industry: 'General',
    contactEmail: backend.email_domain ? `admin@${backend.email_domain}` : '',
    contactName: `${backend.name} Admin`,
    isActive: true,
    isRegistered: false,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

export const clientsApi = {
  list: async (): Promise<Client[]> => {
    try {
      const response = await fetchWithAuth<BackendClient[]>('/clients');
      if (!Array.isArray(response)) {
        return [];
      }
      return response.map(toFrontendClient);
    } catch {
      // Fallback to empty array if endpoint doesn't exist
      console.warn('Clients endpoint not available, using empty list');
      return [];
    }
  },
  get: async (id: string): Promise<Client> => {
    const response = await fetchWithAuth<BackendClient>(`/clients/${id}`);
    return toFrontendClient(response);
  },
  create: async (
    data: Partial<Client>
  ): Promise<Client & { provisionedCredentials?: { email: string; password: string; loginUrl: string } }> => {
    const emailDomain = data.contactEmail?.includes('@')
      ? data.contactEmail.split('@')[1]
      : undefined;
    const response = await fetchWithAuth<BackendClientProvisionResponse>('/clients', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        email_domain: emailDomain,
      }),
    });
    const frontend = toFrontendClient(response);
    if (response.credentials_generated && response.admin_email && response.admin_password) {
      return {
        ...frontend,
        provisionedCredentials: {
          email: response.admin_email,
          password: response.admin_password,
          loginUrl: response.portal_login_url || 'http://localhost:8080/login',
        },
      };
    }
    return frontend;
  },
  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    const emailDomain = data.contactEmail?.includes('@')
      ? data.contactEmail.split('@')[1]
      : undefined;
    const response = await fetchWithAuth<BackendClient>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: data.name,
        email_domain: emailDomain,
      }),
    });
    return toFrontendClient(response);
  },
  delete: async (id: string): Promise<void> => {
    await fetchWithAuth<void>(`/clients/${id}`, {
      method: 'DELETE',
    });
  },
  sendInvite: async (id: string): Promise<{ token: string; link: string }> => {
    return fetchWithAuth<{ token: string; link: string }>(`/clients/${id}/invite`, {
      method: 'POST',
    });
  },
};

// Monitoring / Infrastructure
export const monitoringApi = {
  getDatabaseSource: () => fetchWithAuth<{
    engine: string;
    host: string | null;
    port: number | null;
    database: string | null;
    connected: boolean;
    timestamp: string;
  }>('/monitoring/database/source'),
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
