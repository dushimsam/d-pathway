import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';
import {
  acceptApplication,
  applyToProject,
  createDraftProject,
  createOpenProject,
  registerCompany,
  registerGraduate,
  submitDeliverable,
} from '../support/factory.js';

describe('Applications (integration)', () => {
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

  describe('POST /projects/:id/apply', () => {
    it('lets a graduate apply to an open project (201, PENDING)', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);

      const res = await grad.client
        .post(`/api/v1/projects/${project.id}/apply`, {
          termsAccepted: true,
          note: 'Keen to help.',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        status: 'PENDING',
        note: 'Keen to help.',
        projectId: project.id,
        graduateId: grad.graduateId,
      });
      expect(res.body.id).toBeTruthy();
    });

    it('rejects an application that does not accept the terms (400)', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);

      await grad.client
        .post(`/api/v1/projects/${project.id}/apply`, { termsAccepted: false })
        .expect(400);
    });

    it('refuses to apply to a project that is not OPEN (409, A1)', async () => {
      const company = await registerCompany(ctx.server);
      const draft = await createDraftProject(company);
      const grad = await registerGraduate(ctx.server);

      await grad.client
        .post(`/api/v1/projects/${draft.id}/apply`, { termsAccepted: true })
        .expect(409);
    });

    it('forbids applying twice to the same project (403, already applied)', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);
      await applyToProject(grad, project.id);

      await grad.client
        .post(`/api/v1/projects/${project.id}/apply`, { termsAccepted: true })
        .expect(403);
    });

    it('forbids a company from applying (403, role)', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const other = await registerCompany(ctx.server);

      await other.client
        .post(`/api/v1/projects/${project.id}/apply`, { termsAccepted: true })
        .expect(403);
    });
  });

  describe('GET /applications/mine', () => {
    it("lists the graduate's own enriched applications", async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company, {
        title: 'Ship the dashboard',
      });
      const grad = await registerGraduate(ctx.server);
      await applyToProject(grad, project.id);

      const res = await grad.client.get('/api/v1/applications/mine').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        status: 'PENDING',
        role: 'LEAD',
      });
      expect(res.body[0].project).toMatchObject({ title: 'Ship the dashboard' });
    });
  });

  describe('GET /projects/:id/applications', () => {
    it('returns the review queue to the owning company', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const grad = await registerGraduate(ctx.server, {
        fullName: 'Grace Graduate',
      });
      await applyToProject(grad, project.id);

      const res = await company.client
        .get(`/api/v1/projects/${project.id}/applications`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].graduate).toMatchObject({ fullName: 'Grace Graduate' });
    });

    it("forbids a non-owner company from reading the queue (403)", async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);
      await applyToProject(grad, project.id);

      const other = await registerCompany(ctx.server);
      await other.client
        .get(`/api/v1/projects/${project.id}/applications`)
        .expect(403);
    });
  });

  describe('GET /projects/:id/board', () => {
    it('reflects the candidate stage as the application moves', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company, { title: 'Board project' });
      const grad = await registerGraduate(ctx.server);
      const application = await applyToProject(grad, project.id);

      // Just applied -> 'applied'.
      const applied = await company.client
        .get(`/api/v1/projects/${project.id}/board`)
        .expect(200);
      expect(applied.body.project).toMatchObject({
        id: project.id,
        title: 'Board project',
      });
      expect(applied.body.candidates).toHaveLength(1);
      expect(applied.body.candidates[0].stage).toBe('applied');

      // Accepted -> 'accepted'.
      await acceptApplication(company, application.id);
      const accepted = await company.client
        .get(`/api/v1/projects/${project.id}/board`)
        .expect(200);
      expect(accepted.body.candidates[0].stage).toBe('accepted');

      // Deliverable submitted -> 'submitted'.
      await submitDeliverable(grad, application.id);
      const submitted = await company.client
        .get(`/api/v1/projects/${project.id}/board`)
        .expect(200);
      expect(submitted.body.candidates[0].stage).toBe('submitted');
    });
  });

  describe('POST /applications/:id/accept', () => {
    it('refuses to accept an already-decided application (409, A5)', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);
      const application = await applyToProject(grad, project.id);
      await acceptApplication(company, application.id);

      await company.client
        .post(`/api/v1/applications/${application.id}/accept`)
        .expect(409);
    });

    it('forbids a non-owner company from accepting (403)', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);
      const application = await applyToProject(grad, project.id);

      const other = await registerCompany(ctx.server);
      await other.client
        .post(`/api/v1/applications/${application.id}/accept`)
        .expect(403);
    });
  });

  describe('POST /applications/:id/decline', () => {
    it('declines with a reason (200, DECLINED)', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);
      const application = await applyToProject(grad, project.id);

      const res = await company.client
        .post(`/api/v1/applications/${application.id}/decline`, {
          reason: 'Not the right fit this time.',
        })
        .expect(200);

      expect(res.body.status).toBe('DECLINED');
      expect(res.body.declineReason).toBe('Not the right fit this time.');
    });

    it('rejects an empty decline reason (400)', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const grad = await registerGraduate(ctx.server);
      const application = await applyToProject(grad, project.id);

      await company.client
        .post(`/api/v1/applications/${application.id}/decline`, { reason: '' })
        .expect(400);
    });
  });
});
