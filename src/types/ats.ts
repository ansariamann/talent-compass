// Core domain types for the ATS system

export type CandidateStatus =
  | "new"
  | "screening"
  | "submitted"
  | "interview_scheduled"
  | "interviewed"
  | "offered"
  | "selected"
  | "hired"
  | "rejected"
  | "withdrawn"
  | "on_hold";

export type ApplicationStatus =
  | "pending"
  | "in_review"
  | "shortlisted"
  | "interview"
  | "offer"
  | "accepted"
  | "declined"
  | "rejected";

export type UserRole =
  | "hr_admin"
  | "hr_recruiter"
  | "client_admin"
  | "client_user";

export interface User {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  role: UserRole;
  client_id?: string;
  tenantId: string;
  avatarUrl?: string;
  createdAt: string;
  client_name?: string;
}

export interface Candidate {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  presentAddress?: string;
  permanentAddress?: string;
  dateOfBirth?: string;
  previousEmployment?: Array<Record<string, unknown>>;
  keySkill?: string;
  resumeFilePath?: string;
  assignedUserId?: string;
  skills: string[];
  experience: number; // years
  totalExperienceYears?: number;
  noticePeriodDays?: number;
  source?: string;
  linkedinUrl?: string;
  client?: string;
  currentStatus: CandidateStatus;
  resumeUrl?: string;
  resumeParsed?: ResumeData;
  isDuplicate?: boolean; // Marked as duplicate (client-side enrichment)
  duplicateOf?: string; // Primary candidate id if this is a duplicate
  potentialDuplicates?: string[]; // Candidate ids that might be duplicates
  isBlacklisted: boolean;
  isLeaver: boolean;
  remark?: string;
  ctcCurrent?: number;
  ctcExpected?: number;
  isDirectInterview?: boolean;
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

export interface Client {
  id: string;
  name: string;
  industry?: string;
  contactEmail?: string;
  contactName?: string;
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
  type: "phone" | "video" | "onsite";
  interviewers: string[];
  notes?: string;
  feedback?: InterviewFeedback;
}

export interface InterviewFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  strengths: string[];
  concerns: string[];
  recommendation: "hire" | "no_hire" | "further_review";
  comments: string;
}

export type TimelineEventType = "state_change" | "interview_round" | "feedback";

export interface WorkflowInterviewDetails {
  roundNumber: number;
  mode: "in_person" | "video" | "phone";
  interviewerName?: string;
  scheduledDate?: string;
}

export interface WorkflowFeedbackDetails {
  roundNumber: number;
  rating: 1 | 2 | 3 | 4 | 5;
  recommendation: "strong_yes" | "yes" | "neutral" | "no" | "strong_no";
}

export interface ApplicationTimeline {
  id: string;
  candidateId: string;
  eventType: TimelineEventType;
  state?: CandidateStatus;
  timestamp: string;
  actor: "client" | "system" | "hr";
  note?: string;
  interviewDetails?: WorkflowInterviewDetails;
  feedbackDetails?: WorkflowFeedbackDetails;
}

export interface ScheduleInterviewPayload {
  candidateId: string;
  scheduledDate: string;
  mode: "in_person" | "video" | "phone";
  roundNumber: number;
  interviewerName?: string;
  notes?: string;
}

export interface InterviewFeedbackPayload {
  candidateId: string;
  roundNumber: number;
  rating: 1 | 2 | 3 | 4 | 5;
  recommendation: "strong_yes" | "yes" | "neutral" | "no" | "strong_no";
  feedback: string;
}

export type RejectReason =
  | "skill_mismatch"
  | "experience_insufficient"
  | "culture_fit"
  | "salary_expectation"
  | "other";

export interface RejectPayload {
  candidateId: string;
  reason: RejectReason;
  feedback: string;
}

export type LeftReason =
  | "resigned"
  | "terminated"
  | "contract_ended"
  | "other";

export interface LeftCompanyPayload {
  candidateId: string;
  reason: LeftReason;
  feedback: string;
  lastWorkingDate?: string;
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  companyName: string;
  postingDate: string;
  requirements?: string;
  experienceRequired?: number;
  salaryLpa?: number;
  location?: string;
  submittedByClient?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Filter types
export interface CandidateFilters {
  search?: string;
  skills?: string[];
  location?: string;
  status?: CandidateStatus[];
  isDirectInterview?: boolean;
  clientId?: string;
  minExperience?: number;
  maxExperience?: number;
  minCtcCurrent?: number;
  maxCtcCurrent?: number;
  minCtcExpected?: number;
  maxCtcExpected?: number;
  dateFrom?: string;
  dateTo?: string;
  excludeBlacklisted?: boolean;
  excludeLeavers?: boolean;
}

export interface DirectInterviewStats {
  pending: number;
  interviewed: number;
  selected: number;
}

export interface DirectInterviewRecord {
  id: string;
  candidateId: string;
  clientId: string;
  companyId: string;
  interviewerId: string;
  interviewDate: string;
  position?: string;
  skills?: string[];
  notes?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobInput {
  clientId: string;
  title: string;
  companyName: string;
  postingDate?: string;
  requirements?: string;
  experienceRequired?: number;
  salaryLpa?: number;
  location?: string;
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

export interface JobFilters {
  search?: string;
  companyName?: string;
  jobTitle?: string;
  field?: string;
  location?: string;
  minExperience?: number;
  maxExperience?: number;
  minSalaryLpa?: number;
  maxSalaryLpa?: number;
  sort?:
    | "newest"
    | "salary_desc"
    | "salary_asc"
    | "exp_desc"
    | "exp_asc"
    | "location_asc"
    | "company_asc";
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
  type:
    | "candidate_updated"
    | "application_updated"
    | "status_changed"
    | "new_application";
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

// Email Ingestion & Resume Parsing
export type ResumeJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ResumeJob {
  id: string;
  client_id: string;
  candidate_id?: string;
  email_message_id?: string;
  file_name?: string;
  file_path?: string;
  status: ResumeJobStatus;
  resume_text?: string;
  resume_file_path?: string;
  parsed_data?: Record<string, unknown>;
  error_message?: string;
  attempts?: number;
  processed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface EmailAttachment {
  filename: string;
  content_type: string;
  content_base64: string;
  size: number;
}

export interface EmailIngestionRequest {
  client_id: string;
  email: {
    message_id: string;
    sender: string;
    subject: string;
    body: string;
    received_at: string;
    attachments: EmailAttachment[];
  };
}

export interface IngestionResponse {
  success: boolean;
  message: string;
  job_ids: string[];
}

export interface ParseJobResponse {
  success: boolean;
  data?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    skills?: string[];
    experience_years?: number;
    raw_text_summary?: string;
    [key: string]: unknown;
  };
}
