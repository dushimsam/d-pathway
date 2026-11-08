import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus } from '../../../common/enums/index.js';
import { mockRepo } from '../../../test/mock-repo.js';
import { ReviewsService } from './reviews.service.js';

function make() {
  const reviews = mockRepo();
  const applications = mockRepo();
  const projects = mockRepo();
  const graduates = mockRepo();
  const service = new ReviewsService(
    reviews as never,
    applications as never,
    projects as never,
    graduates as never,
  );
  return { service, reviews, applications, projects, graduates };
}

const GRAD = { id: 'grad-1', userId: 'user-1' };
const PROJECT = { id: 'proj-1', companyId: 'co-1' };

describe('ReviewsService.create', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.graduates.findOne.mockResolvedValue(GRAD);
    ctx.projects.findOne.mockResolvedValue(PROJECT);
    ctx.applications.findOne.mockResolvedValue({ id: 'app-1' });
    ctx.reviews.findOne.mockResolvedValue(null);
  });

  it('creates a review for an accepted brief and trims the comment', async () => {
    const result = await ctx.service.create('user-1', {
      projectId: 'proj-1',
      rating: 5,
      comment: '  great team  ',
    });
    expect(ctx.reviews.create).toHaveBeenCalledWith({
      companyId: 'co-1',
      graduateId: 'grad-1',
      projectId: 'proj-1',
      rating: 5,
      comment: 'great team',
    });
    expect(ctx.reviews.save).toHaveBeenCalled();
    expect(result.comment).toBe('great team');
  });

  it('stores null when the comment is blank or omitted', async () => {
    const result = await ctx.service.create('user-1', {
      projectId: 'proj-1',
      rating: 4,
      comment: '   ',
    });
    expect(result.comment).toBeNull();
  });

  it('404s when the graduate profile is missing', async () => {
    ctx.graduates.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.create('user-1', { projectId: 'proj-1', rating: 5 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404s when the project is missing', async () => {
    ctx.projects.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.create('user-1', { projectId: 'proj-1', rating: 5 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('forbids reviewing a brief the graduate was not accepted on', async () => {
    ctx.applications.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.create('user-1', { projectId: 'proj-1', rating: 5 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('conflicts on a duplicate review for the same brief', async () => {
    ctx.reviews.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      ctx.service.create('user-1', { projectId: 'proj-1', rating: 5 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('queries the accepted application with the right filter', async () => {
    await ctx.service.create('user-1', { projectId: 'proj-1', rating: 3 });
    expect(ctx.applications.findOne).toHaveBeenCalledWith({
      where: {
        projectId: 'proj-1',
        graduateId: 'grad-1',
        status: ApplicationStatus.ACCEPTED,
      },
    });
  });
});

describe('ReviewsService.listMine', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('maps the graduate reviews to project/rating pairs', async () => {
    ctx.graduates.findOne.mockResolvedValue(GRAD);
    ctx.reviews.find.mockResolvedValue([
      { projectId: 'p1', rating: 5 },
      { projectId: 'p2', rating: 2 },
    ]);
    const result = await ctx.service.listMine('user-1');
    expect(result).toEqual([
      { projectId: 'p1', rating: 5 },
      { projectId: 'p2', rating: 2 },
    ]);
  });

  it('returns an empty list when the graduate has no profile', async () => {
    ctx.graduates.findOne.mockResolvedValue(null);
    expect(await ctx.service.listMine('nobody')).toEqual([]);
    expect(ctx.reviews.find).not.toHaveBeenCalled();
  });
});

describe('ReviewsService.listForCompany', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('computes the aggregate average and maps items with relation fallbacks', async () => {
    const createdAt = new Date('2026-02-02');
    ctx.reviews.find.mockResolvedValue([
      {
        id: 'r1',
        rating: 5,
        comment: 'Loved it',
        graduate: { fullName: 'Grace' },
        project: { title: 'Brief A' },
        createdAt,
      },
      {
        id: 'r2',
        rating: 4,
        comment: null,
        graduate: null,
        project: null,
        createdAt,
      },
    ]);
    const result = await ctx.service.listForCompany('co-1');
    expect(result.summary.count).toBe(2);
    expect(result.summary.average).toBe(4.5);
    expect(result.items[0].graduateName).toBe('Grace');
    expect(result.items[0].projectTitle).toBe('Brief A');
    // Fallbacks when relations are absent.
    expect(result.items[1].graduateName).toBe('A graduate');
    expect(result.items[1].projectTitle).toBe('A brief');
  });

  it('returns a zero average for a company with no reviews', async () => {
    ctx.reviews.find.mockResolvedValue([]);
    const result = await ctx.service.listForCompany('co-1');
    expect(result.summary).toEqual({ average: 0, count: 0 });
    expect(result.items).toHaveLength(0);
  });
});

describe('ReviewsService.summaryFor', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('returns an empty map when no company ids are given', async () => {
    const result = await ctx.service.summaryFor([]);
    expect(result.size).toBe(0);
    expect(ctx.reviews.find).not.toHaveBeenCalled();
  });

  it('aggregates average and count per company', async () => {
    ctx.reviews.find.mockResolvedValue([
      { companyId: 'a', rating: 5 },
      { companyId: 'a', rating: 4 },
      { companyId: 'b', rating: 3 },
    ]);
    const result = await ctx.service.summaryFor(['a', 'b']);
    expect(result.get('a')).toEqual({ average: 4.5, count: 2 });
    expect(result.get('b')).toEqual({ average: 3, count: 1 });
  });
});
