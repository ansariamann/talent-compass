// Mock data for development - remove when connecting to real backend

import type {
  Candidate,
  Application,
  Client,
  User,
  PaginatedResponse,
} from '@/types/ats';

export const mockUser: User = {
  id: 'usr_001',
  email: 'sarah.chen@acme-hr.com',
  name: 'Sarah Chen',
  role: 'hr_admin',
  tenantId: 'tenant_001',
  avatarUrl: undefined,
  createdAt: '2024-01-15T08:00:00Z',
};

export const mockClients: Client[] = [
  {
    id: 'client_001',
    name: 'TechCorp Global',
    industry: 'Technology',
    contactEmail: 'hr@techcorp.com',
    contactName: 'John Smith',
    isActive: true,
    isRegistered: true,
    registeredAt: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'client_002',
    name: 'FinanceFirst Ltd',
    industry: 'Financial Services',
    contactEmail: 'talent@financefirst.com',
    contactName: 'Emma Wilson',
    isActive: true,
    isRegistered: false,
    registrationToken: 'reg_abc123',
    registrationSentAt: '2024-02-20T00:00:00Z',
    createdAt: '2024-02-15T00:00:00Z',
  },
  {
    id: 'client_003',
    name: 'HealthPlus Systems',
    industry: 'Healthcare',
    contactEmail: 'recruitment@healthplus.io',
    contactName: 'Michael Brown',
    isActive: true,
    isRegistered: false,
    createdAt: '2024-03-01T00:00:00Z',
  },
];

export const mockCandidates: Candidate[] = [
  {
    id: 'cand_001',
    name: 'Alex Johnson',
    email: 'alex.j@email.com',
    phone: '+1 555-0101',
    skills: ['Python', 'React', 'PostgreSQL', 'AWS'],
    experience: 5,
    currentStatus: 'screening',
    resumeUrl: '/resumes/alex-johnson.pdf',
    resumeParsed: {
      summary: 'Full-stack developer with 5 years of experience in building scalable web applications.',
      education: [
        { institution: 'MIT', degree: 'BS', field: 'Computer Science', year: 2019 },
      ],
      workHistory: [
        {
          company: 'StartupXYZ',
          title: 'Senior Developer',
          startDate: '2021-03-01',
          description: 'Led development of customer-facing platform.',
        },
        {
          company: 'TechCo',
          title: 'Software Engineer',
          startDate: '2019-06-01',
          endDate: '2021-02-28',
          description: 'Developed microservices architecture.',
        },
      ],
      certifications: ['AWS Solutions Architect'],
      languages: ['English', 'Spanish'],
    },
    flags: [
      { type: 'verified', reason: 'References checked', createdAt: '2024-12-20T10:00:00Z', createdBy: 'usr_001' },
    ],
    isBlacklisted: false,
    isLeaver: false,
    createdAt: '2024-12-18T09:00:00Z',
    updatedAt: '2024-12-28T14:30:00Z',
  },
  {
    id: 'cand_002',
    name: 'Maria Garcia',
    email: 'maria.g@email.com',
    phone: '+1 555-0102',
    skills: ['Java', 'Spring Boot', 'Kubernetes', 'MongoDB'],
    experience: 8,
    currentStatus: 'submitted',
    resumeUrl: '/resumes/maria-garcia.pdf',
    resumeParsed: {
      summary: 'Backend engineer specializing in distributed systems and cloud infrastructure.',
      education: [
        { institution: 'Stanford', degree: 'MS', field: 'Computer Science', year: 2016 },
      ],
      workHistory: [
        {
          company: 'BigTech Inc',
          title: 'Staff Engineer',
          startDate: '2020-01-01',
          description: 'Architected platform serving 10M+ users.',
        },
      ],
      certifications: ['GCP Professional', 'Kubernetes Administrator'],
      languages: ['English', 'Portuguese'],
    },
    flags: [
      { type: 'priority', reason: 'Highly qualified for TechCorp role', createdAt: '2024-12-22T11:00:00Z', createdBy: 'usr_001' },
    ],
    isBlacklisted: false,
    isLeaver: false,
    createdAt: '2024-12-15T11:00:00Z',
    updatedAt: '2024-12-27T09:15:00Z',
  },
  {
    id: 'cand_003',
    name: 'James Wilson',
    email: 'james.w@email.com',
    phone: '+1 555-0103',
    skills: ['JavaScript', 'Node.js', 'Vue.js', 'MySQL'],
    experience: 3,
    currentStatus: 'interview_scheduled',
    flags: [],
    isBlacklisted: false,
    isLeaver: false,
    createdAt: '2024-12-20T14:00:00Z',
    updatedAt: '2024-12-26T16:45:00Z',
  },
  {
    id: 'cand_004',
    name: 'Emily Chen',
    email: 'emily.c@email.com',
    phone: '+1 555-0104',
    skills: ['Data Science', 'Python', 'TensorFlow', 'SQL'],
    experience: 4,
    currentStatus: 'interviewed',
    flags: [
      { type: 'duplicate', reason: 'Possible duplicate with cand_012', createdAt: '2024-12-23T08:00:00Z', createdBy: 'system' },
    ],
    isBlacklisted: false,
    isLeaver: false,
    createdAt: '2024-12-10T08:30:00Z',
    updatedAt: '2024-12-25T10:00:00Z',
  },
  {
    id: 'cand_005',
    name: 'Robert Martinez',
    email: 'robert.m@email.com',
    skills: ['DevOps', 'Terraform', 'Docker', 'CI/CD'],
    experience: 6,
    currentStatus: 'offered',
    flags: [],
    isBlacklisted: false,
    isLeaver: false,
    createdAt: '2024-12-05T13:00:00Z',
    updatedAt: '2024-12-24T11:30:00Z',
  },
  {
    id: 'cand_006',
    name: 'Sarah Kim',
    email: 'sarah.k@email.com',
    skills: ['Product Management', 'Agile', 'Jira', 'Analytics'],
    experience: 7,
    currentStatus: 'new',
    flags: [],
    isBlacklisted: false,
    isLeaver: false,
    createdAt: '2024-12-28T09:00:00Z',
    updatedAt: '2024-12-28T09:00:00Z',
  },
  {
    id: 'cand_007',
    name: 'David Lee',
    email: 'david.l@email.com',
    skills: ['iOS', 'Swift', 'Objective-C', 'Xcode'],
    experience: 5,
    currentStatus: 'rejected',
    flags: [],
    isBlacklisted: false,
    isLeaver: false,
    createdAt: '2024-11-20T10:00:00Z',
    updatedAt: '2024-12-15T14:00:00Z',
  },
  {
    id: 'cand_008',
    name: 'Jennifer Brown',
    email: 'jennifer.b@email.com',
    skills: ['UX Design', 'Figma', 'Research', 'Prototyping'],
    experience: 4,
    currentStatus: 'screening',
    flags: [
      { type: 'incomplete', reason: 'Missing portfolio link', createdAt: '2024-12-26T09:00:00Z', createdBy: 'usr_001' },
    ],
    isBlacklisted: false,
    isLeaver: false,
    createdAt: '2024-12-22T11:00:00Z',
    updatedAt: '2024-12-26T09:00:00Z',
  },
];

