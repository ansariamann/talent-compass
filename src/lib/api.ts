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
  JobInput,
  ApplicationTimeline,
  InterviewFeedbackPayload,
  LeftCompanyPayload,
  DirectInterviewStats,
  DirectInterviewRecord,
  RejectPayload,
  ScheduleInterviewPayload,
} from '@/types/ats';
import { getAuthToken, clearAuthToken } from '@/lib/authToken';

export interface ActivityLog {
  id: string;
  client_id?: string;
  user_id?: string;
  user_name?: string;
  action_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface ActivityLogFilters {
  startDate?: string;
  endDate?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

function normalizeApiDate(value?: string | null): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(trimmed)) {
    return `${trimmed.replace(' ', 'T')}Z`;
  }

  return trimmed;
}

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
  const token = getAuthToken();


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
    clearAuthToken();
    window.location.href = '/login';
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText || 'Request failed';

    if (errorText) {
      try {
        const parsed = JSON.parse(errorText) as {
          error?: { message?: string };
          detail?: string;
        };
        errorMessage = parsed.error?.message || parsed.detail || errorMessage;
      } catch {
        // Keep the raw text when the response is not JSON.
      }
    }

    throw new ApiError(response.status, errorMessage);
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
  company?: string | null;
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
  total_experience_years?: number | null;
  notice_period_days?: number | null;
  source?: string | null;
  linkedin_url?: string | null;
  selected_client_name?: string | null;
  resume_url?: string | null;
  resume_file_path?: string | null;
  assigned_user_id?: string | null;
  status: string;
  is_blacklisted?: boolean | null;
  is_direct_interview?: boolean | null;
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
    'LEFT_COMPANY': 'withdrawn',
    'INTERVIEW_SCHEDULED': 'interview_scheduled',
    'SELECTED': 'selected',
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
  const totalExperienceYears =
    backend.total_experience_years == null ? undefined : Number(backend.total_experience_years);
  const noticePeriodDays =
    backend.notice_period_days == null ? undefined : Number(backend.notice_period_days);

  return {
    id: backend.id,
    clientId: backend.client_id,
    name: backend.name,
    email: backend.email || '',
    phone: backend.phone || undefined,
    company: backend.company || undefined,
    location: backend.location || undefined,
    presentAddress: backend.present_address || undefined,
    permanentAddress: backend.permanent_address || undefined,
    dateOfBirth: backend.date_of_birth || undefined,
    previousEmployment: backend.previous_employment || undefined,
    keySkill: backend.key_skill || undefined,
    resumeFilePath: backend.resume_file_path || undefined,
    assignedUserId: backend.assigned_user_id || undefined,
    skills: Array.isArray(skills) ? skills : [],
    experience,
    totalExperienceYears,
    noticePeriodDays,
    source: backend.source || undefined,
    linkedinUrl: backend.linkedin_url || undefined,
    client: backend.selected_client_name || undefined,
    currentStatus: statusMap[backend.status] || 'new',
    resumeUrl,
    resumeParsed: undefined,
    isBlacklisted: Boolean(backend.is_blacklisted),
    isLeaver: backend.status === 'LEFT',
    remark: backend.remark || undefined,
    ctcCurrent,
    ctcExpected,
    isDirectInterview: Boolean(backend.is_direct_interview),
    createdAt: normalizeApiDate(backend.created_at) || backend.created_at,
    updatedAt: normalizeApiDate(backend.updated_at) || backend.updated_at,
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
    'selected': 'SELECTED',
    'hired': 'HIRED',
    'rejected': 'REJECTED',
    'withdrawn': 'LEFT',
    'on_hold': 'INACTIVE',
  };

  const result: Record<string, unknown> = {};

  if (frontend.name !== undefined) result.name = frontend.name;
  if (frontend.email !== undefined) result.email = frontend.email;
  if (frontend.phone !== undefined) result.phone = frontend.phone;
  if (frontend.company !== undefined) result.company = frontend.company;
  if (frontend.location !== undefined) result.location = frontend.location;
  if (frontend.presentAddress !== undefined) result.present_address = frontend.presentAddress;
  if (frontend.permanentAddress !== undefined) result.permanent_address = frontend.permanentAddress;
  if (frontend.dateOfBirth !== undefined) result.date_of_birth = frontend.dateOfBirth;
  if (frontend.previousEmployment !== undefined) result.previous_employment = frontend.previousEmployment;
  if (frontend.keySkill !== undefined) result.key_skill = frontend.keySkill;
  if (frontend.skills !== undefined) result.skills = { skills: frontend.skills };
  if (frontend.experience !== undefined) result.experience = { years: frontend.experience };
  if (frontend.totalExperienceYears !== undefined) result.total_experience_years = frontend.totalExperienceYears;
  if (frontend.noticePeriodDays !== undefined) result.notice_period_days = frontend.noticePeriodDays;
  if (frontend.source !== undefined) result.source = frontend.source;
  if (frontend.linkedinUrl !== undefined) result.linkedin_url = frontend.linkedinUrl;
  if (frontend.client !== undefined) result.selected_client_name = frontend.client;
  if (frontend.resumeFilePath !== undefined) result.resume_file_path = frontend.resumeFilePath;
  if (frontend.assignedUserId !== undefined) result.assigned_user_id = frontend.assignedUserId;
  if (frontend.currentStatus !== undefined) result.status = statusMap[frontend.currentStatus] || 'ACTIVE';
  if (frontend.isDirectInterview !== undefined) result.is_direct_interview = frontend.isDirectInterview;
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
  client_name?: string | null;
  job_title?: string | null;
  status: string;
  flagged_for_review?: boolean;
  is_flagged?: boolean;
  flag_reason?: string | null;
  is_deleted: boolean;
  notes?: string | null;
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
  vacant?: boolean;
  submitted_by_client?: boolean;
  created_at: string;
  updated_at: string;
}

