import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, MembershipStatus } from '../../../common/enums/index.js';
import { mockRepo } from '../../../test/mock-repo.js';
import { ApplicationsService } from './applications.service.js';

function make() {
  const applications = mockRepo();
  const deliverables = mockRepo();
  const evaluations = mockRepo();
  const memberships = mockRepo();
  const graduates = { getByUserIdOrThrow: vi.fn() };
  const companies = { getByUserIdOrThrow: vi.fn() };
  const projects = {
    ensureDeadlineTransition: vi.fn(),
    findByIdOrThrow: vi.fn(),
    assertOwnedByCompany: vi.fn(),
  };
  const events = { applicationDecided: vi.fn() };
  const service = new ApplicationsService(
    applications as never,
    deliverables as never,
    evaluations as never,
    memberships as never,
    graduates as never,
    companies as never,
    projects as never,
    events as never,
  );
  return {
    service,
    applications,
    deliverables,
    evaluations,
    memberships,
    graduates,
    companies,
    projects,
    events,
  };
}

const GRAD = { id: 'grad-1' };
const COMPANY = { id: 'co-1' };
const future = new Date(Date.now() + 86_400_000);
const past = new Date(Date.now() - 86_400_000);

function openProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'proj-1',
    title: 'Proj',
    status: 'OPEN',
    applicationDeadline: future,
    companyId: COMPANY.id,
    company: { id: COMPANY.id, name: 'Co' },
    winnerGraduateId: null,
    prizeStatus: 'NONE',
    prizeAmount: 0,
    prizeCurrency: 'USD',
    submissionDeadline: future,
    deliverableFormat: 'PDF',
    coverImageUrl: null,
    ...overrides,
  };
}

