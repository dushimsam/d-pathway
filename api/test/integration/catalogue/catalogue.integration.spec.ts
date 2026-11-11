import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';
import {
  createDraftProject,
  createOpenProject,
  creditCompany,
  registerCompany,
  registerGraduate,
} from '../support/factory.js';

describe('Catalogue (integration)', () => {
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

  describe('GET /catalogue/projects', () => {
    it('returns an OPEN project the company published', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);

      const res = await grad.client
        .get('/api/v1/catalogue/projects')
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe(project.id);
      expect(res.body.total).toBe(1);
    });

    it('does not list a DRAFT project', async () => {
      const company = await registerCompany(ctx.server);
      await createDraftProject(company);
      const grad = await registerGraduate(ctx.server);

      const res = await grad.client
        .get('/api/v1/catalogue/projects')
        .expect(200);

      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it('filters by skill', async () => {
      const company = await registerCompany(ctx.server);
      const reactProject = await createOpenProject(company, {
        requiredSkills: ['react'],
      });
      await createOpenProject(company, { requiredSkills: ['python'] });
      const grad = await registerGraduate(ctx.server);

      const res = await grad.client
        .get('/api/v1/catalogue/projects?skill=react')
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe(reactProject.id);
    });

    it('filters by hasPrize=true', async () => {
      const company = await registerCompany(ctx.server);
      await creditCompany(ctx.dataSource, company.companyId, 50_000);
      const prized = await createOpenProject(company, { prizeAmount: 10_000 });
      await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);

      const res = await grad.client
        .get('/api/v1/catalogue/projects?hasPrize=true')
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe(prized.id);
    });

    it('forbids a company token (403)', async () => {
      const company = await registerCompany(ctx.server);
      await company.client.get('/api/v1/catalogue/projects').expect(403);
    });
  });

  describe('GET /catalogue/companies', () => {
    it('lists a company that has an open project', async () => {
      const company = await registerCompany(ctx.server);
      await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);

      const res = await grad.client
        .get('/api/v1/catalogue/companies')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((c: any) => c.id === company.companyId)).toBe(true);
    });
  });

  describe('bookmarks', () => {
    it('saves, lists, is idempotent, and removes a saved project', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);

      const saved = await grad.client
        .post('/api/v1/catalogue/saved', { projectId: project.id })
        .expect(201);
      expect(saved.body).toEqual({ saved: true });

      const ids = await grad.client
        .get('/api/v1/catalogue/saved/ids')
        .expect(200);
      expect(ids.body).toContain(project.id);

      const list = await grad.client
        .get('/api/v1/catalogue/saved')
        .expect(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0].id).toBe(project.id);

      // Saving again is idempotent.
      const again = await grad.client
        .post('/api/v1/catalogue/saved', { projectId: project.id })
        .expect(201);
      expect(again.body).toEqual({ saved: true });

      const idsAfterResave = await grad.client
        .get('/api/v1/catalogue/saved/ids')
        .expect(200);
      expect(idsAfterResave.body).toHaveLength(1);

      const removed = await grad.client
        .delete(`/api/v1/catalogue/saved/${project.id}`)
        .expect(200);
      expect(removed.body).toEqual({ saved: false });

      const idsAfterRemove = await grad.client
        .get('/api/v1/catalogue/saved/ids')
        .expect(200);
      expect(idsAfterRemove.body).toHaveLength(0);
    });
  });
});