interface BackendDirectInterviewRecord {
  id: string;
  candidate_id: string;
  client_id: string;
  company_id: string;
  interviewer_id: string;
  interview_date: string;
  position?: string | null;
  skills?: string[] | null;
  notes?: string | null;
  rating?: number | null;
  created_at: string;
  updated_at: string;
}

function transformApplication(backend: BackendApplication): Application {
  // Map backend status to frontend status
  const statusMap: Record<string, Application['status']> = {
    'NEW': 'pending',
    'RECEIVED': 'pending',
    'IN_REVIEW': 'in_review',
    'SCREENING': 'in_review',
    'SHORTLISTED': 'shortlisted',
    'INTERVIEW_SCHEDULED': 'shortlisted',
    'INTERVIEW': 'interview',
    'INTERVIEWED': 'interview',
    'OFFER': 'offer',
    'OFFER_MADE': 'offer',
    'ACCEPTED': 'accepted',
    'HIRED': 'accepted',
    'DECLINED': 'declined',
    'WITHDRAWN': 'declined',
    'REJECTED': 'rejected',
  };

  return {
    id: backend.id,
    candidateId: backend.candidate_id,
    clientId: backend.client_id,
    client: backend.client_name ? {
      id: backend.client_id,
      name: backend.client_name,
      isActive: true,
      isRegistered: false,
      createdAt: normalizeApiDate(backend.created_at) || backend.created_at,
    } as Client : undefined,
    jobTitle: backend.job_title || 'Unknown Position',
    status: statusMap[backend.status] || 'pending',
    submittedAt: normalizeApiDate(backend.created_at) || backend.created_at,
    lastActivityAt: normalizeApiDate(backend.updated_at) || backend.updated_at,
    notes: [],
    auditLog: [],
    isFlagged: backend.flagged_for_review ?? backend.is_flagged ?? false,
    flagReason: backend.flag_reason || undefined,
    isDeleted: backend.is_deleted,
  };
}

