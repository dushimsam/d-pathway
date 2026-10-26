// Types mirroring the D-Pathway API responses. Kept in step with the backend
// DTOs; the Zod schemas in schemas.ts mirror the write shapes field for field.

export type UserRole = 'GRADUATE' | 'COMPANY';
export type ProjectStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
export type DeliverableFormat = 'REPOSITORY_LINK' | 'FILE' | 'LINK';
export type EvaluationOutcome = 'SELECTED_FOR_INTERVIEW' | 'NOT_SELECTED';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface GraduateProfile {
  id: string;
  fullName: string;
  education: string | null;
  skills: string[];
  links: string[];
  location: string | null;
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string | null;
  description: string | null;
  representativeTitle: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  profile: GraduateProfile | CompanyProfile | null;
}

export interface Project {
  id: string;
  title: string;
  brief: string;
  requiredSkills: string[];
  applicationDeadline: string;
  submissionDeadline: string;
  deliverableFormat: DeliverableFormat;
  ipTerms: string;
  prizeAmount: number | null;
  prizeCurrency: string | null;
  status: ProjectStatus;
  publishedAt: string | null;
  companyId: string;
  company?: CompanyProfile;
}

export interface ProjectWithCounts extends Project {
  applicationCounts: Partial<Record<ApplicationStatus, number>>;
}

export interface CatalogueCompany {
  id: string;
  name: string;
  industry: string | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EvaluationSummary {
  score: number;
  outcome: EvaluationOutcome;
  feedback: string;
  evaluatedAt: string;
}

export interface MyApplication {
  id: string;
  status: ApplicationStatus;
  note: string | null;
  declineReason: string | null;
  termsAcceptedAt: string;
  decidedAt: string | null;
  createdAt: string;
  project: {
    id: string;
    title: string;
    status: ProjectStatus;
    submissionDeadline: string;
    deliverableFormat: DeliverableFormat;
    company: { id: string; name: string };
  };
  deliverable: { id: string; submittedAt: string } | null;
  evaluation: EvaluationSummary | null;
}

export interface QueueApplicant {
  id: string;
  status: ApplicationStatus;
  note: string | null;
  declineReason: string | null;
  termsAcceptedAt: string;
  decidedAt: string | null;
  createdAt: string;
  graduate: GraduateProfile;
}

export interface Deliverable {
  id: string;
  fileUrl: string | null;
  filePublicId: string | null;
  linkUrl: string | null;
  note: string;
  submittedAt: string;
  applicationId: string;
  application?: {
    id: string;
    project: Project;
    graduate: GraduateProfile;
  };
}

export interface Evaluation {
  id: string;
  score: number;
  feedback: string;
  outcome: EvaluationOutcome;
  evaluatedAt: string;
  deliverableId: string;
}

export interface GraduateDashboard {
  applicationsByStatus: Record<ApplicationStatus, number>;
  applications: MyApplication[];
  evaluations: Array<{
    projectTitle: string;
    companyName: string;
    score: number;
    outcome: EvaluationOutcome;
    feedback: string;
    evaluatedAt: string;
  }>;
  invitations: Array<{
    projectTitle: string;
    companyName: string;
    score: number;
    outcome: EvaluationOutcome;
    feedback: string;
    evaluatedAt: string;
  }>;
}

export interface CompanyDashboard {
  projects: ProjectWithCounts[];
  summary: {
    projectsByStatus: Record<ProjectStatus, number>;
    pendingApplications: number;
    deliverablesAwaitingEvaluation: number;
    invitationsIssued: number;
  };
  awaitingEvaluation: Array<{
    deliverableId: string;
    submittedAt: string;
    projectId: string;
    projectTitle: string;
    graduateName: string;
  }>;
}

export interface SignedUpload {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}
