import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';
import { anonymous, registerCompany, registerGraduate } from '../support/factory.js';

describe('Activity (integration)', () => {
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

  // NOTE: activity rows are written asynchronously by a background worker, so we
  // only assert the endpoint contract (status + array shape), never specific rows.
  describe('GET /activity', () => {
    it('returns an array feed for a graduate', async () => {
      const grad = await registerGraduate(ctx.server);
      const res = await grad.client.get('/api/v1/activity').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns an array feed for a company', async () => {
      const company = await registerCompany(ctx.server);
      const res = await company.client.get('/api/v1/activity').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('rejects an unauthenticated request (401)', async () => {
      await anonymous(ctx.server).get('/api/v1/activity').expect(401);
    });
  });
});