function transformJob(backend: BackendJob): Job {
  const salaryLpa = backend.salary_lpa == null ? undefined : Number(backend.salary_lpa);
  return {
    id: backend.id,
    clientId: backend.client_id,
    title: backend.title,
    companyName: backend.company_name,
    postingDate: backend.posting_date,
    requirements: backend.requirements || undefined,
    experienceRequired: backend.experience_required ?? undefined,
    salaryLpa,
    location: backend.location || undefined,
    vacant: backend.vacant ?? true,
    submittedByClient: backend.submitted_by_client ?? false,
    createdAt: normalizeApiDate(backend.created_at) || backend.created_at,
    updatedAt: normalizeApiDate(backend.updated_at) || backend.updated_at,
  };
}

function transformDirectInterviewRecord(backend: BackendDirectInterviewRecord): DirectInterviewRecord {
  return {
    id: backend.id,
    candidateId: backend.candidate_id,
    clientId: backend.client_id,
    companyId: backend.company_id,
    interviewerId: backend.interviewer_id,
    interviewDate: normalizeApiDate(backend.interview_date) || backend.interview_date,
    position: backend.position || undefined,
    skills: backend.skills || undefined,
    notes: backend.notes || undefined,
    rating: backend.rating ?? undefined,
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
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchWithAuth<{ status: string }>('/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      }),
    }),
};

