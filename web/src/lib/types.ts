export type PathwayStatus = 'DRAFT' | 'PUBLISHED';

// Mirrors the API's PathwayResponseDto.
export interface Pathway {
  id: string;
  title: string;
  companyName: string;
  description: string | null;
  eligibilityCriteria: string;
  intakeQuota: number;
  deadlineMonths: number;
  status: PathwayStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
