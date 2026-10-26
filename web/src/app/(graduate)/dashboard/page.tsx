'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PartyPopper, Star } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { api } from '@/lib/api-client';
import type { GraduateDashboard } from '@/lib/types';

export default function GraduateDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'graduate'],
    queryFn: () => api.get<GraduateDashboard>('/dashboards/graduate'),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (isError || !data) {
    return <ErrorState message="Could not load your dashboard." onRetry={() => refetch()} />;
  }

  return (
    <div>
      <PageHeader
        title="Your dashboard"
        description="Applications, evaluations, and interview invitations."
        action={
          <Link href="/catalogue">
            <Button size="sm">Browse catalogue</Button>
          </Link>
        }
      />

      {data.invitations.length > 0 && (
        <Card className="mb-6 flex items-start gap-3 border border-success-50 bg-success-50">
          <PartyPopper className="mt-0.5 h-5 w-5 text-success" />
          <div>
            <p className="text-[16px] font-semibold text-n900">
              You have {data.invitations.length} interview invitation
              {data.invitations.length > 1 ? 's' : ''}!
            </p>
            <p className="mt-1 text-[14px] text-n700">
              {data.invitations
                .map((i) => `${i.companyName} — ${i.projectTitle}`)
                .join('; ')}
              . The company will arrange the interview with you off-platform.
            </p>
          </div>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-3 gap-4">
        {(['PENDING', 'ACCEPTED', 'DECLINED'] as const).map((s) => (
          <Card key={s} className="text-center">
            <p className="text-[24px] font-semibold text-n900">
              {data.applicationsByStatus[s] ?? 0}
            </p>
            <p className="mt-1 text-[12px] uppercase tracking-wide text-n500">
              {s.toLowerCase()}
            </p>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-[16px] font-semibold text-n900">Applications</h2>
      {data.applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Find a project in the catalogue and apply."
          action={
            <Link href="/catalogue">
              <Button size="sm">Browse catalogue</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.applications.map((a) => (
            <Card key={a.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[18px] font-semibold text-n900">
                    {a.project.title}
                  </p>
                  <p className="text-[14px] text-n500">{a.project.company.name}</p>
                </div>
                <StatusPill status={a.status} />
              </div>

              {a.status === 'DECLINED' && a.declineReason && (
                <p className="rounded-[8px] bg-danger-50 p-3 text-[14px] text-danger">
                  <span className="font-medium">Reason:</span> {a.declineReason}
                </p>
              )}

              {a.status === 'ACCEPTED' && !a.evaluation && (
                <div className="flex items-center justify-between rounded-[8px] bg-primary-50 p-3">
                  <span className="text-[14px] text-primary-dark">
                    {a.deliverable
                      ? 'Deliverable submitted. You can still update it before the deadline.'
                      : 'You were accepted — submit your deliverable before the deadline.'}
                  </span>
                  <Link href={`/applications/${a.id}/submit`}>
                    <Button size="sm">
                      {a.deliverable ? 'Update deliverable' : 'Submit deliverable'}
                    </Button>
                  </Link>
                </div>
              )}

              {a.evaluation && (
                <div className="rounded-[8px] border border-n100 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[14px] font-medium text-n900">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      {a.evaluation.score}/5
                    </span>
                    <StatusPill status={a.evaluation.outcome} />
                  </div>
                  <p className="text-[14px] text-n700">{a.evaluation.feedback}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