// Candidates
export const candidatesApi = {
  list: async (filters: CandidateFilters = {}, page = 1, pageSize = 25): Promise<PaginatedResponse<Candidate>> => {
    const params = new URLSearchParams({
      skip: String((page - 1) * pageSize),
      limit: String(pageSize),
    });

    // Add filters
    const explicitSkills = (filters.skills || []).map((skill) => skill.trim()).filter(Boolean);
    const searchParts = (filters.search || '').split(',').map((part) => part.trim()).filter(Boolean);
    const multiSkillSearch = searchParts.length > 1;

    if (!multiSkillSearch && searchParts.length === 1) {
      params.set('name_pattern', searchParts[0]);
    }

    const mergedSkills = Array.from(
      new Set([...explicitSkills, ...(multiSkillSearch ? searchParts : [])])
    );
    if (mergedSkills.length) params.set('skills', mergedSkills.join(','));
    if (filters.location) params.set('location', filters.location);
    if (filters.isDirectInterview !== undefined) params.set('is_direct_interview', String(filters.isDirectInterview));
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
          'new': 'ACTIVE', 'selected': 'SELECTED', 'hired': 'HIRED', 'rejected': 'REJECTED',
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
      method: 'PUT',
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
    const params = new URLSearchParams({ limit: '50' });
    const parts = query.split(',').map((part) => part.trim()).filter(Boolean);
    if (parts.length > 1) {
      params.set('skills', parts.join(','));
    } else if (parts.length === 1) {
      params.set('name_pattern', parts[0]);
    }
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
  getTimeline: async (id: string): Promise<ApplicationTimeline[]> => {
    return fetchWithAuth<ApplicationTimeline[]>(`/candidates/${id}/timeline`);
  },
  scheduleInterview: async (payload: ScheduleInterviewPayload): Promise<Candidate> => {
    const { candidateId, mode, ...rest } = payload;
    const response = await fetchWithAuth<BackendCandidate>(`/candidates/${candidateId}/schedule-interview`, {
      method: 'POST',
      body: JSON.stringify({
        ...rest,
        interviewType: mode,
      }),
    });
    return transformCandidate(response);
  },
  submitFeedback: async (payload: InterviewFeedbackPayload): Promise<Candidate> => {
    const { candidateId, ...rest } = payload;
    const response = await fetchWithAuth<BackendCandidate>(`/candidates/${candidateId}/submit-feedback`, {
      method: 'POST',
      body: JSON.stringify(rest),
    });
    return transformCandidate(response);
  },
  selectForWorkflow: async (candidateId: string, notes?: string): Promise<Candidate> => {
    const response = await fetchWithAuth<BackendCandidate>(`/candidates/${candidateId}/select`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return transformCandidate(response);
  },
  rejectForWorkflow: async (payload: RejectPayload): Promise<Candidate> => {
    const response = await fetchWithAuth<BackendCandidate>(`/candidates/${payload.candidateId}/reject`, {
      method: 'POST',
      body: JSON.stringify({
        reason: payload.reason,
        feedback: payload.feedback,
      }),
    });
    return transformCandidate(response);
  },
  markLeftCompany: async (payload: LeftCompanyPayload): Promise<Candidate> => {
    const { candidateId, ...rest } = payload;
    const response = await fetchWithAuth<BackendCandidate>(`/candidates/${candidateId}/left-company`, {
      method: 'POST',
      body: JSON.stringify(rest),
    });
    return transformCandidate(response);
  },
  recordDirectInterview: async (
    candidateId: string,
    data: { interviewDate: string; companyId: string; position?: string; skills?: string[]; notes?: string; rating?: number }
  ): Promise<DirectInterviewRecord> => {
    const response = await fetchWithAuth<BackendDirectInterviewRecord>(`/candidates/${candidateId}/direct-interview`, {
      method: 'POST',
      body: JSON.stringify({
        interview_date: data.interviewDate,
        company_id: data.companyId,
        position: data.position,
        skills: data.skills,
        notes: data.notes,
        rating: data.rating,
      }),
    });
    return transformDirectInterviewRecord(response);
  },
  selectDirectCandidate: async (
    candidateId: string,
    data: { companyId: string; notes?: string }
  ): Promise<Candidate> => {
    const response = await fetchWithAuth<BackendCandidate>(`/candidates/${candidateId}/direct-select`, {
      method: 'POST',
      body: JSON.stringify({
        company_id: data.companyId,
        notes: data.notes,
      }),
    });
    return transformCandidate(response);
  },
  getInterviewHistory: async (candidateId: string): Promise<DirectInterviewRecord[]> => {
    const response = await fetchWithAuth<BackendDirectInterviewRecord[]>(`/candidates/${candidateId}/interview-history`);
    return response.map(transformDirectInterviewRecord);
  },
  updateInterviewRecord: async (
    candidateId: string,
    interviewId: string,
    data: { interviewDate?: string; companyId?: string; position?: string; skills?: string[]; notes?: string; rating?: number }
  ): Promise<DirectInterviewRecord> => {
    const response = await fetchWithAuth<BackendDirectInterviewRecord>(
      `/candidates/${candidateId}/interview-history/${interviewId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          interview_date: data.interviewDate,
          company_id: data.companyId,
          position: data.position,
          skills: data.skills,
          notes: data.notes,
          rating: data.rating,
        }),
      }
    );
    return transformDirectInterviewRecord(response);
  },
  deleteInterviewRecord: async (candidateId: string, interviewId: string): Promise<void> => {
    await fetchWithAuth<void>(`/candidates/${candidateId}/interview-history/${interviewId}`, {
      method: 'DELETE',
    });
  },
  getDirectInterviewStats: () =>
    fetchWithAuth<DirectInterviewStats>('/candidates/direct-interview/stats'),
};

// Applications
export const applicationsApi = {
  list: async (filters: ApplicationFilters = {}, page = 1, pageSize = 25): Promise<PaginatedResponse<Application>> => {
    const params = new URLSearchParams({
      skip: String((page - 1) * pageSize),
      limit: String(pageSize),
    });

    // Add filters
    if (filters.status?.length) {
      const statusMap: Record<string, string> = {
        pending: 'RECEIVED',
        in_review: 'SCREENING',
        shortlisted: 'INTERVIEW_SCHEDULED',
        interview: 'INTERVIEWED',
        offer: 'OFFER_MADE',
        accepted: 'HIRED',
        declined: 'WITHDRAWN',
        rejected: 'REJECTED',
      };
      params.set('application_status', statusMap[filters.status[0]] || filters.status[0]);
    }
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

  create: async (data: { candidateId: string; clientId: string; jobId?: string; jobTitle?: string }): Promise<Application> => {
    const backendData: Record<string, unknown> = {
      candidate_id: data.candidateId,
      client_id: data.clientId,
      job_title: data.jobTitle,
    };
    if (data.jobId) {
      backendData.job_id = data.jobId;
    }
    const response = await fetchWithAuth<BackendApplication>('/applications', {
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
        'interview': 'INTERVIEWED',
        'offer': 'OFFER_MADE',
        'accepted': 'HIRED',
        'declined': 'WITHDRAWN',
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
    const params = reason ? `?flag_reason=${encodeURIComponent(reason)}` : '';
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
      'pending': 'RECEIVED',
      'in_review': 'SCREENING',
      'shortlisted': 'INTERVIEW_SCHEDULED',
      'interview': 'INTERVIEWED',
      'offer': 'OFFER_MADE',
      'accepted': 'HIRED',
      'declined': 'WITHDRAWN',
      'rejected': 'REJECTED',
    };

    const params = new URLSearchParams({
      new_status: statusMap[status] || status,
    });
    if (note) params.set('note', note);

    const response = await fetchWithAuth<BackendApplication>(
      `/applications/${id}/status?${params}`,
      { method: 'PUT' }
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
      `/candidates/${candidateId}/applications`
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

    if (filters.clientId) params.set('client_id', filters.clientId);
    if (filters.search) params.set('search', filters.search);
    if (filters.companyName) params.set('company_name', filters.companyName);
    if (filters.jobTitle) params.set('job_title', filters.jobTitle);
    if (filters.field) params.set('field', filters.field);
    if (filters.location) params.set('location', filters.location);
    if (filters.includeFilled !== undefined) params.set('include_filled', String(filters.includeFilled));
    if (filters.minExperience !== undefined) params.set('min_experience', String(filters.minExperience));
    if (filters.maxExperience !== undefined) params.set('max_experience', String(filters.maxExperience));
    if (filters.minSalaryLpa !== undefined) params.set('min_salary_lpa', String(filters.minSalaryLpa));
    if (filters.maxSalaryLpa !== undefined) params.set('max_salary_lpa', String(filters.maxSalaryLpa));
    if (filters.sort) params.set('sort', filters.sort);

    const response = await fetchWithAuth<BackendJob[]>(`/jobs/?${params}`);
    return transformPaginatedResponse(response, transformJob, page, pageSize);
  },

  get: async (id: string): Promise<Job> => {
    const response = await fetchWithAuth<BackendJob>(`/jobs/${id}`);
    return transformJob(response);
  },

  create: async (data: JobInput): Promise<Job> => {
    const backendData = {
      client_id: data.clientId,
      title: data.title,
      company_name: data.companyName,
      posting_date: data.postingDate,
      requirements: data.requirements,
      experience_required: data.experienceRequired,
      salary_lpa: data.salaryLpa,
      location: data.location,
    };
    const response = await fetchWithAuth<BackendJob>('/jobs/', {
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

// Activity Logs API
export const activityLogsApi = {
  list: async (
    page = 1,
    pageSize = 100,
    filters: ActivityLogFilters = {}
  ): Promise<PaginatedResponse<ActivityLog>> => {
    const params = new URLSearchParams({
      skip: String((page - 1) * pageSize),
      limit: String(pageSize),
    });
    if (filters.startDate) params.set("start_date", filters.startDate);
    if (filters.endDate) params.set("end_date", filters.endDate);
    const response = await fetchWithAuth<ActivityLog[]>(`/activity-logs?${params}`);
    return transformPaginatedResponse(response, (log) => log, page, pageSize);
  },
  cleanup: async (): Promise<void> => {
    await fetchWithAuth<void>('/activity-logs/cleanup', { method: 'DELETE' });
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

  pollInbox: async (): Promise<{
    success: boolean;
    messages_seen: number;
    messages_ingested: number;
    attachments_processed: number;
    duplicate_messages: number;
    failures: number;
  }> => {
    return fetchWithAuth('/email/poll-imap', {
      method: 'POST',
    });
  },

  getJobs: async (status?: string, page = 1, pageSize = 25): Promise<PaginatedResponse<ResumeJob>> => {
    const params = new URLSearchParams({
      skip: String((page - 1) * pageSize),
      limit: String(pageSize),
    });
    if (status) params.set('status', status);

    const response = await fetchWithAuth<ResumeJob[]>(`/email/tasks?${params}`);
    return transformPaginatedResponse(response, (job) => job, page, pageSize);
  },

  getJob: async (id: string): Promise<ResumeJob> => {
    return fetchWithAuth<ResumeJob>(`/email/tasks/${id}`);
  },

  parseJob: async (id: string): Promise<ParseJobResponse> => {
    return fetchWithAuth<ParseJobResponse>(`/email/tasks/${id}/parse`, {
      method: 'POST',
    });
  },

  retryJob: async (id: string): Promise<{ success: boolean; message: string; job_id: string }> => {
    return fetchWithAuth<{ success: boolean; message: string; job_id: string }>(`/email/tasks/${id}/retry`, {
      method: 'POST',
    });
  },

  deleteJob: async (id: string): Promise<{ success: boolean; message: string; job_id: string }> => {
    return fetchWithAuth<{ success: boolean; message: string; job_id: string }>(`/email/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

// Clients API
interface BackendClient {
  id: string;
  name: string;
  industry?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  website?: string | null;
  email_domain?: string | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at: string;
}

interface BackendClientProvisionResponse extends BackendClient {
  credentials_generated?: boolean;
  credentials_emailed?: boolean;
  generated_email_path?: string | null;
  admin_email?: string | null;
  admin_password?: string | null;
  portal_login_url?: string | null;
}

function toFrontendClient(backend: BackendClient): Client {
  return {
    id: backend.id,
    name: backend.name,
    industry: backend.industry || undefined,
    contactEmail: backend.contact_email || undefined,
    contactName: backend.contact_name || undefined,
    contactPhone: backend.contact_phone || undefined,
    address: backend.address || undefined,
    website: backend.website || undefined,
    isActive: backend.is_active ?? true,
    isRegistered: false,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  };
}

export const clientsApi = {
  list: async (limit = 1000, skip = 0): Promise<Client[]> => {
    try {
      const params = new URLSearchParams({
        skip: String(skip),
        limit: String(limit),
      });
      const response = await fetchWithAuth<BackendClient[]>(`/clients/?${params}`);
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
  ): Promise<Client & { provisionedCredentials?: { email: string; password: string; loginUrl: string; emailed: boolean; generatedEmailPath?: string } }> => {
    const emailDomain = data.contactEmail?.includes('@')
      ? data.contactEmail.split('@')[1]
      : undefined;
    const response = await fetchWithAuth<BackendClientProvisionResponse>('/clients/', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        industry: data.industry,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        address: data.address,
        website: data.website,
        email_domain: emailDomain,
        is_active: data.isActive ?? true,
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
          emailed: response.credentials_emailed ?? false,
          generatedEmailPath: response.generated_email_path || undefined,
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
        industry: data.industry,
        contact_name: data.contactName,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        address: data.address,
        website: data.website,
        email_domain: emailDomain,
        is_active: data.isActive,
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
  const token = getAuthToken();
  const url = token
    ? `${API_BASE}/sse/events?token=${token}`
    : `${API_BASE}/sse/events`;

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
