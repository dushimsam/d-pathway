import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../../common/enums/index.js';
import { mockRepo } from '../../../test/mock-repo.js';

const { hash, compare } = vi.hoisted(() => ({
  hash: vi.fn(async () => 'hashed'),
  compare: vi.fn(async () => true),
}));

vi.mock('bcrypt', () => ({ default: { hash, compare } }));

import { AuthService } from './auth.service.js';

function make() {
  const users = mockRepo();
  const jwt = { sign: vi.fn(() => 'signed-token') };
  const graduates = {
    createForUser: vi.fn(async () => ({})),
    findByUserId: vi.fn(async () => ({ id: 'grad-1' })),
  };
  const companies = {
    createForUser: vi.fn(async () => ({})),
    findByUserId: vi.fn(async () => ({ id: 'co-1' })),
  };
  const managerRepo = {
    create: vi.fn((e: unknown) => e),
    save: vi.fn(async (e: Record<string, unknown>) => ({ id: 'user-1', ...e })),
  };
  const dataSource = {
    transaction: vi.fn(async (cb: (m: unknown) => unknown) =>
      cb({ getRepository: () => managerRepo }),
    ),
  };
  const service = new AuthService(
    users as never,
    dataSource as never,
    jwt as never,
    graduates as never,
    companies as never,
  );
  return { service, users, jwt, graduates, companies, dataSource, managerRepo };
}

beforeEach(() => {
  vi.clearAllMocks();
  hash.mockResolvedValue('hashed');
  compare.mockResolvedValue(true);
});

describe('AuthService.registerGraduate', () => {
  it('creates a graduate user and returns a token', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue(null); // email free
    const result = await ctx.service.registerGraduate({
      email: '  Test@Example.COM ',
      password: 'pw',
      fullName: 'Grad One',
      skills: ['a'],
    } as never);

    expect(hash).toHaveBeenCalledWith('pw', 10);
    expect(ctx.managerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com', role: UserRole.GRADUATE }),
    );
    expect(ctx.graduates.createForUser).toHaveBeenCalled();
    expect(result.accessToken).toBe('signed-token');
    expect(result.user).toEqual({ id: 'user-1', email: 'test@example.com', role: UserRole.GRADUATE });
  });

  it('passes nullable optional fields through', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue(null);
    await ctx.service.registerGraduate({
      email: 'a@b.com',
      password: 'pw',
      fullName: 'G',
      skills: ['x'],
      education: 'BSc',
      location: 'NYC',
    } as never);
    const arg = ctx.graduates.createForUser.mock.calls[0][1];
    expect(arg).toEqual({ fullName: 'G', education: 'BSc', skills: ['x'], location: 'NYC' });
  });

  it('rejects a taken email', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      ctx.service.registerGraduate({ email: 'a@b.com', password: 'pw', fullName: 'G', skills: [] } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('AuthService.registerCompany', () => {
  it('creates a company user and returns a token', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue(null);
    const result = await ctx.service.registerCompany({
      email: 'co@x.com',
      password: 'pw',
      companyName: '  Acme  ',
      industry: 'Tech',
      title: 'CEO',
    } as never);
    expect(ctx.companies.createForUser).toHaveBeenCalledWith(
      'user-1',
      { name: 'Acme', industry: 'Tech', representativeTitle: 'CEO' },
      expect.anything(),
    );
    expect(result.user.role).toBe(UserRole.COMPANY);
  });

  it('defaults optional company fields to null', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue(null);
    await ctx.service.registerCompany({
      email: 'co@x.com',
      password: 'pw',
      companyName: 'Acme',
    } as never);
    const arg = ctx.companies.createForUser.mock.calls[0][1];
    expect(arg).toEqual({ name: 'Acme', industry: null, representativeTitle: null });
  });

  it('rejects a taken email', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      ctx.service.registerCompany({ email: 'co@x.com', password: 'pw', companyName: 'Acme' } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('AuthService.login', () => {
  it('returns a token for valid credentials', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      role: UserRole.GRADUATE,
      passwordHash: 'h',
    });
    compare.mockResolvedValue(true);
    const result = await ctx.service.login({ email: 'A@B.com', password: 'pw' } as never);
    expect(result.accessToken).toBe('signed-token');
    expect(result.user.id).toBe('u1');
  });

  it('rejects an unknown user', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.login({ email: 'a@b.com', password: 'pw' } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a wrong password', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: UserRole.GRADUATE, passwordHash: 'h' });
    compare.mockResolvedValue(false);
    await expect(
      ctx.service.login({ email: 'a@b.com', password: 'bad' } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService.me', () => {
  it('returns a graduate profile', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue({ id: 'u1', email: 'a@b.com', role: UserRole.GRADUATE });
    const result = await ctx.service.me('u1');
    expect(ctx.graduates.findByUserId).toHaveBeenCalledWith('u1');
    expect(result.profile).toEqual({ id: 'grad-1' });
  });

  it('returns a company profile', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue({ id: 'u2', email: 'c@b.com', role: UserRole.COMPANY });
    const result = await ctx.service.me('u2');
    expect(ctx.companies.findByUserId).toHaveBeenCalledWith('u2');
    expect(result.profile).toEqual({ id: 'co-1' });
  });

  it('throws when the user is missing', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue(null);
    await expect(ctx.service.me('nope')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService.changePassword', () => {
  it('updates the hash when the current password matches', async () => {
    const ctx = make();
    const user = { id: 'u1', passwordHash: 'old' };
    ctx.users.findOne.mockResolvedValue(user);
    compare.mockResolvedValue(true);
    hash.mockResolvedValue('newhash');
    const result = await ctx.service.changePassword('u1', 'cur', 'new');
    expect(user.passwordHash).toBe('newhash');
    expect(ctx.users.save).toHaveBeenCalledWith(user);
    expect(result).toEqual({ ok: true });
  });

  it('throws when the user is missing', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue(null);
    await expect(ctx.service.changePassword('u1', 'c', 'n')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws when the current password is wrong', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue({ id: 'u1', passwordHash: 'old' });
    compare.mockResolvedValue(false);
    await expect(ctx.service.changePassword('u1', 'bad', 'n')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService.deleteAccount', () => {
  it('deletes when the password matches', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue({ id: 'u1', passwordHash: 'h' });
    compare.mockResolvedValue(true);
    const result = await ctx.service.deleteAccount('u1', 'pw');
    expect(ctx.users.delete).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ ok: true });
  });

  it('throws when the user is missing', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue(null);
    await expect(ctx.service.deleteAccount('u1', 'pw')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws when the password is wrong', async () => {
    const ctx = make();
    ctx.users.findOne.mockResolvedValue({ id: 'u1', passwordHash: 'h' });
    compare.mockResolvedValue(false);
    await expect(ctx.service.deleteAccount('u1', 'bad')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
