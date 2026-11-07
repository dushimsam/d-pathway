'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Star, Trophy, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { api } from '@/lib/api-client';
import type { Paginated, TalentListItem } from '@/lib/types';

export default function TalentPage() {
  const [skill, setSkill] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['talent', skill ?? ''],
    queryFn: () =>
      api.get<Paginated<TalentListItem>>(
        `/talent?pageSize=24${skill ? `&skill=${encodeURIComponent(skill)}` : ''}`,
      ),
  });

  return (
    <div>
      <PageHeader
        title="Talent"
        description="Discover students by skill — and by the real, scored work they've delivered."
      />

      <form
        className="mb-5 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSkill(draft.trim() || undefined);
        }}
      >
        <input
          placeholder="Search by skill (e.g. react, design, data)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-10 w-full max-w-sm rounded-full border border-n300 bg-n0 px-4 text-[14px] text-n900 focus:border-primary focus:outline-none"
        />
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>
        {skill && (
          <button
            type="button"
            onClick={() => {
              setSkill(undefined);
              setDraft('');
            }}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[14px] text-n500 hover:text-n900"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </form>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      )}
      {isError && <ErrorState message="Could not load talent." onRetry={() => refetch()} />}
      {data && data.items.length === 0 && (
        <EmptyState title="No students match" description="Try a different skill." />
      )}

      {data && data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((t) => (
            <Link
              key={t.id}
              href={`/students/${t.id}`}
              className="flex flex-col gap-3 rounded-[16px] border border-n300 bg-n0 p-5 transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[15px] font-bold text-primary">
                  {t.fullName.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold text-n900">{t.fullName}</p>
                  <p className="truncate text-[12px] text-n500">
                    {t.education ?? t.location ?? 'Student'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {t.skills.slice(0, 5).map((s) => (
                  <Badge key={s} variant="info">
                    {s}
                  </Badge>
                ))}
              </div>

              <div className="mt-auto flex items-center gap-4 border-t border-n100 pt-3 text-[13px] text-n700">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {t.stats.briefsCompleted > 0 ? `${t.stats.avgScore}/5` : '—'}
                </span>
                <span>{t.stats.briefsCompleted} briefs</span>
                {t.stats.prizesWon > 0 && (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Trophy className="h-4 w-4" />
                    {t.stats.prizesWon}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
