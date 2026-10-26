'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DeadlineChip } from '@/components/ui/DeadlineChip';
import { StatusPill } from '@/components/ui/StatusPill';
import { PrizeBadge } from '@/components/ui/PrizeBadge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api-client';
import type { CatalogueCompany, Paginated, Project } from '@/lib/types';

interface Filters {
  companyId?: string;
  skill?: string;
  hasPrize?: boolean;
}

export default function CataloguePage() {
  const [filters, setFilters] = useState<Filters>({});
  const [skillDraft, setSkillDraft] = useState('');

  const companiesQuery = useQuery({
    queryKey: ['catalogue', 'companies'],
    queryFn: () => api.get<CatalogueCompany[]>('/catalogue/companies'),
  });

  const params = new URLSearchParams();
  if (filters.companyId) params.set('companyId', filters.companyId);
  if (filters.skill) params.set('skill', filters.skill);
  if (filters.hasPrize) params.set('hasPrize', 'true');
  const qs = params.toString();

  const projectsQuery = useQuery({
    queryKey: ['catalogue', filters],
    queryFn: () =>
      api.get<Paginated<Project>>(`/catalogue/projects${qs ? `?${qs}` : ''}`),
  });

  const hasFilters = Boolean(filters.companyId || filters.skill || filters.hasPrize);

  return (
    <div>
      <PageHeader
        title="Project catalogue"
        description="Browse open projects from companies on D-Pathway."
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilters((f) => ({ ...f, skill: skillDraft.trim() || undefined }));
          }}
          className="flex items-center gap-2"
        >
          <input
            placeholder="Filter by skill (e.g. react)"
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            className="h-9 rounded-full border border-n300 bg-n0 px-4 text-[14px] focus:border-primary focus:outline-none"
          />
          <Button type="submit" size="sm" variant="secondary">
            Apply
          </Button>
        </form>

        <button
          onClick={() =>
            setFilters((f) => ({ ...f, hasPrize: f.hasPrize ? undefined : true }))
          }
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[14px] transition-colors',
            filters.hasPrize
              ? 'bg-warning-50 text-warning'
              : 'bg-n0 text-n700 hover:bg-n100',
          )}
        >
          🏆 With prizes
        </button>

        {(companiesQuery.data ?? []).map((c) => {
          const active = filters.companyId === c.id;
          return (
            <button
              key={c.id}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  companyId: active ? undefined : c.id,
                }))
              }
              className={cn(
                'rounded-full px-3 py-1.5 text-[14px] transition-colors',
                active
                  ? 'bg-primary-50 text-primary-dark'
                  : 'bg-n0 text-n700 hover:bg-n100',
              )}
            >
              {c.name}
            </button>
          );
        })}

        {hasFilters && (
          <button
            onClick={() => {
              setFilters({});
              setSkillDraft('');
            }}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[14px] text-n500 hover:text-n900"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {projectsQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      )}

      {projectsQuery.isError && (
        <ErrorState
          message="Could not load the catalogue."
          onRetry={() => projectsQuery.refetch()}
        />
      )}

      {projectsQuery.data && projectsQuery.data.items.length === 0 && (
        <EmptyState
          title="No projects match"
          description="Try clearing the filters or checking back soon."
        />
      )}

      {projectsQuery.data && projectsQuery.data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projectsQuery.data.items.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium uppercase tracking-wide text-n500">
                  {p.company?.name ?? 'Organisation'}
                </span>
                {p.prizeAmount != null ? (
                  <PrizeBadge amount={p.prizeAmount} currency={p.prizeCurrency} size="sm" />
                ) : (
                  <StatusPill status={p.status} />
                )}
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
              <div className="mt-auto flex items-center justify-between pt-2">
                <DeadlineChip iso={p.applicationDeadline} label="Apply by" />
                <Link href={`/projects/${p.id}`}>
                  <Button size="sm">View brief and terms</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
