import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  PrizeStatus,
  ProjectStatus,
} from '../../../common/enums/index.js';
import { mockRepo } from '../../../test/mock-repo.js';
import { ProjectsService } from './projects.service.js';

/** A chainable query-builder mock. All chain methods return the builder. */
function qbMock(opts: { raw?: unknown[]; manyAndCount?: [unknown[], number] } = {}) {
  const qb: Record<string, ReturnType<typeof vi.fn>> = {};
  const chain = [
    'select',
    'addSelect',
    'where',
    'andWhere',
    'groupBy',
    'addGroupBy',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
    'leftJoinAndSelect',
    'innerJoin',
  ];
  for (const m of chain) qb[m] = vi.fn(() => qb);
  qb.getRawMany = vi.fn(async () => opts.raw ?? []);
  qb.getManyAndCount = vi.fn(async () => opts.manyAndCount ?? [[], 0]);
  return qb;
}

function makeEm() {
  return {
    create: vi.fn((_entity: unknown, data: Record<string, unknown>) => ({ ...data })),
    save: vi.fn(async (e: Record<string, unknown>) => ({ ...e, id: e.id ?? 'generated-id' })),
    findOne: vi.fn(),
    delete: vi.fn(async () => ({ affected: 1 })),
  };
}

function make() {
  const projects = mockRepo();
  const applications = mockRepo();
  const companies = {
    getByUserIdOrThrow: vi.fn(),
    findById: vi.fn(),
  };
  const cache = {
    invalidatePrefix: vi.fn(async () => undefined),
  };
  const wallet = {
    holdPrize: vi.fn(async () => undefined),
    refundPrize: vi.fn(async () => undefined),
    releasePrize: vi.fn(async () => undefined),
  };
  const em = makeEm();
  const dataSource = {
    transaction: vi.fn(async (cb: (m: unknown) => unknown) => cb(em)),
  };
  const events = {
    prizeAwarded: vi.fn(async () => undefined),
  };
  const service = new ProjectsService(
    projects as never,
    applications as never,
    companies as never,
    cache as never,
    wallet as never,
    dataSource as never,
    events as never,
  );
  return { service, projects, applications, companies, cache, wallet, em, dataSource, events };
}

const CO = { id: 'co-1', name: 'Acme', industry: 'Tech' };

const future = () => new Date(Date.now() + 86_400_000);
const past = () => new Date(Date.now() - 86_400_000);

function draftProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    companyId: CO.id,
    title: 'Build a thing',
    brief: 'A detailed brief',
    requiredSkills: ['react'],
    applicationDeadline: future(),
    submissionDeadline: new Date(Date.now() + 172_800_000),
    deliverableFormat: 'PDF',
    ipTerms: 'MIT',
    prizeAmount: null as number | null,
    prizeCurrency: null as string | null,
    prizeStatus: null as PrizeStatus | null,
    coverImageUrl: null,
    coverImagePublicId: null,
    status: ProjectStatus.DRAFT,
    publishedAt: null,
    winnerGraduateId: null,
    ...overrides,
  };
}

describe('ProjectsService.findByIdOrThrow', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => (ctx = make()));

  it('returns the project when found', async () => {
    const p = draftProject();
    ctx.projects.findOne.mockResolvedValue(p);
    expect(await ctx.service.findByIdOrThrow('p1')).toBe(p);
  });

  it('404s when missing', async () => {
    ctx.projects.findOne.mockResolvedValue(null);
    await expect(ctx.service.findByIdOrThrow('p1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('ProjectsService.assertOwnedByCompany', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => (ctx = make()));

  it('passes when owned', () => {
    expect(() =>
      ctx.service.assertOwnedByCompany(draftProject() as never, CO.id),
    ).not.toThrow();
  });

  it('forbids when not owned', () => {
    expect(() =>
      ctx.service.assertOwnedByCompany(draftProject() as never, 'other'),
    ).toThrow(ForbiddenException);
  });
});

describe('ProjectsService.save', () => {
  it('delegates to the repository', async () => {
    const ctx = make();
    const p = draftProject();
    ctx.projects.save.mockResolvedValue(p);
    expect(await ctx.service.save(p as never)).toBe(p);
    expect(ctx.projects.save).toHaveBeenCalledWith(p);
  });
});

describe('ProjectsService.ensureDeadlineTransition', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => (ctx = make()));

  it('flips an OPEN project whose deadline passed to IN_PROGRESS', async () => {
    const p = draftProject({ status: ProjectStatus.OPEN, applicationDeadline: past() });
    ctx.projects.save.mockImplementation(async (e: unknown) => e);
    const result = await ctx.service.ensureDeadlineTransition(p as never);
    expect(result.status).toBe(ProjectStatus.IN_PROGRESS);
    expect(ctx.projects.save).toHaveBeenCalled();
    expect(ctx.cache.invalidatePrefix).toHaveBeenCalled();
  });

  it('leaves an OPEN project with a future deadline untouched', async () => {
    const p = draftProject({ status: ProjectStatus.OPEN, applicationDeadline: future() });
    const result = await ctx.service.ensureDeadlineTransition(p as never);
    expect(result.status).toBe(ProjectStatus.OPEN);
    expect(ctx.projects.save).not.toHaveBeenCalled();
  });

  it('leaves a non-OPEN project untouched', async () => {
    const p = draftProject({ status: ProjectStatus.DRAFT, applicationDeadline: past() });
    const result = await ctx.service.ensureDeadlineTransition(p as never);
    expect(result.status).toBe(ProjectStatus.DRAFT);
    expect(ctx.projects.save).not.toHaveBeenCalled();
  });
});

