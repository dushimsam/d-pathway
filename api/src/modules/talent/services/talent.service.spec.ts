import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { mockRepo } from '../../../test/mock-repo.js';
import { TalentService } from './talent.service.js';

/** Build a chainable query-builder mock with configurable terminal methods. */
function qb(overrides: Record<string, unknown> = {}) {
  return {
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    addSelect: vi.fn().mockReturnThis(),
    setParameter: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
    getRawMany: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function make() {
  const graduates = mockRepo();
  const evaluations = mockRepo();
  const projects = mockRepo();
  const service = new TalentService(
    graduates as never,
    evaluations as never,
    projects as never,
  );
  return { service, graduates, evaluations, projects };
}

const GRAD_ROW = {
  id: 'g1',
  fullName: 'Ada Lovelace',
  education: 'ALU',
  location: 'Kigali',
  skills: ['typescript'],
  photoUrl: 'photo.png',
  links: { github: 'x' },
};

describe('TalentService.search', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('returns paginated items enriched with real stats and applies the skill filter', async () => {
    const searchQb = qb({
      getManyAndCount: vi
        .fn()
        .mockResolvedValue([[GRAD_ROW, { ...GRAD_ROW, id: 'g2' }], 2]),
    });
    ctx.graduates.createQueryBuilder.mockReturnValue(searchQb);

    // statsFor: evaluations grouped rows (g1 has avg, g2 avg null) + prize rows.
    ctx.evaluations.createQueryBuilder.mockReturnValue(
      qb({
        getRawMany: vi.fn().mockResolvedValue([
          { gid: 'g1', completed: '3', avg: '4.25', selected: '2' },
          { gid: 'g2', completed: '1', avg: null, selected: '0' },
        ]),
      }),
    );
    ctx.projects.createQueryBuilder.mockReturnValue(
      qb({
        getRawMany: vi
          .fn()
          .mockResolvedValue([{ gid: 'g1', wins: '1', total: '500' }]),
      }),
    );

    const result = (await ctx.service.search({
      skill: '  TypeScript ',
      page: 2,
      pageSize: 5,
    })) as { items: Array<{ id: string; stats: Record<string, number> }>; total: number };

    expect(searchQb.skip).toHaveBeenCalledWith((2 - 1) * 5);
    expect(searchQb.take).toHaveBeenCalledWith(5);
    expect(searchQb.where).toHaveBeenCalledWith(':skill = ANY(g.skills)', {
      skill: 'typescript',
    });
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    const g1 = result.items.find((i) => i.id === 'g1')!;
    expect(g1.stats.briefsCompleted).toBe(3);
    expect(g1.stats.avgScore).toBe(4.3); // rounded to one decimal
    expect(g1.stats.interviewsSelected).toBe(2);
    expect(g1.stats.prizesWon).toBe(1);
    expect(g1.stats.prizeTotal).toBe(500);
    const g2 = result.items.find((i) => i.id === 'g2')!;
    expect(g2.stats.avgScore).toBe(0); // avg was null
    expect(g2.stats.prizesWon).toBe(0); // no prize row
  });

  it('defaults page/pageSize when missing or non-positive and skips the skill filter', async () => {
    const searchQb = qb({ getManyAndCount: vi.fn().mockResolvedValue([[], 0]) });
    ctx.graduates.createQueryBuilder.mockReturnValue(searchQb);

    const result = (await ctx.service.search({ page: 0, pageSize: -3 })) as {
      page: number;
      pageSize: number;
      items: unknown[];
      totalPages: number;
    };

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(12);
    expect(searchQb.skip).toHaveBeenCalledWith(0);
    expect(searchQb.take).toHaveBeenCalledWith(12);
    expect(searchQb.where).not.toHaveBeenCalled();
    expect(result.items).toHaveLength(0);
    // Empty rows => statsFor short-circuits, no eval/project query builders.
    expect(ctx.evaluations.createQueryBuilder).not.toHaveBeenCalled();
    expect(ctx.projects.createQueryBuilder).not.toHaveBeenCalled();
  });
});

describe('TalentService.profile', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('returns identity, mapped history and aggregate stats', async () => {
    ctx.graduates.findOne.mockResolvedValue(GRAD_ROW);

    const historyQb = qb({
      getRawMany: vi.fn().mockResolvedValue([
        {
          projectId: 'p1',
          projectTitle: 'Brief One',
          companyId: 'c1',
          companyName: 'Acme',
          score: '88',
          outcome: 'SELECTED_FOR_INTERVIEW',
          evaluatedAt: new Date('2026-01-01'),
        },
      ]),
    });
    const statsEvalQb = qb({
      getRawMany: vi
        .fn()
        .mockResolvedValue([
          { gid: 'g1', completed: '1', avg: '8.8', selected: '1' },
        ]),
    });
    ctx.evaluations.createQueryBuilder
      .mockReturnValueOnce(historyQb)
      .mockReturnValue(statsEvalQb);
    ctx.projects.createQueryBuilder.mockReturnValue(
      qb({ getRawMany: vi.fn().mockResolvedValue([]) }),
    );

    const result = (await ctx.service.profile('g1')) as {
      id: string;
      links: unknown;
      stats: { briefsCompleted: number };
      history: Array<{ score: number; projectTitle: string }>;
    };

    expect(result.id).toBe('g1');
    expect(result.links).toEqual({ github: 'x' });
    expect(result.stats.briefsCompleted).toBe(1);
    expect(result.history).toHaveLength(1);
    expect(result.history[0].score).toBe(88); // coerced to Number
    expect(result.history[0].projectTitle).toBe('Brief One');
  });

  it('throws NotFound when the student does not exist', async () => {
    ctx.graduates.findOne.mockResolvedValue(null);
    await expect(ctx.service.profile('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
