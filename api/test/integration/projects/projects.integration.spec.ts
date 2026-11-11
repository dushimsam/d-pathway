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
  creditCompany,
  projectInput,
  registerCompany,
  registerGraduate,
  type TestCompany,
} from '../support/factory.js';

describe('Projects (integration)', () => {
  let ctx: IntegrationApp;
  let company: TestCompany;

  beforeAll(async () => {
    ctx = await createIntegrationApp();
  });

  afterEach(async () => {
    await ctx.truncate();
  });

  afterAll(async () => {
    await ctx.close();
  });

  async function freshCompany(): Promise<TestCompany> {
    company = await registerCompany(ctx.server);
    return company;
  }

  describe('POST /projects', () => {
    it('creates a DRAFT project for a company', async () => {
      const c = await freshCompany();
      const res = await c.client
        .post('/api/v1/projects', projectInput())
        .expect(201);
      expect(res.body).toMatchObject({
        status: 'DRAFT',
        title: 'Build a landing page',
        companyId: c.companyId,
      });
      // Skills are normalised to lowercase.
      expect(res.body.requiredSkills).toEqual(['react', 'typescript']);
    });

    it('forbids a graduate from creating a project (403)', async () => {
      const grad = await registerGraduate(ctx.server);
      await grad.client.post('/api/v1/projects', projectInput()).expect(403);
    });

    it('rejects an invalid body (400)', async () => {
      const c = await freshCompany();
      await c.client
        .post('/api/v1/projects', { title: '', requiredSkills: [] })
        .expect(400);
    });
  });

  describe('POST /projects/:id/publish', () => {
    it('publishes a valid DRAFT to OPEN', async () => {
      const c = await freshCompany();
      const draft = await createDraftProject(c);
      const res = await c.client
        .post(`/api/v1/projects/${draft.id}/publish`)
        .expect(201);
      expect(res.body.status).toBe('OPEN');
      expect(res.body.publishedAt).toBeTruthy();
    });

    it('refuses to publish when the application deadline is in the past (409)', async () => {
      const c = await freshCompany();
      const draft = await createDraftProject(c, {
        applicationDeadline: new Date(Date.now() - 1000).toISOString(),
      });
      await c.client.post(`/api/v1/projects/${draft.id}/publish`).expect(409);
    });

    it('refuses to publish an already-published project (409)', async () => {
      const c = await freshCompany();
      const project = await createOpenProject(c);
      await c.client.post(`/api/v1/projects/${project.id}/publish`).expect(409);
    });
  });

  describe('PATCH /projects/:id', () => {
    it('edits a DRAFT project', async () => {
      const c = await freshCompany();
      const draft = await createDraftProject(c);
      const res = await c.client
        .patch(`/api/v1/projects/${draft.id}`, { title: 'New title' })
        .expect(200);
      expect(res.body.title).toBe('New title');
    });

    it('refuses to edit once published (409, P-LOCK)', async () => {
      const c = await freshCompany();
      const project = await createOpenProject(c);
      await c.client
        .patch(`/api/v1/projects/${project.id}`, { title: 'Nope' })
        .expect(409);
    });

    it("forbids editing another company's project (403)", async () => {
      const owner = await registerCompany(ctx.server);
      const draft = await createDraftProject(owner);
      const other = await registerCompany(ctx.server);
      await other.client
        .patch(`/api/v1/projects/${draft.id}`, { title: 'Hijack' })
        .expect(403);
    });
  });

  describe('GET /projects/:id visibility', () => {
    it('hides a DRAFT project from graduates (404) but shows the owner', async () => {
      const c = await freshCompany();
      const draft = await createDraftProject(c);
      await c.client.get(`/api/v1/projects/${draft.id}`).expect(200);

      const grad = await registerGraduate(ctx.server);
      await grad.client.get(`/api/v1/projects/${draft.id}`).expect(404);
    });

    it('shows an OPEN project to a graduate', async () => {
      const c = await freshCompany();
      const project = await createOpenProject(c);
      const grad = await registerGraduate(ctx.server);
      const res = await grad.client
        .get(`/api/v1/projects/${project.id}`)
        .expect(200);
      expect(res.body.id).toBe(project.id);
    });
  });

  describe('GET /projects/mine', () => {
    it('lists the company own projects with application counts', async () => {
      const c = await freshCompany();
      await createOpenProject(c);
      const res = await c.client.get('/api/v1/projects/mine').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('applicationCounts');
    });
  });

  describe('POST /projects/:id/close', () => {
    it('refuses to close an OPEN project — only IN_PROGRESS (409)', async () => {
      const c = await freshCompany();
      const project = await createOpenProject(c);
      await c.client.post(`/api/v1/projects/${project.id}/close`).expect(409);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('deletes a DRAFT project', async () => {
      const c = await freshCompany();
      const draft = await createDraftProject(c);
      await c.client.delete(`/api/v1/projects/${draft.id}`).expect(200);
      await c.client.get(`/api/v1/projects/${draft.id}`).expect(404);
    });

    it('refuses to delete once an applicant is accepted (409, P-DEL)', async () => {
      const c = await freshCompany();
      const project = await createOpenProject(c);
      const grad = await registerGraduate(ctx.server);
      const application = await applyToProject(grad, project.id);
      await acceptApplication(c, application.id);
      await c.client.delete(`/api/v1/projects/${project.id}`).expect(409);
    });
  });

  describe('POST /projects/:id/award', () => {
    it('awards a held prize to an accepted applicant, releasing it to their wallet', async () => {
      const c = await freshCompany();
      await creditCompany(ctx.dataSource, c.companyId, 50_000);
      const project = await createOpenProject(c, { prizeAmount: 30_000 });
      const grad = await registerGraduate(ctx.server);
      const application = await applyToProject(grad, project.id);
      await acceptApplication(c, application.id);

      const res = await c.client
        .post(`/api/v1/projects/${project.id}/award`, {
          graduateId: grad.graduateId,
        })
        .expect(201);
      expect(res.body.prizeStatus).toBe('RELEASED');
      expect(res.body.status).toBe('CLOSED');
      expect(res.body.winnerGraduateId).toBe(grad.graduateId);

      // The prize landed in the graduate's wallet.
      const wallet = await grad.client.get('/api/v1/wallet').expect(200);
      expect(wallet.body.balance).toBe(30_000);
    });

    it('refuses to award a graduate who was never accepted (403)', async () => {
      const c = await freshCompany();
      await creditCompany(ctx.dataSource, c.companyId, 50_000);
      const project = await createOpenProject(c, { prizeAmount: 30_000 });
      const grad = await registerGraduate(ctx.server);
      await applyToProject(grad, project.id); // applied, not accepted
      await c.client
        .post(`/api/v1/projects/${project.id}/award`, {
          graduateId: grad.graduateId,
        })
        .expect(403);
    });
  });
});
