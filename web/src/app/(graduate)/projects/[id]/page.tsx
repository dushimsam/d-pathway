'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DeadlineChip } from '@/components/ui/DeadlineChip';
import { PrizeBadge } from '@/components/ui/PrizeBadge';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Textarea';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { api, ApiError } from '@/lib/api-client';
import type { Project } from '@/lib/types';

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [accepted, setAccepted] = useState(false);
  const [note, setNote] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      api.post(`/projects/${id}/apply`, {
        termsAccepted: true,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      setApplyError(null);
      queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] });
    },
    onError: (err) =>
      setApplyError(
        err instanceof ApiError ? err.message : 'Could not submit your application.',
      ),
  });

  if (projectQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (projectQuery.isError || !projectQuery.data) {
    return (
      <ErrorState
        message="Could not load this project."
        onRetry={() => projectQuery.refetch()}
      />
    );
  }

  const p = projectQuery.data;
  const applied = applyMutation.isSuccess;

  return (
    <div>
      <PageHeader
        title={p.title}
        description={p.company?.name}
        action={
          <Link href="/catalogue">
            <Button variant="ghost" size="sm">
              ← Back to catalogue
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            {p.prizeAmount != null && (
              <div className="flex items-center gap-2 rounded-[8px] bg-warning-50 p-3">
                <PrizeBadge amount={p.prizeAmount} currency={p.prizeCurrency} />
                <span className="text-[14px] text-n700">
                  awarded if your deliverable is selected.
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {p.requiredSkills.map((s) => (
                <Badge key={s} variant="info">
                  {s}
                </Badge>
              ))}
            </div>
            <section>
              <h2 className="text-[16px] font-semibold text-n900">The brief</h2>
              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-n700">
                {p.brief}
              </p>
            </section>
            <div className="flex flex-wrap gap-3">
              <DeadlineChip iso={p.applicationDeadline} label="Apply by" />
              <DeadlineChip iso={p.submissionDeadline} label="Submit by" />
              <Badge>Format: {p.deliverableFormat.replace(/_/g, ' ').toLowerCase()}</Badge>
            </div>
          </Card>

          <Card className="border border-primary-50 bg-primary-50">
            <h2 className="text-[16px] font-semibold text-primary-dark">
              Intellectual property terms
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-n700">
              {p.ipTerms}
            </p>
          </Card>
        </div>

        <aside>
          <Card className="sticky top-8 flex flex-col gap-4">
            {applied ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
                <p className="text-[16px] font-medium text-n900">Application submitted</p>
                <p className="text-[14px] text-n500">
                  Track its status on your dashboard.
                </p>
                <Link href="/dashboard" className="w-full">
                  <Button className="w-full">Go to dashboard</Button>
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-[16px] font-semibold text-n900">Apply</h2>
                <Field label="Note to the company (optional)" htmlFor="note">
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Why you're a fit…"
                  />
                </Field>
                <label className="flex items-start gap-2 text-[14px] text-n700">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4"
                  />
                  I have read and accept the intellectual property terms.
                </label>
                {applyError && <p className="text-[14px] text-danger">{applyError}</p>}
                <Button
                  disabled={!accepted || applyMutation.isPending}
                  onClick={() => applyMutation.mutate()}
                >
                  {applyMutation.isPending ? 'Submitting…' : 'Accept terms and apply'}
                </Button>
              </>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
