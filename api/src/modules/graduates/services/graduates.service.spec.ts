import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { mockRepo } from '../../../test/mock-repo.js';
import { GraduatesService } from './graduates.service.js';

function make() {
  const graduates = mockRepo();
  const service = new GraduatesService(graduates as never);
  return { service, graduates };
}

const GRAD = {
  id: 'grad-1',
  userId: 'user-1',
  fullName: 'Ada Lovelace',
  education: 'ALU',
  skills: ['react'],
  links: ['https://ada.dev'],
  location: 'Kigali',
  photoUrl: 'photo.png',
  photoPublicId: 'pub-1',
};

describe('GraduatesService.createForUser', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('creates a graduate, normalising skills', async () => {
    const result = await ctx.service.createForUser('user-1', {
      fullName: 'Ada',
      education: 'ALU',
      skills: ['  React ', 'NODE', '', '  '],
      links: ['https://ada.dev'],
      location: 'Kigali',
    });
    expect(ctx.graduates.create).toHaveBeenCalledWith({
      userId: 'user-1',
      fullName: 'Ada',
      education: 'ALU',
      skills: ['react', 'node'],
      links: ['https://ada.dev'],
      location: 'Kigali',
    });
    expect(ctx.graduates.save).toHaveBeenCalled();
    expect(result.fullName).toBe('Ada');
  });

  it('defaults optional fields', async () => {
    await ctx.service.createForUser('user-1', { fullName: 'Ada' });
    expect(ctx.graduates.create).toHaveBeenCalledWith({
      userId: 'user-1',
      fullName: 'Ada',
      education: null,
      skills: [],
      links: [],
      location: null,
    });
  });

  it('uses the supplied entity manager repository', async () => {
    const mgrRepo = mockRepo();
    const manager = { getRepository: vi.fn().mockReturnValue(mgrRepo) };
    await ctx.service.createForUser('user-1', { fullName: 'Ada' }, manager as never);
    expect(manager.getRepository).toHaveBeenCalled();
    expect(mgrRepo.save).toHaveBeenCalled();
    expect(ctx.graduates.save).not.toHaveBeenCalled();
  });
});

describe('GraduatesService reads', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('findByUserId delegates to the repo', async () => {
    ctx.graduates.findOne.mockResolvedValue({ ...GRAD });
    const result = await ctx.service.findByUserId('user-1');
    expect(result).toMatchObject({ id: 'grad-1' });
    expect(ctx.graduates.findOne).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('findById delegates to the repo', async () => {
    ctx.graduates.findOne.mockResolvedValue({ ...GRAD });
    const result = await ctx.service.findById('grad-1');
    expect(result).toMatchObject({ id: 'grad-1' });
    expect(ctx.graduates.findOne).toHaveBeenCalledWith({
      where: { id: 'grad-1' },
    });
  });

  it('findByEmail lowercases and trims the email', async () => {
    ctx.graduates.findOne.mockResolvedValue({ ...GRAD });
    await ctx.service.findByEmail('  ADA@Example.com ');
    expect(ctx.graduates.findOne).toHaveBeenCalledWith({
      where: { user: { email: 'ada@example.com' } },
      relations: { user: true },
    });
  });

  it('getByUserIdOrThrow returns the graduate', async () => {
    ctx.graduates.findOne.mockResolvedValue({ ...GRAD });
    expect(await ctx.service.getByUserIdOrThrow('user-1')).toMatchObject({
      id: 'grad-1',
    });
  });

  it('getByUserIdOrThrow 404s when missing', async () => {
    ctx.graduates.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.getByUserIdOrThrow('nope'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('GraduatesService.updateMe', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.graduates.findOne.mockResolvedValue({ ...GRAD });
  });

  it('updates every provided field', async () => {
    const result = await ctx.service.updateMe('user-1', {
      fullName: 'Grace',
      education: 'MIT',
      skills: [' GO ', 'Rust'],
      links: ['https://grace.dev'],
      location: 'Boston',
      photoUrl: 'new.png',
      photoPublicId: 'new-pub',
    } as never);
    expect(result.fullName).toBe('Grace');
    expect(result.education).toBe('MIT');
    expect(result.skills).toEqual(['go', 'rust']);
    expect(result.links).toEqual(['https://grace.dev']);
    expect(result.location).toBe('Boston');
    expect(result.photoUrl).toBe('new.png');
    expect(result.photoPublicId).toBe('new-pub');
    expect(ctx.graduates.save).toHaveBeenCalled();
  });

  it('nulls out blank photo fields', async () => {
    const result = await ctx.service.updateMe('user-1', {
      photoUrl: '',
      photoPublicId: '',
    } as never);
    expect(result.photoUrl).toBeNull();
    expect(result.photoPublicId).toBeNull();
  });

  it('leaves fields untouched when dto is empty', async () => {
    const result = await ctx.service.updateMe('user-1', {} as never);
    expect(result).toMatchObject({ id: 'grad-1', fullName: 'Ada Lovelace' });
  });

  it('propagates the 404 when the graduate is missing', async () => {
    ctx.graduates.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.updateMe('nope', {} as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
