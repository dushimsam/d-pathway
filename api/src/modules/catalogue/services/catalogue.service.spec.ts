import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogueService } from './catalogue.service.js';

function make() {
  const projects = {
    catalogue: vi.fn(),
    companiesWithOpenProjects: vi.fn(),
  };
  // By default wrap runs the loader (cache miss).
  const cache = {
    wrap: vi.fn(async (_key: string, _ttl: number, loader: () => unknown) =>
      loader(),
    ),
  };
  const service = new CatalogueService(projects as never, cache as never);
  return { service, projects, cache };
}

describe('CatalogueService.listProjects', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('loads and paginates on a cache miss', async () => {
    ctx.projects.catalogue.mockResolvedValue({
      items: [{ id: 'p1' }, { id: 'p2' }],
      total: 2,
    });
    const result = await ctx.service.listProjects({
      companyId: 'co-1',
      skill: 'react',
      hasPrize: true,
      page: 1,
      pageSize: 20,
    } as never);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(ctx.projects.catalogue).toHaveBeenCalledWith({
      companyId: 'co-1',
      skill: 'react',
      hasPrize: true,
      page: 1,
      pageSize: 20,
    });
    // Fingerprinted cache key.
    expect(ctx.cache.wrap).toHaveBeenCalledWith(
      'catalogue:projects:co-1|react|true|1|20',
      30,
      expect.any(Function),
    );
  });

  it('builds a default fingerprint when query fields are absent', async () => {
    ctx.projects.catalogue.mockResolvedValue({ items: [], total: 0 });
    await ctx.service.listProjects({} as never);
    expect(ctx.cache.wrap).toHaveBeenCalledWith(
      'catalogue:projects:|||1|20',
      30,
      expect.any(Function),
    );
    expect(ctx.projects.catalogue).toHaveBeenCalled();
  });

  it('returns the cached value without hitting the source on a hit', async () => {
    const cached = { items: [{ id: 'c1' }], page: 1, pageSize: 20, total: 1, totalPages: 1 };
    ctx.cache.wrap.mockResolvedValue(cached);
    const result = await ctx.service.listProjects({ page: 2, pageSize: 5 } as never);
    expect(result).toBe(cached);
    expect(ctx.projects.catalogue).not.toHaveBeenCalled();
  });
});

describe('CatalogueService.listCompanies', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('wraps the company loader with a 60s TTL', async () => {
    ctx.projects.companiesWithOpenProjects.mockResolvedValue([{ id: 'co-1' }]);
    const result = await ctx.service.listCompanies();
    expect(result).toEqual([{ id: 'co-1' }]);
    expect(ctx.cache.wrap).toHaveBeenCalledWith(
      'catalogue:companies',
      60,
      expect.any(Function),
    );
    expect(ctx.projects.companiesWithOpenProjects).toHaveBeenCalled();
  });
});
