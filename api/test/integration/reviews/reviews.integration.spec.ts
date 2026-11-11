import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';
import {
  anonymous,
  createOpenProject,
  registerCompany,
  registerGraduate,
  runFullLifecycle,
} from '../support/factory.js';

describe('Reviews (integration)', () => {
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

  describe('POST /reviews', () => {
    it('lets an accepted graduate review the company (201)', async () => {
      const { company, graduate, projectId } = await runFullLifecycle(
        ctx.server,
        ctx.dataSource,
      );
      const res = await graduate.client
        .post('/api/v1/reviews', {
          projectId,
          rating: 5,
          comment: 'Great',
        })
        .expect(201);
      expect(res.body).toMatchObject({
        companyId: company.companyId,
        graduateId: graduate.graduateId,
        projectId,
        rating: 5,
        comment: 'Great',
      });
      expect(res.body.id).toBeTruthy();
    });

    it('forbids a graduate who was not accepted on the brief (403)', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const outsider = await registerGraduate(ctx.server);
      await outsider.client
        .post('/api/v1/reviews', { projectId: project.id, rating: 4 })
        .expect(403);
    });

    it('rejects a duplicate review for the same project (409)', async () => {
      const { graduate, projectId } = await runFullLifecycle(
        ctx.server,
        ctx.dataSource,
      );
      await graduate.client
        .post('/api/v1/reviews', { projectId, rating: 5, comment: 'First' })
        .expect(201);
      await graduate.client
        .post('/api/v1/reviews', { projectId, rating: 3, comment: 'Second' })
        .expect(409);
    });

    it('rejects a rating out of range (400)', async () => {
      const { graduate, projectId } = await runFullLifecycle(
        ctx.server,
        ctx.dataSource,
      );
      await graduate.client
        .post('/api/v1/reviews', { projectId, rating: 6 })
        .expect(400);
    });
  });

  describe('GET /reviews/mine', () => {
    it("returns the graduate's own reviews", async () => {
      const { graduate, projectId } = await runFullLifecycle(
        ctx.server,
        ctx.dataSource,
      );
      await graduate.client
        .post('/api/v1/reviews', { projectId, rating: 5, comment: 'Great' })
        .expect(201);

      const res = await graduate.client.get('/api/v1/reviews/mine').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ projectId, rating: 5 });
    });
  });

  describe('GET /companies/:id/reviews', () => {
    it('exposes a public summary and items (no token)', async () => {
      const { company, graduate, projectId } = await runFullLifecycle(
        ctx.server,
        ctx.dataSource,
      );
      await graduate.client
        .post('/api/v1/reviews', {
          projectId,
          rating: 5,
          comment: 'Outstanding brief',
        })
        .expect(201);

      const res = await anonymous(ctx.server)
        .get(`/api/v1/companies/${company.companyId}/reviews`)
        .expect(200);

      expect(res.body.summary).toMatchObject({ average: 5, count: 1 });
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toHaveProperty('graduateName');
      expect(res.body.items[0]).toHaveProperty('projectTitle');
      expect(res.body.items[0]).toHaveProperty('rating', 5);
    });
  });
});
