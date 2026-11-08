import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApplicationStatus,
  EvaluationOutcome,
  ProjectStatus,
} from '../../../common/enums/index.js';
import { mockRepo } from '../../../test/mock-repo.js';
import { DashboardsService } from './dashboards.service.js';

/** A chainable query-builder mock whose terminal method returns `result`. */
function makeQb(terminal: 'getRawMany' | 'getCount', result: unknown) {
  const builder: Record<string, unknown> = {};
  for (const m of [
    'innerJoin',
    'leftJoin',
    'where',
    'andWhere',
    'select',
    'addSelect',
    'orderBy',
  ]) {
    builder[m] = vi.fn(() => builder);
  }
  builder[terminal] = vi.fn(async () => result);
  return builder;
}

function make() {
  const deliverables = mockRepo();
  const evaluations = mockRepo();
  const applications = { listMine: vi.fn() };
  const projects = { listMine: vi.fn() };
  const companies = { getByUserIdOrThrow: vi.fn() };
  const service = new DashboardsService(
    deliverables as never,
    evaluations as never,
    applications as never,
    projects as never,
    companies as never,
  );
  return { service, deliverables, evaluations, applications, projects, companies };
}

describe('DashboardsService.graduate', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('tallies statuses and surfaces evaluations and interview invitations', async () => {
    ctx.applications.listMine.mockResolvedValue([
      {
        status: ApplicationStatus.PENDING,
        project: { title: 'P1', company: { name: 'C1' } },
        evaluation: null,
      },
      {
        status: ApplicationStatus.ACCEPTED,
        project: { title: 'P2', company: { name: 'C2' } },
        evaluation: {
          score: 8,
          outcome: EvaluationOutcome.SELECTED_FOR_INTERVIEW,
          feedback: 'nice',
          evaluatedAt: new Date(),
        },
      },
      {
        status: ApplicationStatus.DECLINED,
        project: { title: 'P3', company: { name: 'C3' } },
        evaluation: {
          score: 3,
          outcome: EvaluationOutcome.NOT_SELECTED,
          feedback: 'no',
          evaluatedAt: new Date(),
        },
      },
    ]);

    const result = (await ctx.service.graduate('u')) as {
      applicationsByStatus: Record<string, number>;
      evaluations: unknown[];
      invitations: Array<{ outcome: string }>;
      applications: unknown[];
    };

    expect(result.applicationsByStatus[ApplicationStatus.PENDING]).toBe(1);
    expect(result.applicationsByStatus[ApplicationStatus.ACCEPTED]).toBe(1);
    expect(result.applicationsByStatus[ApplicationStatus.DECLINED]).toBe(1);
    expect(result.evaluations).toHaveLength(2);
    expect(result.invitations).toHaveLength(1);
    expect(result.invitations[0].outcome).toBe(
      EvaluationOutcome.SELECTED_FOR_INTERVIEW,
    );
    expect(result.applications).toHaveLength(3);
  });

  it('counts a status that is not a known enum key', async () => {
    ctx.applications.listMine.mockResolvedValue([
      {
        status: 'ARCHIVED' as unknown as ApplicationStatus,
        project: { title: 'P', company: { name: 'C' } },
        evaluation: null,
      },
    ]);
    const result = (await ctx.service.graduate('u')) as {
      applicationsByStatus: Record<string, number>;
    };
    expect(result.applicationsByStatus['ARCHIVED']).toBe(1);
  });

  it('handles a graduate with no applications', async () => {
    ctx.applications.listMine.mockResolvedValue([]);
    const result = (await ctx.service.graduate('u')) as {
      applicationsByStatus: Record<string, number>;
      evaluations: unknown[];
      invitations: unknown[];
    };
    // every status key present and zeroed
    expect(result.applicationsByStatus[ApplicationStatus.PENDING]).toBe(0);
    expect(result.applicationsByStatus[ApplicationStatus.ACCEPTED]).toBe(0);
    expect(result.applicationsByStatus[ApplicationStatus.DECLINED]).toBe(0);
    expect(result.evaluations).toHaveLength(0);
    expect(result.invitations).toHaveLength(0);
  });
});

describe('DashboardsService.company', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue({ id: 'co-1' });
  });

  it('summarizes projects, pending applications, review and evaluation load', async () => {
    ctx.projects.listMine.mockResolvedValue([
      {
        status: ProjectStatus.OPEN,
        applicationCounts: { [ApplicationStatus.PENDING]: 3 },
      },
      {
        status: ProjectStatus.CLOSED,
        applicationCounts: {},
      },
    ]);
    const awaiting = [
      {
        deliverableId: 'd1',
        submittedAt: new Date(),
        projectId: 'p1',
        projectTitle: 'P1',
        graduateName: 'Grad',
      },
    ];
    ctx.deliverables.createQueryBuilder.mockReturnValue(
      makeQb('getRawMany', awaiting),
    );
    ctx.evaluations.createQueryBuilder.mockReturnValue(makeQb('getCount', 5));

    const result = (await ctx.service.company('u')) as {
      projects: unknown[];
      summary: {
        projectsByStatus: Record<string, number>;
        pendingApplications: number;
        deliverablesAwaitingEvaluation: number;
        invitationsIssued: number;
      };
      awaitingEvaluation: unknown[];
    };

    expect(result.projects).toHaveLength(2);
    expect(result.summary.projectsByStatus[ProjectStatus.OPEN]).toBe(1);
    expect(result.summary.projectsByStatus[ProjectStatus.CLOSED]).toBe(1);
    expect(result.summary.projectsByStatus[ProjectStatus.DRAFT]).toBe(0);
    expect(result.summary.pendingApplications).toBe(3);
    expect(result.summary.deliverablesAwaitingEvaluation).toBe(1);
    expect(result.summary.invitationsIssued).toBe(5);
    expect(result.awaitingEvaluation).toEqual(awaiting);
  });

  it('defaults pending count to zero when a project has no pending bucket', async () => {
    ctx.projects.listMine.mockResolvedValue([
      { status: ProjectStatus.DRAFT, applicationCounts: {} },
    ]);
    ctx.deliverables.createQueryBuilder.mockReturnValue(
      makeQb('getRawMany', []),
    );
    ctx.evaluations.createQueryBuilder.mockReturnValue(makeQb('getCount', 0));

    const result = (await ctx.service.company('u')) as {
      summary: { pendingApplications: number; deliverablesAwaitingEvaluation: number };
    };
    expect(result.summary.pendingApplications).toBe(0);
    expect(result.summary.deliverablesAwaitingEvaluation).toBe(0);
  });
});
