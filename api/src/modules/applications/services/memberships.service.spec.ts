import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, MembershipStatus } from '../../../common/enums/index.js';
import { mockRepo } from '../../../test/mock-repo.js';
import { MembershipsService, MAX_TEAM_SIZE } from './memberships.service.js';

function make() {
  const applications = mockRepo();
  const memberships = mockRepo();
  const graduates = {
    getByUserIdOrThrow: vi.fn(),
    findByEmail: vi.fn(),
  };
  const service = new MembershipsService(
    applications as never,
    memberships as never,
    graduates as never,
  );
  return { service, applications, memberships, graduates };
}

const LEAD = { id: 'lead-1', userId: 'lead-user' };
const INVITEE = { id: 'grad-2', userId: 'grad-2-user' };
const APP = {
  id: 'app-1',
  graduateId: LEAD.id,
  projectId: 'proj-1',
  status: ApplicationStatus.PENDING,
};

describe('MembershipsService.invite', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(LEAD);
    ctx.applications.findOne.mockResolvedValue({ ...APP });
    ctx.graduates.findByEmail.mockResolvedValue(INVITEE);
    ctx.memberships.count.mockResolvedValue(0);
  });

  it('creates an INVITED membership for a fresh teammate', async () => {
    ctx.applications.findOne
      .mockResolvedValueOnce({ ...APP }) // loadOrThrow
      .mockResolvedValueOnce(null); // invitee has no own application
    ctx.memberships.findOne.mockResolvedValue(null);

    const result = await ctx.service.invite('lead-user', 'app-1', 'a@b.com');

    expect(ctx.memberships.save).toHaveBeenCalled();
    expect(result.status).toBe(MembershipStatus.INVITED);
    expect(result.graduateId).toBe(INVITEE.id);
  });

  it('rejects when the caller is not the lead', async () => {
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue({ id: 'someone-else' });
    await expect(
      ctx.service.invite('x', 'app-1', 'a@b.com'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the application is not pending', async () => {
    ctx.applications.findOne.mockResolvedValue({
      ...APP,
      status: ApplicationStatus.ACCEPTED,
    });
    await expect(
      ctx.service.invite('lead-user', 'app-1', 'a@b.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('404s when the email has no student account', async () => {
    ctx.graduates.findByEmail.mockResolvedValue(null);
    await expect(
      ctx.service.invite('lead-user', 'app-1', 'none@b.com'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects inviting yourself', async () => {
    ctx.graduates.findByEmail.mockResolvedValue(LEAD);
    await expect(
      ctx.service.invite('lead-user', 'app-1', 'a@b.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the invitee already applied to the project', async () => {
    ctx.applications.findOne
      .mockResolvedValueOnce({ ...APP })
      .mockResolvedValueOnce({ id: 'their-own-app' });
    await expect(
      ctx.service.invite('lead-user', 'app-1', 'a@b.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when the invitee is already on the team', async () => {
    ctx.applications.findOne
      .mockResolvedValueOnce({ ...APP })
      .mockResolvedValueOnce(null);
    ctx.memberships.findOne.mockResolvedValue({
      status: MembershipStatus.ACCEPTED,
    });
    await expect(
      ctx.service.invite('lead-user', 'app-1', 'a@b.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('re-invites a previously declined teammate by resetting the row', async () => {
    ctx.applications.findOne
      .mockResolvedValueOnce({ ...APP })
      .mockResolvedValueOnce(null);
    const declined = {
      status: MembershipStatus.DECLINED,
      invitedAt: new Date(0),
      respondedAt: new Date(1),
    };
    ctx.memberships.findOne.mockResolvedValue(declined);

    const result = await ctx.service.invite('lead-user', 'app-1', 'a@b.com');
    expect(result.status).toBe(MembershipStatus.INVITED);
    expect(result.respondedAt).toBeNull();
  });

  it('rejects when the team is already full', async () => {
    ctx.applications.findOne
      .mockResolvedValueOnce({ ...APP })
      .mockResolvedValueOnce(null);
    ctx.memberships.findOne.mockResolvedValue(null);
    ctx.memberships.count.mockResolvedValue(MAX_TEAM_SIZE - 1); // + lead == full
    await expect(
      ctx.service.invite('lead-user', 'app-1', 'a@b.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('MembershipsService.respond', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(INVITEE);
    ctx.memberships.count.mockResolvedValue(0);
  });

  it('accepts an invitation addressed to the student', async () => {
    ctx.memberships.findOne.mockResolvedValue({
      id: 'm1',
      graduateId: INVITEE.id,
      applicationId: 'app-1',
      status: MembershipStatus.INVITED,
    });
    const result = await ctx.service.respond('grad-2-user', 'm1', true);
    expect(result.status).toBe(MembershipStatus.ACCEPTED);
    expect(result.respondedAt).toBeInstanceOf(Date);
  });

  it('declines an invitation', async () => {
    ctx.memberships.findOne.mockResolvedValue({
      id: 'm1',
      graduateId: INVITEE.id,
      applicationId: 'app-1',
      status: MembershipStatus.INVITED,
    });
    const result = await ctx.service.respond('grad-2-user', 'm1', false);
    expect(result.status).toBe(MembershipStatus.DECLINED);
  });

  it('404s for a missing invitation', async () => {
    ctx.memberships.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.respond('grad-2-user', 'm1', true),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('forbids responding to someone else’s invitation', async () => {
    ctx.memberships.findOne.mockResolvedValue({
      graduateId: 'other',
      status: MembershipStatus.INVITED,
    });
    await expect(
      ctx.service.respond('grad-2-user', 'm1', true),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects answering an already-answered invitation', async () => {
    ctx.memberships.findOne.mockResolvedValue({
      graduateId: INVITEE.id,
      status: MembershipStatus.ACCEPTED,
    });
    await expect(
      ctx.service.respond('grad-2-user', 'm1', true),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('MembershipsService reads', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('team() returns the lead and members for a teammate', async () => {
    ctx.applications.findOne.mockResolvedValue({
      id: 'app-1',
      graduateId: LEAD.id,
      graduate: { id: LEAD.id, fullName: 'Lead Person' },
    });
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(INVITEE);
    ctx.memberships.findOne.mockResolvedValue({ graduateId: INVITEE.id });
    ctx.memberships.find.mockResolvedValue([
      {
        id: 'm1',
        graduateId: INVITEE.id,
        graduate: { fullName: 'Tee Mate' },
        status: MembershipStatus.ACCEPTED,
        invitedAt: new Date(),
        respondedAt: new Date(),
      },
    ]);

    const result = (await ctx.service.team(
      { id: INVITEE.userId, role: 'GRADUATE' },
      'app-1',
    )) as { lead: { fullName: string }; members: unknown[] };
    expect(result.lead.fullName).toBe('Lead Person');
    expect(result.members).toHaveLength(1);
  });

  it('team() forbids a graduate with no tie to the application', async () => {
    ctx.applications.findOne.mockResolvedValue({
      id: 'app-1',
      graduateId: LEAD.id,
      graduate: { id: LEAD.id, fullName: 'Lead' },
    });
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue({ id: 'stranger' });
    ctx.memberships.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.team({ id: 'stranger-user', role: 'GRADUATE' }, 'app-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('team() allows the owning company', async () => {
    ctx.applications.findOne
      .mockResolvedValueOnce({ id: 'app-1', graduate: { id: LEAD.id, fullName: 'L' } })
      .mockResolvedValueOnce({ project: { company: { userId: 'co-user' } } });
    ctx.memberships.find.mockResolvedValue([]);
    const result = (await ctx.service.team(
      { id: 'co-user', role: 'COMPANY' },
      'app-1',
    )) as { members: unknown[] };
    expect(result.members).toHaveLength(0);
  });

  it('myInvitations() maps pending invites with project context', async () => {
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(INVITEE);
    ctx.memberships.find.mockResolvedValue([
      {
        id: 'm1',
        invitedAt: new Date(),
        application: {
          id: 'app-1',
          status: ApplicationStatus.PENDING,
          graduate: { fullName: 'Lead' },
          project: { id: 'p1', title: 'T', company: { name: 'Co' } },
        },
      },
    ]);
    const result = (await ctx.service.myInvitations('grad-2-user')) as unknown[];
    expect(result).toHaveLength(1);
  });

  it('acceptedMemberGraduateIds / acceptedApplicationIdsForGraduate project rows', async () => {
    ctx.memberships.find
      .mockResolvedValueOnce([{ graduateId: 'g1' }, { graduateId: 'g2' }])
      .mockResolvedValueOnce([{ applicationId: 'a1' }]);
    expect(await ctx.service.acceptedMemberGraduateIds('app-1')).toEqual(['g1', 'g2']);
    expect(await ctx.service.acceptedApplicationIdsForGraduate('g1')).toEqual(['a1']);
  });
});
