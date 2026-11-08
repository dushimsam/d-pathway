import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityType } from '../../../common/enums/index.js';
import { mockRepo } from '../../../test/mock-repo.js';
import { ActivityService } from './activity.service.js';

function make() {
  const activities = mockRepo();
  const companies = { getByUserIdOrThrow: vi.fn() };
  const graduates = { getByUserIdOrThrow: vi.fn() };
  const service = new ActivityService(
    activities as never,
    companies as never,
    graduates as never,
  );
  return { service, activities, companies, graduates };
}

beforeEach(() => vi.clearAllMocks());

describe('ActivityService.record', () => {
  it('persists an activity row with meta', async () => {
    const ctx = make();
    const input = {
      type: ActivityType.PRIZE_AWARDED,
      message: 'Won',
      companyId: 'c1',
      graduateId: null,
      projectId: 'p1',
      meta: { amount: 100 },
    };
    const result = await ctx.service.record(input);
    expect(ctx.activities.create).toHaveBeenCalledWith({
      type: ActivityType.PRIZE_AWARDED,
      message: 'Won',
      companyId: 'c1',
      graduateId: null,
      projectId: 'p1',
      meta: { amount: 100 },
    });
    expect(ctx.activities.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('defaults missing meta to null', async () => {
    const ctx = make();
    await ctx.service.record({
      type: ActivityType.APPLICATION_ACCEPTED,
      message: 'm',
      companyId: null,
      graduateId: 'g1',
      projectId: null,
    });
    expect(ctx.activities.create).toHaveBeenCalledWith(
      expect.objectContaining({ meta: null }),
    );
  });
});

describe('ActivityService.feedForUser', () => {
  it('returns company-scoped activity for a company user', async () => {
    const ctx = make();
    ctx.companies.getByUserIdOrThrow.mockResolvedValue({ id: 'c1' });
    ctx.activities.find.mockResolvedValue([{ id: 'a1' }]);
    const result = await ctx.service.feedForUser({ id: 'u1', role: 'COMPANY' });
    expect(ctx.companies.getByUserIdOrThrow).toHaveBeenCalledWith('u1');
    expect(ctx.activities.find).toHaveBeenCalledWith({
      where: { companyId: 'c1' },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    expect(result).toEqual([{ id: 'a1' }]);
  });

  it('returns graduate-scoped activity for a non-company user', async () => {
    const ctx = make();
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue({ id: 'g1' });
    ctx.activities.find.mockResolvedValue([{ id: 'a2' }]);
    const result = await ctx.service.feedForUser({ id: 'u2', role: 'GRADUATE' });
    expect(ctx.graduates.getByUserIdOrThrow).toHaveBeenCalledWith('u2');
    expect(ctx.activities.find).toHaveBeenCalledWith({
      where: { graduateId: 'g1' },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    expect(result).toEqual([{ id: 'a2' }]);
  });
});
