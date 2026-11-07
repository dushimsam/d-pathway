'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  Briefcase,
  ExternalLink,
  GraduationCap,
  MapPin,
  Star,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { api } from '@/lib/api-client';
import { formatMoney } from '@/lib/money';
import type { StudentProfile } from '@/lib/types';

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[14px] border border-n300 bg-n0 p-4">
      <div className="mb-1 flex items-center gap-2 text-n500">
        {icon}
        <span className="text-[12px] font-medium">{label}</span>
      </div>
      <p className="text-[22px] font-bold text-n900">{value}</p>
    </div>
  );
}

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.get<StudentProfile>(`/talent/${id}`),
  });

  return (
    <div>
      <Link
        href="/talent"
        className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-n500 hover:text-n900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to talent
      </Link>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-40" />
        </div>
      )}
      {isError && <ErrorState message="Could not load this profile." onRetry={() => refetch()} />}

      {data && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[24px] font-bold text-primary">
              {data.fullName.charAt(0)}
            </span>
            <div>
              <h1 className="text-[24px] font-bold text-n900">{data.fullName}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-n500">
                {data.education && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" /> {data.education}
                  </span>
                )}
                {data.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {data.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {data.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {data.skills.map((s) => (
                <Badge key={s} variant="info">
                  {s}
                </Badge>
              ))}
            </div>
          )}

          {data.links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {data.links.map((l) => (
                <a
                  key={l}
                  href={l}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[13px] text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> {l.replace(/^https?:\/\//, '')}
                </a>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={<Briefcase className="h-4 w-4" />}
              label="Briefs completed"
              value={String(data.stats.briefsCompleted)}
            />
            <Stat
              icon={<Star className="h-4 w-4" />}
              label="Avg score"
              value={data.stats.briefsCompleted > 0 ? `${data.stats.avgScore}/5` : '—'}
            />
            <Stat
              icon={<Award className="h-4 w-4" />}
              label="Interview picks"
              value={String(data.stats.interviewsSelected)}
            />
            <Stat
              icon={<Trophy className="h-4 w-4" />}
              label="Prizes won"
              value={
                data.stats.prizesWon > 0
                  ? `${data.stats.prizesWon} · ${formatMoney(data.stats.prizeTotal)}`
                  : '0'
              }
            />
          </div>

          <h2 className="mb-3 mt-8 text-[18px] font-bold text-n900">Work history</h2>
          {data.history.length === 0 ? (
            <p className="text-[14px] text-n500">No scored work on D·Pathway yet.</p>
          ) : (
            <div className="space-y-3">
              {data.history.map((h) => (
                <div
                  key={h.projectId}
                  className="flex items-center justify-between gap-4 rounded-[14px] border border-n300 bg-n0 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-n900">{h.projectTitle}</p>
                    <Link
                      href={`/companies/${h.companyId}`}
                      className="text-[13px] text-n500 hover:text-primary"
                    >
                      {h.companyName}
                    </Link>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {h.outcome === 'SELECTED_FOR_INTERVIEW' && (
                      <Badge variant="success">Interview</Badge>
                    )}
                    <span className="inline-flex items-center gap-1 text-[15px] font-bold text-n900">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      {h.score}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
