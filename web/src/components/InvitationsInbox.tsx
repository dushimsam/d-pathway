'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api-client';
import type { MyInvitation } from '@/lib/types';

/** Pending team invitations for the current student, with accept/decline. */
export function InvitationsInbox() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['invitations', 'mine'],
    queryFn: () => api.get<MyInvitation[]>('/invitations/mine'),
  });

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      api.post(`/invitations/${id}/${accept ? 'accept' : 'decline'}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'graduate'] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] });
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <Card className="mb-6 flex flex-col gap-4 border border-primary-50 bg-primary-50/40">
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <h2 className="text-[16px] font-semibold text-n900">
          Team invitations ({data.length})
        </h2>
      </div>
      <ul className="flex flex-col gap-3">
        {data.map((inv) => (
          <li
            key={inv.id}
            className="flex flex-col gap-3 rounded-[10px] border border-n200 bg-n0 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-n900">
                {inv.application.leadName} invited you to{' '}
                {inv.application.project.title}
              </p>
              <p className="text-[12px] text-n500">
                {inv.application.project.company.name}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: inv.id, accept: true })}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: inv.id, accept: false })}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {respond.isError && (
        <p className="text-[13px] text-danger">
          {respond.error instanceof ApiError
            ? respond.error.message
            : 'Could not update the invitation.'}
        </p>
      )}
    </Card>
  );
}
