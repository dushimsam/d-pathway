import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';
import {
  anonymous,
  registerCompany,
  registerGraduate,
  runFullLifecycle,
} from '../support/factory.js';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

describe('Talent (integration)', () => {
  let ctx: IntegrationApp;

  beforeAll(async () => {
    ctx = await createIntegrationApp();
  });

  afterEach(async () => {
    await ctx.truncate();
  });

  afterAll(async () => {
    await ctx.close();
  });

  describe('GET /talent', () => {
    it('surfaces an evaluated graduate with computed stats', async () => {
      const { company, graduate } = await runFullLifecycle(
        ctx.server,
        ctx.dataSource,
      );
      const res = await company.client.get('/api/v1/talent').expect(200);

      const item = res.body.items.find(
        (t: { id: string }) => t.id === graduate.graduateId,
      );
      expect(item).toBeDefined();
      expect(item.stats.briefsCompleted).toBe(1);
      expect(item.stats.avgScore).toBe(4);
    });

    it('filters by normalised lowercase skill', async () => {
      const company = await registerCompany(ctx.server);
      const grad = await registerGraduate(ctx.server, { skills: ['react'] });

      const match = await company.client
        .get('/api/v1/talent?skill=react')
        .expect(200);
      expect(
        match.body.items.some(
          (t: { id: string }) => t.id === grad.graduateId,
        ),
      ).toBe(true);

      const miss = await company.client
        .get('/api/v1/talent?skill=python')
        .expect(200);
      expect(
        miss.body.items.some((t: { id: string }) => t.id === grad.graduateId),
      ).toBe(false);
    });

    it('forbids a graduate token (403)', async () => {
      const grad = await registerGraduate(ctx.server);
      await grad.client.get('/api/v1/talent').expect(403);
    });
  });

  describe('GET /talent/:id', () => {
    it('returns the profile with scored history', async () => {
      const { company, graduate } = await runFullLifecycle(
        ctx.server,
        ctx.dataSource,
      );
      const res = await company.client
        .get(`/api/v1/talent/${graduate.graduateId}`)
        .expect(200);

      expect(res.body.id).toBe(graduate.graduateId);
      expect(res.body.history).toHaveLength(1);
      expect(res.body.history[0].score).toBe(4);
    });

    it('returns 404 for an unknown id', async () => {
      const company = await registerCompany(ctx.server);
      await company.client.get(`/api/v1/talent/${ZERO_UUID}`).expect(404);
    });
  });

  describe('GET /talent/:id/public', () => {
    it('is reachable without a token and returns the profile shape', async () => {
      const { graduate } = await runFullLifecycle(ctx.server, ctx.dataSource);
      const res = await anonymous(ctx.server)
        .get(`/api/v1/talent/${graduate.graduateId}/public`)
        .expect(200);

      expect(res.body.id).toBe(graduate.graduateId);
      expect(res.body.stats).toBeDefined();
    });
  });
});
