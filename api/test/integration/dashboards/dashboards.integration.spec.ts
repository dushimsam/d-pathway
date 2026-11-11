import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';
import { registerCompany, registerGraduate, runFullLifecycle } from '../support/factory.js';

describe('Dashboards (integration)', () => {
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

  describe('GET /dashboards/graduate', () => {
    it('summarises the graduate after a full lifecycle (accepted, evaluated, invited)', async () => {
      const { graduate } = await runFullLifecycle(ctx.server, ctx.dataSource);
      const res = await graduate.client
        .get('/api/v1/dashboards/graduate')
        .expect(200);

      expect(res.body.applicationsByStatus.ACCEPTED).toBe(1);
      expect(res.body.evaluations).toHaveLength(1);
      // The lifecycle evaluation outcome is SELECTED_FOR_INTERVIEW -> one invitation.
      expect(res.body.invitations).toHaveLength(1);
    });

    it('returns an empty-but-shaped dashboard for a fresh graduate', async () => {
      const grad = await registerGraduate(ctx.server);
      const res = await grad.client
        .get('/api/v1/dashboards/graduate')
        .expect(200);

      expect(res.body.applicationsByStatus.PENDING).toBe(0);
      expect(res.body.applications).toEqual([]);
    });

    it('forbids a company token (403)', async () => {
      const company = await registerCompany(ctx.server);
      await company.client.get('/api/v1/dashboards/graduate').expect(403);
    });
  });

  describe('GET /dashboards/company', () => {
    it('summarises the company after a full lifecycle (one invitation issued)', async () => {
      const { company } = await runFullLifecycle(ctx.server, ctx.dataSource);
      const res = await company.client
        .get('/api/v1/dashboards/company')
        .expect(200);

      expect(res.body.summary.invitationsIssued).toBe(1);
      expect(res.body.projects).toHaveLength(1);
    });

    it('forbids a graduate token (403)', async () => {
      const grad = await registerGraduate(ctx.server);
      await grad.client.get('/api/v1/dashboards/company').expect(403);
    });
  });
});