describe('ProjectsService.create', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(CO);
  });

  const baseDto = () => ({
    title: 'T',
    brief: 'B',
    requiredSkills: [' React ', 'node', ''],
    applicationDeadline: future().toISOString(),
    submissionDeadline: new Date(Date.now() + 172_800_000).toISOString(),
    deliverableFormat: 'PDF',
    ipTerms: 'MIT',
  });

  it('creates a prized project and escrows the prize', async () => {
    const dto = { ...baseDto(), prizeAmount: 100, prizeCurrency: 'USD' };
    const saved = await ctx.service.create('u1', dto as never);
    expect(saved.id).toBe('generated-id');
    expect(ctx.em.create).toHaveBeenCalled();
    expect(ctx.wallet.holdPrize).toHaveBeenCalledWith(
      ctx.em,
      CO.id,
      100,
      'generated-id',
      'T',
    );
    expect(ctx.cache.invalidatePrefix).toHaveBeenCalled();
    // normalised skills: trimmed, lowercased, blanks removed
    const createArg = ctx.em.create.mock.calls[0][1] as { requiredSkills: string[] };
    expect(createArg.requiredSkills).toEqual(['react', 'node']);
    expect((createArg as { prizeStatus: unknown }).prizeStatus).toBe(PrizeStatus.HELD);
  });

  it('defaults prize currency to RWF when omitted', async () => {
    const dto = { ...baseDto(), prizeAmount: 50 };
    await ctx.service.create('u1', dto as never);
    const createArg = ctx.em.create.mock.calls[0][1] as { prizeCurrency: string };
    expect(createArg.prizeCurrency).toBe('RWF');
  });

  it('creates a non-prized project without escrow', async () => {
    const dto = baseDto();
    await ctx.service.create('u1', dto as never);
    expect(ctx.wallet.holdPrize).not.toHaveBeenCalled();
    const createArg = ctx.em.create.mock.calls[0][1] as {
      prizeAmount: unknown;
      prizeStatus: unknown;
    };
    expect(createArg.prizeAmount).toBeNull();
    expect(createArg.prizeStatus).toBeNull();
  });
});

