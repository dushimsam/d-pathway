'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PartyPopper, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { ActivityFeed } from '@/components/ActivityFeed';
import { InvitationsInbox } from '@/components/InvitationsInbox';
import { api } from '@/lib/api-client';
import type { GraduateDashboard, GraduateProfile } from '@/lib/types';

export default function GraduateDashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'graduate'],
    queryFn: () => api.get<GraduateDashboard>('/dashboards/graduate'),
  });
  const { data: me } = useQuery({
    queryKey: ['graduate', 'me'],
    queryFn: () => api.get<GraduateProfile>('/graduates/me'),
  });

  // What's missing from the profile — drives Talent-search visibility & matching.
  const missing: string[] = [];
  if (me) {
    if (me.skills.length === 0) missing.push('skills');
    if (!me.photoUrl) missing.push('a photo');
    if (me.links.length === 0) missing.push('portfolio links');
  }

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

      {me && missing.length > 0 && (
        <Card className="mb-6 flex flex-col items-start justify-between gap-3 border border-primary bg-primary-50 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-[15px] font-semibold text-n900">Complete your profile</p>
              <p className="mt-0.5 text-[14px] text-n700">
                Add {missing.join(', ')} so companies can find you in Talent search and match
                you to briefs.
              </p>
            </div>
          </div>
          <Link href="/profile" className="shrink-0">
            <Button size="sm">Complete profile</Button>
          </Link>
        </Card>
      )}

      <InvitationsInbox />

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

      <Link href="/applications" className="mb-6 grid grid-cols-3 gap-4">
        {(['PENDING', 'ACCEPTED', 'DECLINED'] as const).map((s) => (
          <Card
            key={s}
            className="text-center transition-colors hover:border-primary"
          >
            <p className="text-[24px] font-semibold text-n900">
              {data.applicationsByStatus[s] ?? 0}
            </p>
            <p className="mt-1 text-[12px] uppercase tracking-wide text-n500">
              {s.toLowerCase()}
            </p>
          </Card>
        ))}
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-n900">Your applications</h2>
          <p className="text-[13px] text-n500">
            {data.applications.length === 0
              ? 'You have not applied to any projects yet.'
              : `You've applied to ${data.applications.length} project${
                  data.applications.length > 1 ? 's' : ''
                }.`}
          </p>
        </div>
        <Link href={data.applications.length === 0 ? '/catalogue' : '/applications'}>
          <Button variant="secondary" size="sm">
            {data.applications.length === 0 ? 'Browse catalogue' : 'View applications'}
          </Button>
        </Link>
      </div>

      <ActivityFeed />
    </div>
  );
}
