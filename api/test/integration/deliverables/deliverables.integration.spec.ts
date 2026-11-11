import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';
import {
  acceptApplication,
  applyToProject,
  createOpenProject,
  registerCompany,
  registerGraduate,
  submitDeliverable,
  type TestCompany,
  type TestGraduate,
} from '../support/factory.js';

describe('Deliverables (integration)', () => {
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

  /**
   * Company with an open project; a graduate applies and is accepted, so the
   * returned application is ready to carry a deliverable.
   */
  async function acceptedApplication(): Promise<{
    company: TestCompany;
    graduate: TestGraduate;
    projectId: string;
    applicationId: string;
  }> {
    const company = await registerCompany(ctx.server);
    const project = await createOpenProject(company);
    const graduate = await registerGraduate(ctx.server);
    const application = await applyToProject(graduate, project.id);
    await acceptApplication(company, application.id);
    return {
      company,
      graduate,
      projectId: project.id,
      applicationId: application.id,
    };
  }

  describe('POST /applications/:id/deliverable', () => {
    it('submits a deliverable for an accepted application (201, version 1)', async () => {
      const { graduate, applicationId } = await acceptedApplication();
      const res = await graduate.client
        .post(`/api/v1/applications/${applicationId}/deliverable`, {
          linkUrl: 'https://github.com/grace/solution',
          note: 'Here is my submission.',
        })
        .expect(201);
      expect(res.body).toMatchObject({
        note: 'Here is my submission.',
        linkUrl: 'https://github.com/grace/solution',
        version: 1,
        applicationId,
      });
      expect(res.body.id).toBeTruthy();
      expect(res.body.submittedAt).toBeTruthy();
    });

    it('refuses to submit for a still-PENDING application (409, D1)', async () => {
      const company = await registerCompany(ctx.server);
      const project = await createOpenProject(company);
      const graduate = await registerGraduate(ctx.server);
      const application = await applyToProject(graduate, project.id); // not accepted
      await graduate.client
        .post(`/api/v1/applications/${application.id}/deliverable`, {
          linkUrl: 'https://github.com/grace/solution',
          note: 'Here is my submission.',
        })
        .expect(409);
    });

    it('refuses a deliverable with neither linkUrl nor fileUrl (409, D4)', async () => {
      const { graduate, applicationId } = await acceptedApplication();
      await graduate.client
        .post(`/api/v1/applications/${applicationId}/deliverable`, {
          note: 'hi',
        })
        .expect(409);
    });

    it('rejects a deliverable with a missing note (400)', async () => {
      const { graduate, applicationId } = await acceptedApplication();
      await graduate.client
        .post(`/api/v1/applications/${applicationId}/deliverable`, {
          linkUrl: 'https://x.com',
        })
        .expect(400);
    });

    it("forbids a graduate from submitting on someone else's application (403)", async () => {
      const { applicationId } = await acceptedApplication();
      const other = await registerGraduate(ctx.server);
      await other.client
        .post(`/api/v1/applications/${applicationId}/deliverable`, {
          linkUrl: 'https://github.com/mallory/solution',
          note: 'Not mine to submit.',
        })
        .expect(403);
    });

    it('resubmitting bumps the version to 2', async () => {
      const { graduate, applicationId } = await acceptedApplication();
      const first = await submitDeliverable(graduate, applicationId);
      expect(first.version).toBe(1);
      const second = await submitDeliverable(graduate, applicationId, {
        note: 'Second attempt, fixed the bug.',
      });
      expect(second.version).toBe(2);
    });
  });

  describe('GET /applications/:id/deliverable', () => {
    it('lets the owning company read the deliverable (200)', async () => {
      const { company, graduate, applicationId } = await acceptedApplication();
      await submitDeliverable(graduate, applicationId);
      const res = await company.client
        .get(`/api/v1/applications/${applicationId}/deliverable`)
        .expect(200);
      expect(res.body.applicationId).toBe(applicationId);
    });

    it('forbids an unrelated graduate from reading it (403)', async () => {
      const { graduate, applicationId } = await acceptedApplication();
      await submitDeliverable(graduate, applicationId);
      const stranger = await registerGraduate(ctx.server);
      await stranger.client
        .get(`/api/v1/applications/${applicationId}/deliverable`)
        .expect(403);
    });

    it('returns 404 before any deliverable is submitted', async () => {
      const { company, applicationId } = await acceptedApplication();
      await company.client
        .get(`/api/v1/applications/${applicationId}/deliverable`)
        .expect(404);
    });
  });

  describe('GET /deliverables/:id', () => {
    it('lets the owner graduate read the deliverable (200)', async () => {
      const { graduate, applicationId } = await acceptedApplication();
      const deliverable = await submitDeliverable(graduate, applicationId);
      const res = await graduate.client
        .get(`/api/v1/deliverables/${deliverable.id}`)
        .expect(200);
      expect(res.body.id).toBe(deliverable.id);
    });

    it('returns 404 for an unrelated graduate', async () => {
      const { graduate, applicationId } = await acceptedApplication();
      const deliverable = await submitDeliverable(graduate, applicationId);
      const stranger = await registerGraduate(ctx.server);
      await stranger.client
        .get(`/api/v1/deliverables/${deliverable.id}`)
        .expect(404);
    });
  });
});
