import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheService } from './cache.service.js';

function make() {
  const redis = {
    get: vi.fn(),
    set: vi.fn(),
    keys: vi.fn(),
    del: vi.fn(),
  };
  const service = new CacheService(redis as never);
  return { service, redis };
}

beforeEach(() => vi.clearAllMocks());

describe('CacheService.get', () => {
  it('parses stored JSON', async () => {
    const ctx = make();
    ctx.redis.get.mockResolvedValue(JSON.stringify({ a: 1 }));
    expect(await ctx.service.get('k')).toEqual({ a: 1 });
  });

  it('returns null for a miss', async () => {
    const ctx = make();
    ctx.redis.get.mockResolvedValue(null);
    expect(await ctx.service.get('k')).toBeNull();
  });

  it('returns null and swallows a client error', async () => {
    const ctx = make();
    ctx.redis.get.mockRejectedValue(new Error('down'));
    expect(await ctx.service.get('k')).toBeNull();
  });
});

describe('CacheService.set', () => {
  it('serializes with a TTL', async () => {
    const ctx = make();
    await ctx.service.set('k', { a: 1 }, 60);
    expect(ctx.redis.set).toHaveBeenCalledWith('k', JSON.stringify({ a: 1 }), 'EX', 60);
  });

  it('uses the default TTL', async () => {
    const ctx = make();
    await ctx.service.set('k', 'v');
    expect(ctx.redis.set).toHaveBeenCalledWith('k', JSON.stringify('v'), 'EX', 30);
  });

  it('swallows a client error', async () => {
    const ctx = make();
    ctx.redis.set.mockRejectedValue(new Error('down'));
    await expect(ctx.service.set('k', 'v')).resolves.toBeUndefined();
  });
});

describe('CacheService.wrap', () => {
  it('returns the cached value without calling the loader', async () => {
    const ctx = make();
    ctx.redis.get.mockResolvedValue(JSON.stringify('cached'));
    const loader = vi.fn();
    expect(await ctx.service.wrap('k', 10, loader)).toBe('cached');
    expect(loader).not.toHaveBeenCalled();
  });

  it('loads, caches, and returns on a miss', async () => {
    const ctx = make();
    ctx.redis.get.mockResolvedValue(null);
    const loader = vi.fn(async () => ({ fresh: true }));
    const result = await ctx.service.wrap('k', 10, loader);
    expect(result).toEqual({ fresh: true });
    expect(loader).toHaveBeenCalled();
    expect(ctx.redis.set).toHaveBeenCalledWith('k', JSON.stringify({ fresh: true }), 'EX', 10);
  });
});

describe('CacheService.invalidatePrefix', () => {
  it('deletes every matching key', async () => {
    const ctx = make();
    ctx.redis.keys.mockResolvedValue(['p:1', 'p:2']);
    await ctx.service.invalidatePrefix('p:');
    expect(ctx.redis.keys).toHaveBeenCalledWith('p:*');
    expect(ctx.redis.del).toHaveBeenCalledWith('p:1', 'p:2');
  });

  it('does nothing when there are no matches', async () => {
    const ctx = make();
    ctx.redis.keys.mockResolvedValue([]);
    await ctx.service.invalidatePrefix('p:');
    expect(ctx.redis.del).not.toHaveBeenCalled();
  });

  it('swallows a client error', async () => {
    const ctx = make();
    ctx.redis.keys.mockRejectedValue(new Error('down'));
    await expect(ctx.service.invalidatePrefix('p:')).resolves.toBeUndefined();
  });
});
