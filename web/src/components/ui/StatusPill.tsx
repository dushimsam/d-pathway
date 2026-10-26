import { Badge, type BadgeVariant } from './Badge';

// Maps project / application / evaluation statuses to a Badge variant and label.
const MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  // Project
  DRAFT: { variant: 'neutral', label: 'Draft' },
  OPEN: { variant: 'success', label: 'Open' },
  IN_PROGRESS: { variant: 'info', label: 'In progress' },
  CLOSED: { variant: 'neutral', label: 'Closed' },
  // Application
  PENDING: { variant: 'warning', label: 'Pending' },
  ACCEPTED: { variant: 'success', label: 'Accepted' },
  DECLINED: { variant: 'danger', label: 'Declined' },
  // Evaluation outcome
  SELECTED_FOR_INTERVIEW: { variant: 'success', label: 'Selected for interview' },
  NOT_SELECTED: { variant: 'danger', label: 'Not selected' },
};

export function StatusPill({ status }: { status: string }) {
  const entry = MAP[status] ?? { variant: 'neutral' as BadgeVariant, label: status };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
