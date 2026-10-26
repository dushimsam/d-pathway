'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { DeadlineChip } from '@/components/ui/DeadlineChip';
import { PrizeBadge } from '@/components/ui/PrizeBadge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { api } from '@/lib/api-client';
import type { CompanyDashboard } from '@/lib/types';

type NumericSummaryKey =
  | 'pendingApplications'
  | 'deliverablesAwaitingEvaluation'
  | 'invitationsIssued';

const STAT_CARDS: Array<{ key: NumericSummaryKey; label: string }> = [
  { key: 'pendingApplications', label: 'Applications to review' },
  { key: 'deliverablesAwaitingEvaluation', label: 'Deliverables to evaluate' },
  { key: 'invitationsIssued', label: 'Interview invitations issued' },
];

export default function CompanyHomePage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'company'],
    queryFn: () => api.get<CompanyDashboard>('/dashboards/company'),
  });

  const closeProject = useMutation({
    mutationFn: (id: string) => api.post(`/projects/${id}/close`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'company'] }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (isError || !data) {
    return <ErrorState message="Could not load your projects." onRetry={() => refetch()} />;
  }

  return (
    <div>
      <PageHeader
        title="Your projects"
        description="Post projects, review applicants, and evaluate deliverables."
        action={
          <Link href="/projects/new">
            <Button size="sm">New project</Button>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        {STAT_CARDS.map((c) => (
          <Card key={c.key} className="text-center">
            <p className="text-[24px] font-semibold text-n900">
              {data.summary[c.key]}
            </p>
            <p className="mt-1 text-[12px] uppercase tracking-wide text-n500">
              {c.label}
            </p>
          </Card>
        ))}
      </div>

      {data.awaitingEvaluation.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 text-[16px] font-semibold text-n900">
            Deliverables awaiting evaluation
          </h2>
          <div className="flex flex-col divide-y divide-n100">
            {data.awaitingEvaluation.map((d) => (
              <div
                key={d.deliverableId}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-[14px] font-medium text-n900">
                    {d.graduateName}
                  </p>
                  <p className="text-[12px] text-n500">{d.projectTitle}</p>
                </div>
                <Link href={`/deliverables/${d.deliverableId}/evaluate`}>
                  <Button size="sm">Evaluate</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      <h2 className="mb-3 text-[16px] font-semibold text-n900">All projects</h2>
      {data.projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start receiving applicants."
          action={
            <Link href="/projects/new">
              <Button size="sm">New project</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.projects.map((p) => (
            <Card key={p.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[18px] font-semibold text-n900">
                    {p.title}
                  </p>
                  <StatusPill status={p.status} />
                  {p.prizeAmount != null && (
                    <PrizeBadge amount={p.prizeAmount} currency={p.prizeCurrency} size="sm" />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-n500">
                  <DeadlineChip iso={p.applicationDeadline} label="Apply by" />
                  <span>
                    {p.applicationCounts.PENDING ?? 0} pending ·{' '}
                    {p.applicationCounts.ACCEPTED ?? 0} accepted ·{' '}
                    {p.applicationCounts.DECLINED ?? 0} declined
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {p.status !== 'DRAFT' && (
                  <Link href={`/projects/${p.id}/applications`}>
                    <Button variant="secondary" size="sm">
                      Review queue
                    </Button>
                  </Link>
                )}
                {p.status === 'DRAFT' && (
                  <Link href={`/projects/new?id=${p.id}`}>
                    <Button variant="secondary" size="sm">
                      Edit draft
                    </Button>
                  </Link>
                )}
                {p.status === 'IN_PROGRESS' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={closeProject.isPending}
                    onClick={() => closeProject.mutate(p.id)}
                  >
                    Close
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
