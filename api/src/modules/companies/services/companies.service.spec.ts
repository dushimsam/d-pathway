import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from '../../../common/enums/index.js';
import { mockRepo } from '../../../test/mock-repo.js';
import { CompaniesService } from './companies.service.js';

function make() {
  const companies = mockRepo();
  const projects = mockRepo();
  const reviews = { summaryFor: vi.fn() };
  const service = new CompaniesService(
    companies as never,
    projects as never,
    reviews as never,
  );
  return { service, companies, projects, reviews };
}

const COMPANY = {
  id: 'co-1',
  userId: 'user-1',
  name: 'Acme',
  industry: 'Tech',
  description: 'desc',
  logoUrl: 'logo.png',
  logoPublicId: 'pub-1',
  website: 'https://acme.io',
  location: 'Kigali',
  size: '10-50',
  representativeTitle: 'CEO',
};

describe('CompaniesService.createForUser', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('creates a company when the name is free', async () => {
    ctx.companies.findOne.mockResolvedValue(null);
    const result = await ctx.service.createForUser('user-1', {
      name: 'Acme',
      industry: 'Tech',
      representativeTitle: 'CEO',
    });
    expect(ctx.companies.create).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Acme',
      industry: 'Tech',
      representativeTitle: 'CEO',
      description: null,
    });
    expect(ctx.companies.save).toHaveBeenCalled();
    expect(result.name).toBe('Acme');
  });

  it('defaults optional fields to null', async () => {
    ctx.companies.findOne.mockResolvedValue(null);
    await ctx.service.createForUser('user-1', { name: 'Acme' });
    expect(ctx.companies.create).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Acme',
      industry: null,
      representativeTitle: null,
      description: null,
    });
  });

  it('rejects a duplicate company name', async () => {
    ctx.companies.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      ctx.service.createForUser('user-1', { name: 'Acme' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('uses the supplied entity manager repository when provided', async () => {
    const mgrRepo = mockRepo();
    mgrRepo.findOne.mockResolvedValue(null);
    const manager = { getRepository: vi.fn().mockReturnValue(mgrRepo) };
    await ctx.service.createForUser('user-1', { name: 'Acme' }, manager as never);
    expect(manager.getRepository).toHaveBeenCalled();
    expect(mgrRepo.save).toHaveBeenCalled();
    expect(ctx.companies.save).not.toHaveBeenCalled();
  });
});

describe('CompaniesService reads', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('findByUserId delegates to the repo', async () => {
    ctx.companies.findOne.mockResolvedValue({ ...COMPANY });
    const result = await ctx.service.findByUserId('user-1');
    expect(result).toMatchObject({ id: 'co-1' });
    expect(ctx.companies.findOne).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('getByUserIdOrThrow returns the company', async () => {
    ctx.companies.findOne.mockResolvedValue({ ...COMPANY });
    expect(await ctx.service.getByUserIdOrThrow('user-1')).toMatchObject({
      id: 'co-1',
    });
  });

  it('getByUserIdOrThrow 404s when missing', async () => {
    ctx.companies.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.getByUserIdOrThrow('nope'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findById delegates to the repo', async () => {
    ctx.companies.findOne.mockResolvedValue({ ...COMPANY });
    const result = await ctx.service.findById('co-1');
    expect(result).toMatchObject({ id: 'co-1' });
    expect(ctx.companies.findOne).toHaveBeenCalledWith({
      where: { id: 'co-1' },
    });
  });
});

describe('CompaniesService.updateMe', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.companies.findOne.mockResolvedValue({ ...COMPANY });
  });

  it('updates all provided fields', async () => {
    ctx.companies.findOne
      .mockResolvedValueOnce({ ...COMPANY }) // getByUserIdOrThrow
      .mockResolvedValueOnce(null); // name clash check
    const result = await ctx.service.updateMe('user-1', {
      name: 'NewName',
      industry: 'Finance',
      description: 'new desc',
      representativeTitle: 'CTO',
      logoUrl: 'new.png',
      logoPublicId: 'new-pub',
      website: 'https://new.io',
      location: 'Nairobi',
      size: '50-100',
    } as never);
    expect(result.name).toBe('NewName');
    expect(result.industry).toBe('Finance');
    expect(result.description).toBe('new desc');
    expect(result.representativeTitle).toBe('CTO');
    expect(result.logoUrl).toBe('new.png');
    expect(result.website).toBe('https://new.io');
    expect(result.location).toBe('Nairobi');
    expect(result.size).toBe('50-100');
    expect(ctx.companies.save).toHaveBeenCalled();
  });

  it('nulls out blank optional string fields', async () => {
    const result = await ctx.service.updateMe('user-1', {
      logoUrl: '',
      logoPublicId: '',
      website: '',
      location: '',
      size: '',
    } as never);
    expect(result.logoUrl).toBeNull();
    expect(result.logoPublicId).toBeNull();
    expect(result.website).toBeNull();
    expect(result.location).toBeNull();
    expect(result.size).toBeNull();
  });

  it('rejects a conflicting name', async () => {
    ctx.companies.findOne
      .mockResolvedValueOnce({ ...COMPANY })
      .mockResolvedValueOnce({ id: 'other' });
    await expect(
      ctx.service.updateMe('user-1', { name: 'Taken' } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('ignores a blank name and an unchanged name', async () => {
    const result = await ctx.service.updateMe('user-1', {
      name: '   ',
    } as never);
    expect(result.name).toBe('Acme');
    // Only getByUserIdOrThrow ran — no clash lookup.
    expect(ctx.companies.findOne).toHaveBeenCalledTimes(1);
  });

  it('skips the clash check when name equals the current name', async () => {
    const result = await ctx.service.updateMe('user-1', {
      name: 'Acme',
    } as never);
    expect(result.name).toBe('Acme');
    expect(ctx.companies.findOne).toHaveBeenCalledTimes(1);
  });

  it('does nothing extra when dto is empty', async () => {
    const result = await ctx.service.updateMe('user-1', {} as never);
    expect(result).toMatchObject({ id: 'co-1' });
  });
});

describe('CompaniesService.getPublicProfile', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('returns the profile with projects and a rating', async () => {
    ctx.companies.findOne.mockResolvedValue({ ...COMPANY });
    ctx.projects.find.mockResolvedValue([
      {
        id: 'p1',
        title: 'Brief',
        requiredSkills: ['react'],
        prizeAmount: 100,
        prizeCurrency: 'USD',
        applicationDeadline: new Date(),
        coverImageUrl: 'cover.png',
      },
    ]);
    ctx.reviews.summaryFor.mockResolvedValue(
      new Map([['co-1', { average: 4.5, count: 3 }]]),
    );
    const result = (await ctx.service.getPublicProfile('co-1')) as {
      rating: { average: number };
      openProjects: unknown[];
    };
    expect(result.rating.average).toBe(4.5);
    expect(result.openProjects).toHaveLength(1);
    expect(ctx.projects.find).toHaveBeenCalledWith({
      where: { companyId: 'co-1', status: ProjectStatus.OPEN },
      order: { createdAt: 'DESC' },
      take: 24,
    });
  });

  it('defaults the rating when the summary has no entry', async () => {
    ctx.companies.findOne.mockResolvedValue({ ...COMPANY });
    ctx.projects.find.mockResolvedValue([]);
    ctx.reviews.summaryFor.mockResolvedValue(new Map());
    const result = (await ctx.service.getPublicProfile('co-1')) as {
      rating: { average: number; count: number };
    };
    expect(result.rating).toEqual({ average: 0, count: 0 });
  });

  it('404s when the company is missing', async () => {
    ctx.companies.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.getPublicProfile('nope'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
