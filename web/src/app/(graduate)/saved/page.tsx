'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DeadlineChip } from '@/components/ui/DeadlineChip';
import { PrizeBadge } from '@/components/ui/PrizeBadge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { BookmarkButton } from '@/components/BookmarkButton';
import { useSavedBriefs } from '@/lib/useSavedBriefs';
import { api } from '@/lib/api-client';
import type { Project } from '@/lib/types';

export default function SavedBriefsPage() {
  const { ids: savedIds } = useSavedBriefs();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['saved', 'list'],
    queryFn: () => api.get<Project[]>('/catalogue/saved'),
  });

  return (
    <div>
      <PageHeader
        title="Saved briefs"
        description="Briefs you bookmarked to apply to later."
        action={
          <Link href="/catalogue">
            <Button size="sm">Browse catalogue</Button>
          </Link>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}
      {isError && <ErrorState message="Could not load your saved briefs." onRetry={() => refetch()} />}
      {data && data.length === 0 && (
        <EmptyState
          title="Nothing saved yet"
          description="Tap the bookmark on any brief in the catalogue to keep it here."
          action={
            <Link href="/catalogue">
              <Button size="sm">Browse catalogue</Button>
            </Link>
          }
        />
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/companies/${p.companyId}`}
                  className="truncate text-[12px] font-medium uppercase tracking-wide text-n500 hover:text-primary"
                >
                  {p.company?.name ?? 'Organisation'}
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {p.prizeAmount != null && (
                    <PrizeBadge amount={p.prizeAmount} currency={p.prizeCurrency} size="sm" />
                  )}
                  <BookmarkButton projectId={p.id} saved={savedIds.has(p.id)} />
                </div>
              </div>
              <h3 className="text-[18px] font-semibold text-n900">{p.title}</h3>
              <p className="line-clamp-2 text-[14px] text-n500">{p.brief}</p>
              <div className="flex flex-wrap gap-1.5">
                {p.requiredSkills.map((s) => (
                  <Badge key={s} variant="info">
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <DeadlineChip iso={p.applicationDeadline} label="Apply by" />
                <Link href={`/projects/${p.id}`} className="shrink-0">
                  <Button size="sm">View brief</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