describe('ProjectsService.update', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(CO);
  });

  it('404s when the project is missing', async () => {
    ctx.em.findOne.mockResolvedValue(null);
    await expect(ctx.service.update('u1', 'p1', {} as never)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('forbids updating a project owned by another company', async () => {
    ctx.em.findOne.mockResolvedValue(draftProject({ companyId: 'other' }));
    await expect(ctx.service.update('u1', 'p1', {} as never)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects editing a non-DRAFT project', async () => {
    ctx.em.findOne.mockResolvedValue(draftProject({ status: ProjectStatus.OPEN }));
    await expect(ctx.service.update('u1', 'p1', {} as never)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('updates editable fields', async () => {
    ctx.em.findOne.mockResolvedValue(draftProject());
    const dto = {
      title: 'New',
      brief: 'New brief',
      requiredSkills: [' Go '],
      applicationDeadline: future().toISOString(),
      submissionDeadline: new Date(Date.now() + 200_000_000).toISOString(),
      deliverableFormat: 'DOC',
      ipTerms: 'GPL',
      coverImageUrl: 'http://x/y.png',
      coverImagePublicId: 'pub-1',
    };
    const saved = await ctx.service.update('u1', 'p1', dto as never);
    expect(saved.title).toBe('New');
    expect(saved.requiredSkills).toEqual(['go']);
    expect(saved.coverImageUrl).toBe('http://x/y.png');
    expect(ctx.cache.invalidatePrefix).toHaveBeenCalled();
  });

  it('re-escrows when the prize amount changes (refund old, hold new)', async () => {
    ctx.em.findOne.mockResolvedValue(
      draftProject({ prizeStatus: PrizeStatus.HELD, prizeAmount: 50, prizeCurrency: 'RWF' }),
    );
    const saved = await ctx.service.update('u1', 'p1', {
      prizeAmount: 100,
      prizeCurrency: 'USD',
    } as never);
    expect(ctx.wallet.refundPrize).toHaveBeenCalledWith(ctx.em, CO.id, 50, 'p1', 'Build a thing');
    expect(ctx.wallet.holdPrize).toHaveBeenCalledWith(ctx.em, CO.id, 100, 'p1', 'Build a thing');
    expect(saved.prizeAmount).toBe(100);
    expect(saved.prizeCurrency).toBe('USD');
    expect(saved.prizeStatus).toBe(PrizeStatus.HELD);
  });

  it('refunds and clears the prize when set to zero', async () => {
    ctx.em.findOne.mockResolvedValue(
      draftProject({ prizeStatus: PrizeStatus.HELD, prizeAmount: 50 }),
    );
    const saved = await ctx.service.update('u1', 'p1', { prizeAmount: 0 } as never);
    expect(ctx.wallet.refundPrize).toHaveBeenCalled();
    expect(ctx.wallet.holdPrize).not.toHaveBeenCalled();
    expect(saved.prizeAmount).toBeNull();
    expect(saved.prizeStatus).toBeNull();
    expect(saved.prizeCurrency).toBeNull();
  });

  it('holds a new prize on a previously unprized project', async () => {
    ctx.em.findOne.mockResolvedValue(draftProject({ prizeStatus: null, prizeAmount: null }));
    const saved = await ctx.service.update('u1', 'p1', { prizeAmount: 75 } as never);
    expect(ctx.wallet.refundPrize).not.toHaveBeenCalled();
    expect(ctx.wallet.holdPrize).toHaveBeenCalledWith(ctx.em, CO.id, 75, 'p1', 'Build a thing');
    expect(saved.prizeAmount).toBe(75);
    // currency falls back to RWF when neither dto nor existing supplies it
    expect(saved.prizeCurrency).toBe('RWF');
  });

  it('treats a HELD project with a null amount as zero held', async () => {
    ctx.em.findOne.mockResolvedValue(
      draftProject({ prizeStatus: PrizeStatus.HELD, prizeAmount: null }),
    );
    const saved = await ctx.service.update('u1', 'p1', { prizeAmount: 90 } as never);
    expect(ctx.wallet.refundPrize).not.toHaveBeenCalled();
    expect(ctx.wallet.holdPrize).toHaveBeenCalledWith(ctx.em, CO.id, 90, 'p1', 'Build a thing');
    expect(saved.prizeAmount).toBe(90);
  });

  it('makes no wallet moves when the prize is unchanged', async () => {
    ctx.em.findOne.mockResolvedValue(
      draftProject({ prizeStatus: PrizeStatus.HELD, prizeAmount: 50, prizeCurrency: 'RWF' }),
    );
    const saved = await ctx.service.update('u1', 'p1', { prizeAmount: 50 } as never);
    expect(ctx.wallet.refundPrize).not.toHaveBeenCalled();
    expect(ctx.wallet.holdPrize).not.toHaveBeenCalled();
    expect(saved.prizeAmount).toBe(50);
  });
});

describe('ProjectsService.publish', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(CO);
  });

  it('publishes a valid DRAFT', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject());
    ctx.projects.save.mockImplementation(async (e: unknown) => e);
    const saved = await ctx.service.publish('u1', 'p1');
    expect(saved.status).toBe(ProjectStatus.OPEN);
    expect(saved.publishedAt).toBeInstanceOf(Date);
    expect(ctx.cache.invalidatePrefix).toHaveBeenCalled();
  });

  it('forbids a non-owner', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject({ companyId: 'other' }));
    await expect(ctx.service.publish('u1', 'p1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects publishing a non-DRAFT', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject({ status: ProjectStatus.OPEN }));
    await expect(ctx.service.publish('u1', 'p1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects publishing when the brief is empty', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject({ brief: '   ' }));
    await expect(ctx.service.publish('u1', 'p1')).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('ProjectsService.close', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(CO);
  });

  it('closes an IN_PROGRESS project', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject({ status: ProjectStatus.IN_PROGRESS }));
    ctx.projects.save.mockImplementation(async (e: unknown) => e);
    const saved = await ctx.service.close('u1', 'p1');
    expect(saved.status).toBe(ProjectStatus.CLOSED);
    expect(ctx.cache.invalidatePrefix).toHaveBeenCalled();
  });

  it('forbids a non-owner', async () => {
    ctx.projects.findOne.mockResolvedValue(
      draftProject({ status: ProjectStatus.IN_PROGRESS, companyId: 'other' }),
    );
    await expect(ctx.service.close('u1', 'p1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects closing a non-IN_PROGRESS project', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject({ status: ProjectStatus.OPEN }));
    await expect(ctx.service.close('u1', 'p1')).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('ProjectsService.remove', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(CO);
  });

  it('removes a project and refunds a held prize', async () => {
    ctx.projects.findOne.mockResolvedValue(
      draftProject({ prizeStatus: PrizeStatus.HELD, prizeAmount: 40 }),
    );
    ctx.applications.count.mockResolvedValue(0);
    const result = await ctx.service.remove('u1', 'p1');
    expect(result).toEqual({ id: 'p1' });
    expect(ctx.wallet.refundPrize).toHaveBeenCalledWith(ctx.em, CO.id, 40, 'p1', 'Build a thing');
    expect(ctx.em.delete).toHaveBeenCalled();
    expect(ctx.cache.invalidatePrefix).toHaveBeenCalled();
  });

  it('removes a project without a held prize (no refund)', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject({ prizeStatus: null, prizeAmount: null }));
    ctx.applications.count.mockResolvedValue(0);
    await ctx.service.remove('u1', 'p1');
    expect(ctx.wallet.refundPrize).not.toHaveBeenCalled();
    expect(ctx.em.delete).toHaveBeenCalled();
  });

  it('forbids a non-owner', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject({ companyId: 'other' }));
    await expect(ctx.service.remove('u1', 'p1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects deletion once an applicant is accepted', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject());
    ctx.applications.count.mockResolvedValue(1);
    await expect(ctx.service.remove('u1', 'p1')).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('ProjectsService.award', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(CO);
  });

  it('awards the prize to an accepted applicant and emits an event', async () => {
    ctx.em.findOne
      .mockResolvedValueOnce(draftProject({ prizeStatus: PrizeStatus.HELD, prizeAmount: 100 }))
      .mockResolvedValueOnce({ id: 'app-1', status: ApplicationStatus.ACCEPTED });
    ctx.companies.findById.mockResolvedValue({ name: 'Acme' });
    const saved = await ctx.service.award('u1', 'p1', 'grad-1');
    expect(ctx.wallet.releasePrize).toHaveBeenCalledWith(ctx.em, 'grad-1', 100, 'p1', 'Build a thing');
    expect(saved.prizeStatus).toBe(PrizeStatus.RELEASED);
    expect(saved.winnerGraduateId).toBe('grad-1');
    expect(saved.status).toBe(ProjectStatus.CLOSED);
    expect(ctx.events.prizeAwarded).toHaveBeenCalledWith(
      expect.objectContaining({ graduateId: 'grad-1', companyName: 'Acme', amount: 100 }),
    );
  });

  it('falls back to a generic company name and currency when company is missing', async () => {
    ctx.em.findOne
      .mockResolvedValueOnce(
        draftProject({ prizeStatus: PrizeStatus.HELD, prizeAmount: 100, prizeCurrency: null }),
      )
      .mockResolvedValueOnce({ id: 'app-1', status: ApplicationStatus.ACCEPTED });
    ctx.companies.findById.mockResolvedValue(null);
    await ctx.service.award('u1', 'p1', 'grad-1');
    expect(ctx.events.prizeAwarded).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: 'A company', currency: 'rwf' }),
    );
  });

  it('404s when the project is missing', async () => {
    ctx.em.findOne.mockResolvedValueOnce(null);
    await expect(ctx.service.award('u1', 'p1', 'g')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('forbids a non-owner', async () => {
    ctx.em.findOne.mockResolvedValueOnce(draftProject({ companyId: 'other' }));
    await expect(ctx.service.award('u1', 'p1', 'g')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects awarding when there is no held prize', async () => {
    ctx.em.findOne.mockResolvedValueOnce(draftProject({ prizeStatus: null, prizeAmount: null }));
    await expect(ctx.service.award('u1', 'p1', 'g')).rejects.toBeInstanceOf(ConflictException);
  });

  it('forbids awarding someone who is not an accepted applicant', async () => {
    ctx.em.findOne
      .mockResolvedValueOnce(draftProject({ prizeStatus: PrizeStatus.HELD, prizeAmount: 100 }))
      .mockResolvedValueOnce(null);
    await expect(ctx.service.award('u1', 'p1', 'g')).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('ProjectsService.listMine', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(CO);
  });

  it('returns owned projects with application counts (and transitions deadlines)', async () => {
    ctx.projects.find.mockResolvedValue([
      draftProject({ id: 'p1', status: ProjectStatus.OPEN, applicationDeadline: past() }),
      draftProject({ id: 'p2', status: ProjectStatus.DRAFT }),
    ]);
    ctx.projects.save.mockImplementation(async (e: unknown) => e);
    ctx.applications.createQueryBuilder.mockReturnValue(
      qbMock({ raw: [{ projectId: 'p1', status: 'PENDING', count: '3' }] }),
    );
    const result = await ctx.service.listMine('u1');
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe(ProjectStatus.IN_PROGRESS); // transitioned
    expect(result[0].applicationCounts).toEqual({ PENDING: 3 });
    expect(result[1].applicationCounts).toEqual({});
  });

  it('returns an empty list and skips the counts query when there are no projects', async () => {
    ctx.projects.find.mockResolvedValue([]);
    const result = await ctx.service.listMine('u1');
    expect(result).toEqual([]);
    expect(ctx.applications.createQueryBuilder).not.toHaveBeenCalled();
  });
});

describe('ProjectsService.catalogue', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => (ctx = make()));

  it('lists open projects with no filters', async () => {
    const qb = qbMock({ manyAndCount: [[draftProject()], 1] });
    ctx.projects.createQueryBuilder.mockReturnValue(qb);
    const result = await ctx.service.catalogue({ page: 1, pageSize: 10 });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(qb.andWhere).toHaveBeenCalledTimes(1); // only the deadline filter
  });

  it('applies company, skill and prize filters', async () => {
    const qb = qbMock({ manyAndCount: [[], 0] });
    ctx.projects.createQueryBuilder.mockReturnValue(qb);
    await ctx.service.catalogue({
      companyId: 'co-1',
      skill: ' React ',
      hasPrize: true,
      page: 2,
      pageSize: 5,
    });
    // deadline + companyId + skill + hasPrize
    expect(qb.andWhere).toHaveBeenCalledTimes(4);
    expect(qb.skip).toHaveBeenCalledWith(5);
    expect(qb.take).toHaveBeenCalledWith(5);
  });
});

describe('ProjectsService.companiesWithOpenProjects', () => {
  it('returns distinct companies with open projects', async () => {
    const ctx = make();
    const rows = [{ id: 'co-1', name: 'Acme', industry: 'Tech' }];
    ctx.projects.createQueryBuilder.mockReturnValue(qbMock({ raw: rows }));
    expect(await ctx.service.companiesWithOpenProjects()).toEqual(rows);
  });
});

describe('ProjectsService.getOneForUser', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(CO);
  });

  it('returns the project for the owning company', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject());
    const result = await ctx.service.getOneForUser({ id: 'u1', role: 'COMPANY' }, 'p1');
    expect(result.id).toBe('p1');
  });

  it('forbids a company that does not own the project', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject({ companyId: 'other' }));
    await expect(
      ctx.service.getOneForUser({ id: 'u1', role: 'COMPANY' }, 'p1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns a published project to a graduate', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject({ status: ProjectStatus.OPEN }));
    const result = await ctx.service.getOneForUser({ id: 'u2', role: 'GRADUATE' }, 'p1');
    expect(result.status).toBe(ProjectStatus.OPEN);
  });

  it('hides a non-published project from a graduate', async () => {
    ctx.projects.findOne.mockResolvedValue(draftProject({ status: ProjectStatus.DRAFT }));
    await expect(
      ctx.service.getOneForUser({ id: 'u2', role: 'GRADUATE' }, 'p1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