export const mockApplications: Application[] = [
  {
    id: 'app_001',
    candidateId: 'cand_002',
    candidate: mockCandidates[1],
    clientId: 'client_001',
    client: mockClients[0],
    jobTitle: 'Senior Backend Engineer',
    status: 'shortlisted',
    submittedAt: '2024-12-20T10:00:00Z',
    lastActivityAt: '2024-12-28T14:00:00Z',
    notes: [
      {
        id: 'note_001',
        content: 'Strong technical background, excellent fit for the role.',
        createdBy: 'usr_001',
        createdByName: 'Sarah Chen',
        createdAt: '2024-12-21T09:00:00Z',
        isInternal: true,
      },
    ],
    auditLog: [
      {
        id: 'audit_001',
        action: 'status_change',
        fromStatus: 'pending',
        toStatus: 'in_review',
        performedBy: 'usr_001',
        performedByName: 'Sarah Chen',
        timestamp: '2024-12-20T11:00:00Z',
      },
      {
        id: 'audit_002',
        action: 'status_change',
        fromStatus: 'in_review',
        toStatus: 'shortlisted',
        performedBy: 'usr_001',
        performedByName: 'Sarah Chen',
        timestamp: '2024-12-22T14:00:00Z',
      },
    ],
  },
  {
    id: 'app_002',
    candidateId: 'cand_003',
    candidate: mockCandidates[2],
    clientId: 'client_002',
    client: mockClients[1],
    jobTitle: 'Full Stack Developer',
    status: 'interview',
    submittedAt: '2024-12-22T09:00:00Z',
    lastActivityAt: '2024-12-27T16:00:00Z',
    notes: [],
    auditLog: [
      {
        id: 'audit_003',
        action: 'status_change',
        fromStatus: 'pending',
        toStatus: 'interview',
        performedBy: 'client_usr_001',
        performedByName: 'Emma Wilson',
        timestamp: '2024-12-25T10:00:00Z',
      },
    ],
  },
  {
    id: 'app_003',
    candidateId: 'cand_005',
    candidate: mockCandidates[4],
    clientId: 'client_003',
    client: mockClients[2],
    jobTitle: 'DevOps Lead',
    status: 'offer',
    submittedAt: '2024-12-10T08:00:00Z',
    lastActivityAt: '2024-12-24T11:30:00Z',
    notes: [
      {
        id: 'note_002',
        content: 'Candidate accepted verbal offer, awaiting formal paperwork.',
        createdBy: 'usr_001',
        createdByName: 'Sarah Chen',
        createdAt: '2024-12-24T11:30:00Z',
        isInternal: false,
      },
    ],
    auditLog: [
      {
        id: 'audit_004',
        action: 'status_change',
        fromStatus: 'interview',
        toStatus: 'offer',
        performedBy: 'client_usr_002',
        performedByName: 'Michael Brown',
        timestamp: '2024-12-23T15:00:00Z',
      },
    ],
  },
];

// Mock API functions
export function getMockCandidates(
  page = 1,
  pageSize = 25
): PaginatedResponse<Candidate> {
  const filtered = mockCandidates.filter(c => !c.isBlacklisted && !c.isLeaver);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    data: filtered.slice(start, end),
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
  };
}

export function getMockApplications(
  page = 1,
  pageSize = 25
): PaginatedResponse<Application> {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    data: mockApplications.slice(start, end),
    total: mockApplications.length,
    page,
    pageSize,
    totalPages: Math.ceil(mockApplications.length / pageSize),
  };
}
