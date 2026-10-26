import { differenceInHours, format } from 'date-fns';
import { Badge, type BadgeVariant } from './Badge';

/**
 * Shows an absolute date (Africa/Kigali is UTC+2, no DST — we render the local
 * machine's formatting of the UTC instant) plus "x days left"; warning tint
 * under 48h, danger once passed.
 */
export function DeadlineChip({ iso, label }: { iso: string; label?: string }) {
  const date = new Date(iso);
  const hoursLeft = differenceInHours(date, new Date());
  const dayLabel =
    hoursLeft < 0
      ? 'passed'
      : hoursLeft < 24
        ? `${hoursLeft}h left`
        : `${Math.floor(hoursLeft / 24)} days left`;

  const variant: BadgeVariant =
    hoursLeft < 0 ? 'danger' : hoursLeft < 48 ? 'warning' : 'neutral';

  return (
    <Badge variant={variant}>
      {label ? `${label}: ` : ''}
      {format(date, 'd MMM yyyy')} · {dayLabel}
    </Badge>
  );
}
