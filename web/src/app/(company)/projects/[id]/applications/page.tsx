'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { cn } from '@/lib/cn';
import { api, ApiError } from '@/lib/api-client';
import type { Project, QueueApplicant } from '@/lib/types';

export default function ReviewQueuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDecline, setShowDecline] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
  });
  const queueQuery = useQuery({
    queryKey: ['project', id, 'applications'],
    queryFn: () => api.get<QueueApplicant[]>(`/projects/${id}/applications`),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['project', id, 'applications'] });

  const accept = useMutation({
    mutationFn: (appId: string) => api.post(`/applications/${appId}/accept`),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (e) =>
      setActionError(e instanceof ApiError ? e.message : 'Could not accept.'),
  });
  const decline = useMutation({
    mutationFn: (appId: string) =>
      api.post(`/applications/${appId}/decline`, { reason: declineReason.trim() }),
    onSuccess: () => {
      setActionError(null);
      setShowDecline(false);
      setDeclineReason('');
      invalidate();
    },
    onError: (e) =>
      setActionError(e instanceof ApiError ? e.message : 'Could not decline.'),
  });

  if (queueQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (queueQuery.isError || !queueQuery.data) {
    return <ErrorState message="Could not load the review queue." onRetry={() => queueQuery.refetch()} />;
  }

  const applicants = queueQuery.data;
  const selected = applicants.find((a) => a.id === selectedId) ?? applicants[0];

  return (
    <div>
      <PageHeader
        title="Review queue"
        description={projectQuery.data?.title}
        action={
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              ← Projects
            </Button>
          </Link>
        }
      />

      {applicants.length === 0 ? (
        <EmptyState title="No applicants yet" description="Applications will appear here as graduates apply." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div className="flex flex-col gap-2">
            {applicants.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setSelectedId(a.id);
                  setShowDecline(false);
                  setActionError(null);
                }}
                className={cn(
                  'flex items-center justify-between rounded-[12px] border bg-n0 p-4 text-left transition-colors',
                  selected?.id === a.id
                    ? 'border-primary'
                    : 'border-n300 hover:border-n500',
                )}
              >
                <div>
                  <p className="text-[14px] font-medium text-n900">
                    {a.graduate.fullName}
                  </p>
                  <p className="text-[12px] text-n500">
                    {a.graduate.location ?? '—'}
                  </p>
                </div>
                <StatusPill status={a.status} />
              </button>
            ))}
          </div>

          {selected && (
            <Card className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[18px] font-semibold text-n900">
                    {selected.graduate.fullName}
                  </h2>
                  <p className="text-[14px] text-n500">
                    {selected.graduate.education ?? 'No education listed'}
                  </p>
                </div>
                <StatusPill status={selected.status} />
              </div>

              <div>
                <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-n500">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.graduate.skills.length ? (
                    selected.graduate.skills.map((s) => (
                      <Badge key={s} variant="info">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[14px] text-n500">None listed</span>
                  )}
                </div>
              </div>

              {selected.graduate.links.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-n500">
                    Prior work
                  </p>
                  <ul className="flex flex-col gap-1">
                    {selected.graduate.links.map((l) => (
                      <li key={l}>
                        <a
                          href={l}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[14px] text-primary hover:underline"
                        >
                          {l} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.note && (
                <div>
                  <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-n500">
                    Note
                  </p>
                  <p className="text-[14px] text-n700">{selected.note}</p>
                </div>
              )}

              <p className="text-[12px] text-n500">
                Terms accepted {format(new Date(selected.termsAcceptedAt), 'd MMM yyyy, HH:mm')}
              </p>

              {selected.status === 'DECLINED' && selected.declineReason && (
                <p className="rounded-[8px] bg-danger-50 p-3 text-[14px] text-danger">
                  <span className="font-medium">Declined:</span> {selected.declineReason}
                </p>
              )}

              {actionError && <p className="text-[14px] text-danger">{actionError}</p>}

              {selected.status === 'PENDING' && (
                <div className="border-t border-n100 pt-4">
                  {showDecline ? (
                    <div className="flex flex-col gap-3">
                      <Field label="Reason for declining (shown to the graduate)" htmlFor="reason">
                        <Textarea
                          id="reason"
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                        />
                      </Field>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowDecline(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={!declineReason.trim() || decline.isPending}
                          onClick={() => decline.mutate(selected.id)}
                        >
                          Confirm decline
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[12px] text-n500">
                        Accepting locks this project&apos;s brief and terms.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowDecline(true)}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          disabled={accept.isPending}
                          onClick={() => accept.mutate(selected.id)}
                        >
                          Accept applicant
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
