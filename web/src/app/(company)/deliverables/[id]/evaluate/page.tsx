'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FileText, Star } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Textarea';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { api, ApiError } from '@/lib/api-client';
import type { Deliverable, Evaluation, EvaluationOutcome } from '@/lib/types';

export default function EvaluatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [outcome, setOutcome] = useState<EvaluationOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deliverableQuery = useQuery({
    queryKey: ['deliverable', id],
    queryFn: () => api.get<Deliverable>(`/deliverables/${id}`),
  });
  const evaluationQuery = useQuery({
    queryKey: ['evaluation', id],
    queryFn: async () => {
      try {
        return await api.get<Evaluation>(`/deliverables/${id}/evaluation`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });

  const record = useMutation({
    mutationFn: () =>
      api.post<Evaluation>(`/deliverables/${id}/evaluation`, {
        score,
        feedback: feedback.trim(),
        outcome,
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['evaluation', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'company'] });
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : 'Could not record the evaluation.'),
  });

  if (deliverableQuery.isLoading || evaluationQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (deliverableQuery.isError || !deliverableQuery.data) {
    return <ErrorState message="Could not load this deliverable." onRetry={() => deliverableQuery.refetch()} />;
  }

  const d = deliverableQuery.data;
  const existing = evaluationQuery.data;
  const readOnly = Boolean(existing);
  const effScore = existing?.score ?? score;
  const effFeedback = existing?.feedback ?? feedback;
  const effOutcome = existing?.outcome ?? outcome;

  const canSubmit =
    !readOnly && score >= 1 && feedback.trim().length > 0 && outcome !== null && !record.isPending;

  return (
    <div>
      <PageHeader
        title="Evaluate deliverable"
        description={d.application?.project.title}
        action={
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              ← Projects
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-wide text-n500">
              Graduate
            </p>
            <p className="text-[16px] font-medium text-n900">
              {d.application?.graduate.fullName}
            </p>
          </div>

          <p className="text-[12px] text-n500">
            Submitted {format(new Date(d.submittedAt), 'd MMM yyyy, HH:mm')}
          </p>

          <div className="flex flex-col gap-2">
            {d.linkUrl && (
              <a
                href={d.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" /> {d.linkUrl}
              </a>
            )}
            {d.fileUrl && (
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-primary hover:underline"
              >
                <FileText className="h-4 w-4" /> Uploaded file
              </a>
            )}
          </div>

          <div>
            <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-n500">
              Note
            </p>
            <p className="whitespace-pre-wrap text-[14px] text-n700">{d.note}</p>
          </div>
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-[16px] font-semibold text-n900">
            {readOnly ? 'Recorded evaluation' : 'Record evaluation'}
          </h2>

          <Field label="Score">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setScore(n)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-[8px] border',
                    effScore >= n
                      ? 'border-warning bg-warning-50 text-warning'
                      : 'border-n300 text-n500',
                    readOnly && 'cursor-default',
                  )}
                >
                  <Star className={cn('h-5 w-5', effScore >= n && 'fill-warning')} />
                </button>
              ))}
            </div>
          </Field>

          <Field label="Feedback (shown to the graduate)" htmlFor="feedback">
            <Textarea
              id="feedback"
              rows={5}
              value={effFeedback}
              disabled={readOnly}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </Field>

          <Field label="Outcome">
            <div className="flex flex-col gap-2">
              {(
                [
                  ['SELECTED_FOR_INTERVIEW', 'Selected for interview'],
                  ['NOT_SELECTED', 'Not selected'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    'flex items-center gap-2 rounded-[8px] border p-3 text-[14px]',
                    effOutcome === value ? 'border-primary bg-primary-50' : 'border-n300',
                    readOnly && 'cursor-default',
                  )}
                >
                  <input
                    type="radio"
                    name="outcome"
                    checked={effOutcome === value}
                    disabled={readOnly}
                    onChange={() => setOutcome(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </Field>

          {readOnly && existing && (
            <div className="flex items-center gap-2">
              <StatusPill status={existing.outcome} />
              <span className="text-[12px] text-n500">
                Recorded {format(new Date(existing.evaluatedAt), 'd MMM yyyy')} · evaluations are final
              </span>
            </div>
          )}

          {error && <p className="text-[14px] text-danger">{error}</p>}

          {!readOnly && (
            <Button disabled={!canSubmit} onClick={() => record.mutate()}>
              {record.isPending ? 'Recording…' : 'Record evaluation'}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