describe('ApplicationsService.apply', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(GRAD);
    ctx.projects.findByIdOrThrow.mockResolvedValue(openProject());
    ctx.projects.ensureDeadlineTransition.mockResolvedValue(openProject());
    ctx.applications.findOne.mockResolvedValue(null);
  });

  it('creates a pending application', async () => {
    const result = await ctx.service.apply('u', 'proj-1', {
      termsAccepted: true,
      note: 'hi',
    } as never);
    expect(ctx.applications.save).toHaveBeenCalled();
    expect(result.status).toBe(ApplicationStatus.PENDING);
    expect(result.note).toBe('hi');
  });

  it('defaults note to null when omitted', async () => {
    const result = await ctx.service.apply('u', 'proj-1', {
      termsAccepted: true,
    } as never);
    expect(result.note).toBeNull();
  });

  it('rejects when terms are not accepted', async () => {
    await expect(
      ctx.service.apply('u', 'proj-1', { termsAccepted: false } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects when the project is not OPEN', async () => {
    ctx.projects.ensureDeadlineTransition.mockResolvedValue(
      openProject({ status: 'CLOSED' }),
    );
    await expect(
      ctx.service.apply('u', 'proj-1', { termsAccepted: true } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects after the application deadline', async () => {
    ctx.projects.ensureDeadlineTransition.mockResolvedValue(
      openProject({ applicationDeadline: past }),
    );
    await expect(
      ctx.service.apply('u', 'proj-1', { termsAccepted: true } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a duplicate application', async () => {
    ctx.applications.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      ctx.service.apply('u', 'proj-1', { termsAccepted: true } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('ApplicationsService.listMine', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(GRAD);
  });

  function appRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'app-1',
      status: ApplicationStatus.PENDING,
      graduateId: GRAD.id,
      note: 'n',
      declineReason: null,
      termsAcceptedAt: new Date(),
      decidedAt: null,
      createdAt: new Date(),
      project: openProject(),
      ...overrides,
    };
  }

  it('maps lead applications with deliverable and evaluation', async () => {
    ctx.memberships.find.mockResolvedValue([]);
    ctx.applications.find.mockResolvedValue([appRow()]);
    ctx.deliverables.find.mockResolvedValue([
      { id: 'd1', applicationId: 'app-1', submittedAt: new Date(), version: 2 },
    ]);
    ctx.evaluations.find.mockResolvedValue([
      {
        id: 'e1',
        deliverableId: 'd1',
        score: 9,
        outcome: 'SELECTED_FOR_INTERVIEW',
        feedback: 'good',
        evaluatedAt: new Date(),
        stale: false,
      },
    ]);

    const result = (await ctx.service.listMine('u')) as Array<{
      role: string;
      deliverable: unknown;
      evaluation: unknown;
    }>;
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('LEAD');
    expect(result[0].deliverable).not.toBeNull();
    expect(result[0].evaluation).not.toBeNull();
  });

  it('includes team applications and marks role MEMBER, with null deliverable/evaluation', async () => {
    ctx.memberships.find.mockResolvedValue([{ applicationId: 'team-app' }]);
    ctx.applications.find.mockResolvedValue([
      appRow({ id: 'team-app', graduateId: 'someone-else' }),
    ]);
    ctx.deliverables.find.mockResolvedValue([]);
    ctx.evaluations.find.mockResolvedValue([]);

    const result = (await ctx.service.listMine('u')) as Array<{
      role: string;
      deliverable: unknown;
      evaluation: unknown;
    }>;
    expect(result[0].role).toBe('MEMBER');
    expect(result[0].deliverable).toBeNull();
    expect(result[0].evaluation).toBeNull();
    // where clause used the OR form
    expect(ctx.applications.find).toHaveBeenCalled();
  });

  it('handles a deliverable with no evaluation', async () => {
    ctx.memberships.find.mockResolvedValue([]);
    ctx.applications.find.mockResolvedValue([appRow()]);
    ctx.deliverables.find.mockResolvedValue([
      { id: 'd1', applicationId: 'app-1', submittedAt: new Date(), version: 1 },
    ]);
    ctx.evaluations.find.mockResolvedValue([]);

    const result = (await ctx.service.listMine('u')) as Array<{
      deliverable: unknown;
      evaluation: unknown;
    }>;
    expect(result[0].deliverable).not.toBeNull();
    expect(result[0].evaluation).toBeNull();
  });

  it('returns an empty list when there are no applications', async () => {
    ctx.memberships.find.mockResolvedValue([]);
    ctx.applications.find.mockResolvedValue([]);
    const result = (await ctx.service.listMine('u')) as unknown[];
    expect(result).toEqual([]);
    expect(ctx.deliverables.find).not.toHaveBeenCalled();
  });
});

describe('ApplicationsService.reviewQueue', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(COMPANY);
    ctx.projects.findByIdOrThrow.mockResolvedValue(openProject());
  });

  it('maps applicants for the owning company', async () => {
    ctx.applications.find.mockResolvedValue([
      {
        id: 'app-1',
        status: ApplicationStatus.PENDING,
        note: 'n',
        declineReason: null,
        termsAcceptedAt: new Date(),
        decidedAt: null,
        createdAt: new Date(),
        graduate: {
          id: 'g1',
          fullName: 'Grad One',
          education: 'ALU',
          skills: ['ts'],
          links: [],
          location: 'KGL',
        },
      },
    ]);
    const result = (await ctx.service.reviewQueue('u', 'proj-1')) as Array<{
      graduate: { fullName: string };
    }>;
    expect(result).toHaveLength(1);
    expect(result[0].graduate.fullName).toBe('Grad One');
    expect(ctx.projects.assertOwnedByCompany).toHaveBeenCalled();
  });
});

describe('ApplicationsService.board', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(COMPANY);
  });

  function cand(overrides: Record<string, unknown> = {}) {
    return {
      id: 'app',
      status: ApplicationStatus.PENDING,
      graduateId: 'g',
      note: null,
      declineReason: null,
      createdAt: new Date(),
      graduate: {
        id: 'g',
        fullName: 'G',
        education: 'e',
        skills: [],
        location: 'l',
      },
      ...overrides,
    };
  }

  it('derives every pipeline stage', async () => {
    ctx.projects.findByIdOrThrow.mockResolvedValue(
      openProject({ winnerGraduateId: 'winner-grad' }),
    );
    ctx.applications.find.mockResolvedValue([
      cand({ id: 'a-applied', graduateId: 'g-applied' }),
      cand({
        id: 'a-accepted',
        graduateId: 'g-accepted',
        status: ApplicationStatus.ACCEPTED,
      }),
      cand({
        id: 'a-submitted',
        graduateId: 'g-submitted',
        status: ApplicationStatus.ACCEPTED,
      }),
      cand({
        id: 'a-evaluated',
        graduateId: 'g-evaluated',
        status: ApplicationStatus.ACCEPTED,
      }),
      cand({
        id: 'a-awarded',
        graduateId: 'winner-grad',
        status: ApplicationStatus.ACCEPTED,
      }),
      cand({
        id: 'a-declined',
        graduateId: 'g-declined',
        status: ApplicationStatus.DECLINED,
      }),
    ]);
    ctx.deliverables.find.mockResolvedValue([
      { id: 'd-sub', applicationId: 'a-submitted', submittedAt: new Date(), version: 1 },
      { id: 'd-eval', applicationId: 'a-evaluated', submittedAt: new Date(), version: 1 },
    ]);
    ctx.evaluations.find.mockResolvedValue([
      { id: 'e1', deliverableId: 'd-eval', score: 7, outcome: 'NOT_SELECTED', stale: false },
    ]);

    const result = (await ctx.service.board('u', 'proj-1')) as {
      project: { id: string };
      candidates: Array<{ id: string; stage: string; isWinner: boolean }>;
    };
    const byId = Object.fromEntries(result.candidates.map((c) => [c.id, c.stage]));
    expect(byId['a-applied']).toBe('applied');
    expect(byId['a-accepted']).toBe('accepted');
    expect(byId['a-submitted']).toBe('submitted');
    expect(byId['a-evaluated']).toBe('evaluated');
    expect(byId['a-awarded']).toBe('awarded');
    expect(byId['a-declined']).toBe('declined');
    expect(result.project.id).toBe('proj-1');
  });

  it('handles a project with no applicants', async () => {
    ctx.projects.findByIdOrThrow.mockResolvedValue(openProject());
    ctx.applications.find.mockResolvedValue([]);
    const result = (await ctx.service.board('u', 'proj-1')) as {
      candidates: unknown[];
    };
    expect(result.candidates).toHaveLength(0);
    expect(ctx.deliverables.find).not.toHaveBeenCalled();
  });
});

