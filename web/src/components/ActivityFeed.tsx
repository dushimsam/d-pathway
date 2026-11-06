'use client';

import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Activity as ActivityIcon, FileUp, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api-client';
import type { ActivityItem } from '@/lib/types';

const ICONS = {
  DELIVERABLE_SUBMITTED: FileUp,
  EVALUATION_RECORDED: Star,
} as const;

/** Recent activity for the current user, written asynchronously by the worker. */
export function ActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api.get<ActivityItem[]>('/activity'),
    refetchInterval: 15_000,
  });

  if (isLoading || !data || data.length === 0) return null;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ActivityIcon className="h-4 w-4 text-primary" />
        <h2 className="text-[16px] font-semibold text-n900">Recent activity</h2>
      </div>
      <ul className="flex flex-col gap-3">
        {data.slice(0, 8).map((a) => {
          const Icon = ICONS[a.type] ?? ActivityIcon;
          return (
            <li key={a.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] text-n700">{a.message}</p>
                <p className="text-[12px] text-n500">
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
