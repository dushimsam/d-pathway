'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { api, ApiError } from '@/lib/api-client';
import { formatMoney } from '@/lib/money';
import { BoardStage } from '@/lib/types';
import type { BoardCandidate, ProjectBoard } from '@/lib/types';

const COLUMNS: Array<{ key: BoardStage; label: string; hint: string }> = [
  { key: BoardStage.Applied, label: 'Applied', hint: 'New applicants' },
  { key: BoardStage.Accepted, label: 'Accepted', hint: 'Awaiting deliverable' },
  { key: BoardStage.Submitted, label: 'Submitted', hint: 'Ready to review' },
  { key: BoardStage.Evaluated, label: 'Evaluated', hint: 'Scored' },
  { key: BoardStage.Awarded, label: 'Winner', hint: 'Prize released' },
];

export default function ProjectBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['project', id, 'board'],
    queryFn: () => api.get<ProjectBoard>(`/projects/${id}/board`),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['project', id, 'board'] });
    qc.invalidateQueries({ queryKey: ['project', id] });
    qc.invalidateQueries({ queryKey: ['wallet'] });
  };
  const onError = (e: unknown, fallback: string) =>
    setError(e instanceof ApiError ? e.message : fallback);

  const accept = useMutation({
    mutationFn: (appId: string) => api.post(`/applications/${appId}/accept`),
    onSuccess: () => { setError(null); invalidate(); },
    onError: (e) => onError(e, 'Could not accept.'),
  });
  const decline = useMutation({
    mutationFn: (appId: string) =>
      api.post(`/applications/${appId}/decline`, { reason: reason.trim() }),
    onSuccess: () => { setError(null); setDecliningId(null); setReason(''); invalidate(); },
    onError: (e) => onError(e, 'Could not decline.'),
  });
  const award = useMutation({
    mutationFn: (graduateId: string) => api.post(`/projects/${id}/award`, { graduateId }),
    onSuccess: () => { setError(null); invalidate(); },
    onError: (e) => onError(e, 'Could not award the prize.'),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {COLUMNS.map((c) => <Skeleton key={c.key} className="h-96" />)}
      </div>
    );
  }
  if (isError || !data) {
    return <ErrorState message="Could not load the pipeline." onRetry={() => refetch()} />;
  }

  const { project, candidates } = data;
  const prizeHeld = project.prizeStatus === 'HELD' && project.prizeAmount != null;
  const byStage = (stage: BoardStage) => candidates.filter((c) => c.stage === stage);
  const declined = byStage(BoardStage.Declined);

  function Card({ c }: { c: BoardCandidate }) {
    return (
      <div className="flex flex-col gap-2 rounded-[12px] border border-n300 bg-n0 p-3">
        <Link
          href={`/students/${c.graduate.id}`}
          className="text-[14px] font-semibold text-n900 hover:text-primary"
        >
          {c.graduate.fullName}
        </Link>
        {c.graduate.location && (
          <p className="-mt-1 text-[12px] text-n500">{c.graduate.location}</p>
        )}
        {c.graduate.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {c.graduate.skills.slice(0, 3).map((s) => (
              <Badge key={s} variant="info">{s}</Badge>
            ))}
          </div>
        )}

        {c.evaluation && (
          <div className="flex items-center gap-2 text-[13px] text-n700">
            <span className="inline-flex items-center gap-1 font-medium text-n900">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              {c.evaluation.score}/5
            </span>
            {c.evaluation.outcome === 'SELECTED_FOR_INTERVIEW' && (
              <Badge variant="success">Interview</Badge>
            )}
            {c.evaluation.stale && <Badge variant="warning">Re-review</Badge>}
          </div>
        )}

        {/* Stage-specific actions */}
        {c.stage === BoardStage.Applied && (
          decliningId === c.id ? (
            <div className="flex flex-col gap-2">
              <textarea
                autoFocus
                placeholder="Reason (shown to the graduate)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full rounded-[8px] border border-n300 bg-n0 px-2.5 py-1.5 text-[13px] focus:border-primary focus:outline-none"
              />
              <div className="flex gap-1.5">
                <Button variant="danger" size="sm" disabled={!reason.trim() || decline.isPending}
                  onClick={() => decline.mutate(c.id)}>Confirm</Button>
                <Button variant="ghost" size="sm" onClick={() => { setDecliningId(null); setReason(''); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <Button size="sm" disabled={accept.isPending} onClick={() => accept.mutate(c.id)}>Accept</Button>
              <Button variant="secondary" size="sm" onClick={() => { setDecliningId(c.id); setError(null); }}>Decline</Button>
            </div>
          )
        )}

        {c.stage === BoardStage.Accepted && (
          <p className="text-[12px] text-n500">Waiting on their deliverable.</p>
        )}

        {c.stage === BoardStage.Submitted && c.deliverable && (
          <Link href={`/deliverables/${c.deliverable.id}/evaluate`}>
            <Button size="sm">Review deliverable</Button>
          </Link>
        )}

        {c.stage === BoardStage.Evaluated && (
          <div className="flex flex-col gap-1.5">
            {c.deliverable && (
              <Link href={`/deliverables/${c.deliverable.id}/evaluate`}
                className="text-[12px] text-primary hover:underline">View / re-review</Link>
            )}
            {prizeHeld && (
              <Button size="sm" disabled={award.isPending}
                onClick={() => {
                  if (confirm(`Award ${formatMoney(project.prizeAmount!, project.prizeCurrency ?? 'rwf')} to ${c.graduate.fullName}? This completes the project.`))
                    award.mutate(c.graduate.id);
                }}>
                {award.isPending ? 'Awarding…' : 'Award prize'}
              </Button>
            )}
          </div>
        )}

        {c.stage === BoardStage.Awarded && (
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
            <Trophy className="h-4 w-4" />
            Winner
            {project.prizeAmount != null && (
              <span className="font-normal text-n500">
                · {formatMoney(project.prizeAmount, project.prizeCurrency ?? 'rwf')}
              </span>
            )}
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description={project.title}
        action={
          <div className="flex gap-2">
            <Link href={`/projects/${id}/applications`}>
              <Button variant="secondary" size="sm">List view</Button>
            </Link>
            <Link href="/projects">
              <Button variant="ghost" size="sm">← Projects</Button>
            </Link>
          </div>
        }
      />

      {error && <p className="mb-4 rounded-[8px] bg-danger-50 p-3 text-[14px] text-danger">{error}</p>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = byStage(col.key);
          return (
            <div key={col.key} className="flex flex-col gap-3 rounded-[14px] bg-n100 p-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-[13px] font-semibold text-n900">{col.label}</p>
                  <p className="text-[11px] text-n500">{col.hint}</p>
                </div>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-n0 px-1.5 text-[12px] font-semibold text-n700">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <p className="px-1 py-6 text-center text-[12px] text-n500">Empty</p>
                ) : (
                  items.map((c) => <Card key={c.id} c={c} />)
                )}
              </div>
            </div>
          );
        })}
      </div>

      {declined.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-[14px] font-medium text-n500">
            Declined ({declined.length})
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {declined.map((c) => (
              <div key={c.id} className="rounded-[12px] border border-n300 bg-n0 p-3">
                <p className="text-[14px] font-medium text-n700">{c.graduate.fullName}</p>
                {c.declineReason && (
                  <p className="mt-1 text-[12px] text-n500">{c.declineReason}</p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
