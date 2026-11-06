'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { ApplicationList } from '@/components/ApplicationList';
import { useMyApplications } from '@/lib/useMyApplications';

export default function MyApplicationsPage() {
  const { data, isLoading, isError, refetch } = useMyApplications();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <ErrorState message="Could not load your applications." onRetry={() => refetch()} />
    );
  }

  return (
    <div>
      <PageHeader
        title="Your applications"
        description="Every project you've applied to or been invited onto."
        action={
          <Link href="/catalogue">
            <Button size="sm">Browse catalogue</Button>
          </Link>
        }
      />

      {data.length === 0 ? (
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
        <ApplicationList applications={data} />
      )}
    </div>
  );
}
