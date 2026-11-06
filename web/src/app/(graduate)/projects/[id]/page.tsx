'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Lock, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DeadlineChip } from '@/components/ui/DeadlineChip';
import { PrizeBadge } from '@/components/ui/PrizeBadge';
import { StatusPill } from '@/components/ui/StatusPill';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Textarea';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { api, ApiError } from '@/lib/api-client';
import { useMyApplications } from '@/lib/useMyApplications';
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

  // Know up-front whether the student already applied, so the panel reflects it
  // instead of offering an Apply button that the backend would reject.
  const mine = useMyApplications();

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

  if (projectQuery.isLoading || mine.isLoading) {
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
  const existing = mine.byProjectId.get(id);
  const applied = applyMutation.isSuccess || Boolean(existing);
  const deadlinePassed =
    new Date(p.applicationDeadline).getTime() < Date.now();
  // The project is only open to new applications while OPEN and before the
  // deadline. Anything else, show why rather than a dead Apply button.
  const closedReason =
    p.status !== 'OPEN'
      ? p.status === 'DRAFT'
        ? 'This project is not open for applications yet.'
        : 'This project is no longer accepting applications.'
      : deadlinePassed
        ? 'The application deadline has passed.'
        : null;

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

      {p.coverImageUrl && (
        <div className="mb-6 h-56 overflow-hidden rounded-[16px] border border-white/10 sm:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.coverImageUrl}
            alt={`${p.title} cover`}
            className="h-full w-full object-cover"
          />
        </div>
      )}

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
            {existing ? (
              // Already applied (as lead or as an invited teammate).
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {existing.role === 'MEMBER' ? (
                    <Users className="h-5 w-5 text-primary" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                  <p className="text-[16px] font-medium text-n900">
                    {existing.role === 'MEMBER'
                      ? "You're on a team for this project"
                      : "You've applied to this project"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-n500">Status</span>
                  <StatusPill status={existing.status} />
                </div>
                {existing.status === 'ACCEPTED' && (
                  <Link href={`/applications/${existing.id}/submit`} className="w-full">
                    <Button className="w-full">
                      {existing.role === 'MEMBER'
                        ? 'View team & deliverable'
                        : existing.deliverable
                          ? 'Update deliverable'
                          : 'Submit deliverable'}
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard" className="w-full">
                  <Button variant="secondary" className="w-full">
                    Go to dashboard
                  </Button>
                </Link>
              </div>
            ) : applied ? (
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
            ) : closedReason ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                {deadlinePassed ? (
                  <Clock className="h-9 w-9 text-n500" />
                ) : (
                  <Lock className="h-9 w-9 text-n500" />
                )}
                <p className="text-[15px] font-medium text-n900">Applications closed</p>
                <p className="text-[14px] text-n500">{closedReason}</p>
                <Link href="/catalogue" className="w-full">
                  <Button variant="secondary" className="w-full">
                    Browse other projects
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-[16px] font-semibold text-n900">Apply</h2>
                <p className="text-[13px] text-n500">
                  Apply solo, or apply and invite teammates after — you&apos;ll be
                  the team lead.
                </p>
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