describe('ApplicationsService.accept / decline', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(COMPANY);
  });

  function pendingApp() {
    return {
      id: 'app-1',
      status: ApplicationStatus.PENDING,
      graduateId: GRAD.id,
      projectId: 'proj-1',
      declineReason: null,
      decidedAt: null,
      project: openProject(),
    };
  }

  it('accepts a pending application and publishes an event', async () => {
    ctx.applications.findOne.mockResolvedValue(pendingApp());
    const result = await ctx.service.accept('u', 'app-1');
    expect(result.status).toBe(ApplicationStatus.ACCEPTED);
    expect(result.decidedAt).toBeInstanceOf(Date);
    expect(ctx.events.applicationDecided).toHaveBeenCalledWith(
      expect.objectContaining({ accepted: true }),
    );
  });

  it('rejects accepting a non-pending application', async () => {
    ctx.applications.findOne.mockResolvedValue({
      ...pendingApp(),
      status: ApplicationStatus.ACCEPTED,
    });
    await expect(ctx.service.accept('u', 'app-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects accepting after the application deadline', async () => {
    ctx.applications.findOne.mockResolvedValue({
      ...pendingApp(),
      project: openProject({ applicationDeadline: past }),
    });
    await expect(ctx.service.accept('u', 'app-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('declines a pending application with a reason', async () => {
    ctx.applications.findOne.mockResolvedValue(pendingApp());
    const result = await ctx.service.decline('u', 'app-1', '  not a fit  ');
    expect(result.status).toBe(ApplicationStatus.DECLINED);
    expect(result.declineReason).toBe('not a fit');
    expect(ctx.events.applicationDecided).toHaveBeenCalledWith(
      expect.objectContaining({ accepted: false, declineReason: 'not a fit' }),
    );
  });

  it('rejects declining a non-pending application', async () => {
    ctx.applications.findOne.mockResolvedValue({
      ...pendingApp(),
      status: ApplicationStatus.DECLINED,
    });
    await expect(
      ctx.service.decline('u', 'app-1', 'reason'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects declining without a reason', async () => {
    ctx.applications.findOne.mockResolvedValue(pendingApp());
    await expect(ctx.service.decline('u', 'app-1', '   ')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('ApplicationsService helpers', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('getByIdOrThrow returns the application when found', async () => {
    ctx.applications.findOne.mockResolvedValue({ id: 'app-1' });
    expect(await ctx.service.getByIdOrThrow('app-1')).toEqual({ id: 'app-1' });
  });

  it('getByIdOrThrow 404s when missing', async () => {
    ctx.applications.findOne.mockResolvedValue(null);
    await expect(ctx.service.getByIdOrThrow('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('loadForOwningGraduate returns the owned application', async () => {
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(GRAD);
    ctx.applications.findOne.mockResolvedValue({ id: 'app-1', graduateId: GRAD.id });
    const result = await ctx.service.loadForOwningGraduate('u', 'app-1');
    expect(result.id).toBe('app-1');
  });

  it('loadForOwningGraduate forbids a non-owner', async () => {
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(GRAD);
    ctx.applications.findOne.mockResolvedValue({ id: 'app-1', graduateId: 'other' });
    await expect(
      ctx.service.loadForOwningGraduate('u', 'app-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('loadForTeamGraduate returns immediately for the lead', async () => {
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(GRAD);
    ctx.applications.findOne.mockResolvedValue({ id: 'app-1', graduateId: GRAD.id });
    const result = await ctx.service.loadForTeamGraduate('u', 'app-1');
    expect(result.id).toBe('app-1');
    expect(ctx.memberships.findOne).not.toHaveBeenCalled();
  });

  it('loadForTeamGraduate returns for an accepted member', async () => {
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(GRAD);
    ctx.applications.findOne.mockResolvedValue({ id: 'app-1', graduateId: 'lead' });
    ctx.memberships.findOne.mockResolvedValue({ status: MembershipStatus.ACCEPTED });
    const result = await ctx.service.loadForTeamGraduate('u', 'app-1');
    expect(result.id).toBe('app-1');
  });

  it('loadForTeamGraduate forbids a non-member', async () => {
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(GRAD);
    ctx.applications.findOne.mockResolvedValue({ id: 'app-1', graduateId: 'lead' });
    ctx.memberships.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.loadForTeamGraduate('u', 'app-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('loadForOwningCompany returns the application for the owning company', async () => {
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(COMPANY);
    ctx.applications.findOne.mockResolvedValue({
      id: 'app-1',
      project: { companyId: COMPANY.id },
    });
    const { companyId } = await ctx.service.loadForOwningCompany('u', 'app-1');
    expect(companyId).toBe(COMPANY.id);
  });

  it('loadForOwningCompany forbids a non-owning company', async () => {
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(COMPANY);
    ctx.applications.findOne.mockResolvedValue({
      id: 'app-1',
      project: { companyId: 'other-co' },
    });
    await expect(
      ctx.service.loadForOwningCompany('u', 'app-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
