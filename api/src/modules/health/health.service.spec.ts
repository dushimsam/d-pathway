import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthService } from './health.service.js';

function make() {
  const dataSource = { query: vi.fn() };
  const service = new HealthService(dataSource as never);
  return { service, dataSource };
}

beforeEach(() => vi.clearAllMocks());

describe('HealthService.check', () => {
  it('reports db ok when the query succeeds', async () => {
    const ctx = make();
    ctx.dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
    const result = await ctx.service.check();
    expect(ctx.dataSource.query).toHaveBeenCalledWith('SELECT 1');
    expect(result).toEqual({ status: 'ok', db: 'ok' });
  });

  it('reports db down when the query throws', async () => {
    const ctx = make();
    ctx.dataSource.query.mockRejectedValue(new Error('no connection'));
    const result = await ctx.service.check();
    expect(result).toEqual({ status: 'ok', db: 'down' });
  });
});
