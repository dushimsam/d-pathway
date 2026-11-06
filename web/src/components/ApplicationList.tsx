'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import type { MyApplication } from '@/lib/types';

/** The student's applications as a list of status-aware cards. */
export function ApplicationList({ applications }: { applications: MyApplication[] }) {
  return (
    <div className="flex flex-col gap-3">
      {applications.map((a) => (
        <Card key={a.id} className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {a.project.coverImageUrl && (
                <div className="hidden h-12 w-16 shrink-0 overflow-hidden rounded-[8px] border border-white/10 sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.project.coverImageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div>
                <Link
                  href={`/projects/${a.project.id}`}
                  className="text-[18px] font-semibold text-n900 hover:text-primary"
                >
                  {a.project.title}
                </Link>
                <p className="text-[14px] text-n500">{a.project.company.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {a.role === 'MEMBER' && <Badge variant="info">Teammate</Badge>}
              <StatusPill status={a.status} />
            </div>
          </div>

          {a.status === 'DECLINED' && a.declineReason && (
            <p className="rounded-[8px] bg-danger-50 p-3 text-[14px] text-danger">
              <span className="font-medium">Reason:</span> {a.declineReason}
            </p>
          )}

          {a.status === 'ACCEPTED' && !a.evaluation && (
            <div className="flex items-center justify-between rounded-[8px] bg-primary-50 p-3">
              <span className="text-[14px] text-primary-dark">
                {a.role === 'MEMBER'
                  ? 'You are on this team — your lead submits the deliverable.'
                  : a.deliverable
                    ? 'Deliverable submitted. You can still update it.'
                    : 'You were accepted — submit your deliverable before the deadline.'}
              </span>
              <Link href={`/applications/${a.id}/submit`}>
                <Button size="sm">
                  {a.role === 'MEMBER'
                    ? 'View team'
                    : a.deliverable
                      ? 'Update deliverable'
                      : 'Submit deliverable'}
                </Button>
              </Link>
            </div>
          )}

          {a.evaluation && (
            <div className="rounded-[8px] border border-n100 p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex items-center gap-1 text-[14px] font-medium text-n900">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {a.evaluation.score}/5
                </span>
                <StatusPill status={a.evaluation.outcome} />
                {a.evaluation.stale && <Badge variant="warning">Re-review pending</Badge>}
              </div>
              <p className="text-[14px] text-n700">{a.evaluation.feedback}</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
