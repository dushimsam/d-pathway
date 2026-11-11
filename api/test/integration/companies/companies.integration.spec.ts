import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';
import {
  anonymous,
  registerCompany,
  registerGraduate,
} from '../support/factory.js';

describe('Companies (integration)', () => {
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

  describe('GET /companies/me', () => {
    it('returns the company profile created at registration', async () => {
      const company = await registerCompany(ctx.server, {
        companyName: 'Acme Robotics',
      });
      const res = await company.client.get('/api/v1/companies/me').expect(200);
      expect(res.body.id).toBe(company.companyId);
      expect(res.body.name).toBe('Acme Robotics');
    });

    it('forbids a graduate from reading the company profile (403)', async () => {
      const grad = await registerGraduate(ctx.server);
      await grad.client.get('/api/v1/companies/me').expect(403);
    });
  });

  describe('PATCH /companies/me', () => {
    it('updates the industry and description and returns them', async () => {
      const company = await registerCompany(ctx.server);
      const res = await company.client
        .patch('/api/v1/companies/me', {
          industry: 'Fintech',
          description: 'We build payment rails.',
        })
        .expect(200);
      expect(res.body.industry).toBe('Fintech');
      expect(res.body.description).toBe('We build payment rails.');
    });

    it("conflicts when renaming to another company's name (409)", async () => {
      const takenName = 'Beta Corp';
      const a = await registerCompany(ctx.server, { companyName: 'Alpha Corp' });
      await registerCompany(ctx.server, { companyName: takenName });
      await a.client
        .patch('/api/v1/companies/me', { name: takenName })
        .expect(409);
    });
  });

  describe('GET /companies/:id/public', () => {
    it('returns the public profile with empty rating and open projects for a fresh company', async () => {
      const company = await registerCompany(ctx.server);
      const res = await anonymous(ctx.server)
        .get(`/api/v1/companies/${company.companyId}/public`)
        .expect(200);
      expect(res.body.id).toBe(company.companyId);
      expect(res.body.rating).toEqual({ average: 0, count: 0 });
      expect(res.body.openProjects).toEqual([]);
    });

    it('returns 404 for an unknown company id', async () => {
      await anonymous(ctx.server)
        .get('/api/v1/companies/00000000-0000-0000-0000-000000000000/public')
        .expect(404);
    });
  });
});
