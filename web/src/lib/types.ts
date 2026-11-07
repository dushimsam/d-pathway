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
  photoUrl: string | null;
  photoPublicId: string | null;
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string | null;
  description: string | null;
  representativeTitle: string | null;
  logoUrl: string | null;
  logoPublicId: string | null;
  website: string | null;
  location: string | null;
  size: string | null;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface CompanyReview {
  id: string;
  rating: number;
  comment: string | null;
  graduateName: string;
  projectTitle: string;
  createdAt: string;
}

export interface CompanyReviews {
  summary: RatingSummary;
  items: CompanyReview[];
}

export interface PublicCompany {
  id: string;
  name: string;
  industry: string | null;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  location: string | null;
  size: string | null;
  rating: RatingSummary;
  openProjects: Array<{
    id: string;
    title: string;
    requiredSkills: string[];
    prizeAmount: number | null;
    prizeCurrency: string | null;
    applicationDeadline: string;
    coverImageUrl: string | null;
  }>;
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
  prizeStatus: 'HELD' | 'RELEASED' | 'REFUNDED' | null;
  winnerGraduateId: string | null;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
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

export interface TalentStats {
  briefsCompleted: number;
  avgScore: number;
  interviewsSelected: number;
  prizesWon: number;
  prizeTotal: number;
}

export interface TalentListItem {
  id: string;
  fullName: string;
  education: string | null;
  location: string | null;
  skills: string[];
  photoUrl: string | null;
  stats: TalentStats;
}

export interface StudentProfile {
  id: string;
  fullName: string;
  education: string | null;
  location: string | null;
  skills: string[];
  links: string[];
  photoUrl: string | null;
  stats: TalentStats;
  history: Array<{
    projectId: string;
    projectTitle: string;
    companyId: string;
    companyName: string;
    score: number;
    outcome: EvaluationOutcome;
    evaluatedAt: string;
  }>;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type MembershipStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED';
export type WalletTxnType = 'TOPUP' | 'HOLD' | 'REFUND' | 'PAYOUT' | 'WITHDRAWAL';

export interface WalletTransaction {
  id: string;
  type: WalletTxnType;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface CompanyWallet {
  role: 'COMPANY';
  currency: string;
  balance: number;
  reserved: number;
  transactions: WalletTransaction[];
}

export interface GraduateWallet {
  role: 'GRADUATE';
  currency: string;
  balance: number;
  transactions: WalletTransaction[];
}

export type Wallet = CompanyWallet | GraduateWallet;
export type TeamRole = 'LEAD' | 'MEMBER';
export type ActivityType = 'DELIVERABLE_SUBMITTED' | 'EVALUATION_RECORDED';

export interface EvaluationSummary {
  score: number;
  outcome: EvaluationOutcome;
  feedback: string;
  evaluatedAt: string;
  stale?: boolean;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  projectId: string | null;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  graduateId: string;
  fullName: string;
  status: MembershipStatus;
  invitedAt: string;
  respondedAt: string | null;
}

export interface Team {
  lead: { graduateId: string; fullName: string };
  members: TeamMember[];
}

export interface MyInvitation {
  id: string;
  invitedAt: string;
  application: {
    id: string;
    status: ApplicationStatus;
    leadName: string;
    project: { id: string; title: string; company: { name: string } };
  };
}

export interface MyApplication {
  id: string;
  status: ApplicationStatus;
  role?: TeamRole;
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
    coverImageUrl: string | null;
    company: { id: string; name: string };
  };
  deliverable: { id: string; submittedAt: string; version?: number } | null;
  evaluation: EvaluationSummary | null;
}

export type BoardStage =
  | 'applied'
  | 'accepted'
  | 'submitted'
  | 'evaluated'
  | 'awarded'
  | 'declined';

export interface BoardCandidate {
  id: string;
  stage: BoardStage;
  status: ApplicationStatus;
  note: string | null;
  declineReason: string | null;
  createdAt: string;
  isWinner: boolean;
  graduate: {
    id: string;
    fullName: string;
    education: string | null;
    skills: string[];
    location: string | null;
  };
  deliverable: { id: string; submittedAt: string; version?: number } | null;
  evaluation: { score: number; outcome: EvaluationOutcome; stale?: boolean } | null;
}

export interface ProjectBoard {
  project: {
    id: string;
    title: string;
    status: ProjectStatus;
    prizeStatus: 'HELD' | 'RELEASED' | 'REFUNDED' | null;
    prizeAmount: number | null;
    prizeCurrency: string | null;
    winnerGraduateId: string | null;
    submissionDeadline: string;
  };
  candidates: BoardCandidate[];
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
  version?: number;
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
  evaluatedVersion?: number;
  stale?: boolean;
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
