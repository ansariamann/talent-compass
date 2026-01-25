// Core domain types for the ATS system

export type CandidateStatus = 
  | 'new'
  | 'screening'
  | 'submitted'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offered'
  | 'hired'
  | 'rejected'
  | 'withdrawn'
  | 'on_hold';

export type ApplicationStatus = 
  | 'pending'
  | 'in_review'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'declined'
  | 'rejected';

export type UserRole = 'hr_admin' | 'hr_recruiter' | 'client_admin' | 'client_user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  skills: string[];
  experience: number; // years
  currentStatus: CandidateStatus;
  resumeUrl?: string;
  resumeParsed?: ResumeData;
  flags: CandidateFlag[];
  isBlacklisted: boolean;
  isLeaver: boolean;
  remark?: string;
  ctcCurrent?: number;
  ctcExpected?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeData {
  summary?: string;
  education: Education[];
  workHistory: WorkExperience[];
  certifications: string[];
  languages: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: number;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface CandidateFlag {
  type: 'duplicate' | 'incomplete' | 'verified' | 'priority' | 'internal';
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  contactEmail: string;
  contactName: string;
  contactPhone?: string;
  address?: string;
  website?: string;
  isActive: boolean;
  isRegistered: boolean;
  registrationToken?: string;
  registrationSentAt?: string;
  registeredAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Application {
  id: string;
  candidateId: string;
  candidate?: Candidate;
  clientId: string;
  client?: Client;
  jobTitle: string;
  status: ApplicationStatus;
  submittedAt: string;
  lastActivityAt: string;
  notes: ApplicationNote[];
  auditLog: AuditEntry[];
  isFlagged?: boolean;
  flagReason?: string;
  isDeleted?: boolean;
}

export interface ApplicationNote {
  id: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  isInternal: boolean;
}

export interface AuditEntry {
  id: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Interview {
  id: string;
  applicationId: string;
  scheduledAt: string;
  duration: number; // minutes
  type: 'phone' | 'video' | 'onsite';
  interviewers: string[];
  notes?: string;
  feedback?: InterviewFeedback;
}

export interface InterviewFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  strengths: string[];
  concerns: string[];
  recommendation: 'hire' | 'no_hire' | 'further_review';
  comments: string;
}

// Filter types
export interface CandidateFilters {
  search?: string;
  skills?: string[];
  status?: CandidateStatus[];
  clientId?: string;
  minExperience?: number;
  maxExperience?: number;
  dateFrom?: string;
  dateTo?: string;
  excludeBlacklisted?: boolean;
  excludeLeavers?: boolean;
}

export interface ApplicationFilters {
  search?: string;
  status?: ApplicationStatus[];
  clientId?: string;
  candidateId?: string;
  dateFrom?: string;
  dateTo?: string;
  flaggedOnly?: boolean;
  includeDeleted?: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// SSE Event types
export interface SSEEvent {
  type: 'candidate_updated' | 'application_updated' | 'status_changed' | 'new_application';
  payload: unknown;
  timestamp: string;
}

// Copilot types
export interface CopilotQuery {
  query: string;
  context: {
    candidateId?: string;
    applicationId?: string;
  };
}

export interface CopilotResponse {
  response: string;
  sources: string[];
  confidence: number;
  generatedAt: string;
}
