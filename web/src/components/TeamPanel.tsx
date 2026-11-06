'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Crown, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { StatusPill } from '@/components/ui/StatusPill';
import { api, ApiError } from '@/lib/api-client';
import type { Team } from '@/lib/types';

const MAX_TEAM_SIZE = 4;

/**
 * Team roster for an application. The lead can invite teammates by email while
 * the application is pending; everyone sees the roster.
 */
export function TeamPanel({
  applicationId,
  isLead,
  canInvite,
}: {
  applicationId: string;
  isLead: boolean;
  canInvite: boolean;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');

  const { data } = useQuery({
    queryKey: ['team', applicationId],
    queryFn: () => api.get<Team>(`/applications/${applicationId}/team`),
  });

  const invite = useMutation({
    mutationFn: () =>
      api.post(`/applications/${applicationId}/invitations`, {
        email: email.trim(),
      }),
    onSuccess: () => {
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['team', applicationId] });
    },
  });

  if (!data) return null;

  const activeCount =
    1 + data.members.filter((m) => m.status !== 'DECLINED').length;
  const seatsLeft = MAX_TEAM_SIZE - activeCount;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-[16px] font-semibold text-n900">
          Team ({activeCount}/{MAX_TEAM_SIZE})
        </h2>
      </div>

      <ul className="flex flex-col gap-2">
        <li className="flex items-center justify-between rounded-[8px] border border-n200 px-3 py-2">
          <span className="flex items-center gap-2 text-[14px] text-n900">
            <Crown className="h-3.5 w-3.5 text-warning" /> {data.lead.fullName}
          </span>
          <span className="text-[12px] text-n500">Lead</span>
        </li>
        {data.members
          .filter((m) => m.status !== 'DECLINED')
          .map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-[8px] border border-n200 px-3 py-2"
            >
              <span className="text-[14px] text-n900">{m.fullName}</span>
              <StatusPill status={m.status} />
            </li>
          ))}
      </ul>

      {isLead && canInvite && seatsLeft > 0 && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) invite.mutate();
          }}
        >
          <Field label="Invite a teammate by email" htmlFor="invite-email">
            <div className="flex gap-2">
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@school.edu"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!email.trim() || invite.isPending}
              >
                {invite.isPending ? 'Inviting…' : 'Invite'}
              </Button>
            </div>
          </Field>
          {invite.isError && (
            <p className="text-[13px] text-danger">
              {invite.error instanceof ApiError
                ? invite.error.message
                : 'Could not send the invitation.'}
            </p>
          )}
        </form>
      )}

      {isLead && canInvite && seatsLeft <= 0 && (
        <p className="text-[12px] text-n500">Your team is full.</p>
      )}
      {isLead && !canInvite && (
        <p className="text-[12px] text-n500">
          Teammates can only be invited while the application is pending.
        </p>
      )}
    </Card>
  );
}
