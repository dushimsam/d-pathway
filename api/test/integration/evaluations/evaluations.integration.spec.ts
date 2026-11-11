import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';
import {
  acceptApplication,
  applyToProject,
  createOpenProject,
  evaluateDeliverable,
  registerCompany,
  registerGraduate,
  submitDeliverable,
  type TestCompany,
  type TestGraduate,
} from '../support/factory.js';

describe('Evaluations (integration)', () => {
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

  /** Owning company, concerned graduate, and their submitted (unevaluated) deliverable. */
  async function submittedDeliverable(): Promise<{
    company: TestCompany;
    graduate: TestGraduate;
    deliverable: Record<string, any>;
  }> {
    const company = await registerCompany(ctx.server);
    const graduate = await registerGraduate(ctx.server);
    const project = await createOpenProject(company);
    const app = await applyToProject(graduate, project.id);
    await acceptApplication(company, app.id);
    const deliverable = await submitDeliverable(graduate, app.id);
    return { company, graduate, deliverable };
  }

  describe('POST /deliverables/:id/evaluation', () => {
    it('lets the owning company evaluate a submitted deliverable', async () => {
      const { company, deliverable } = await submittedDeliverable();
      const res = await company.client
        .post(`/api/v1/deliverables/${deliverable.id}/evaluation`, {
          score: 4,
          feedback: 'Solid work.',
          outcome: 'SELECTED_FOR_INTERVIEW',
        })
        .expect(201);
      expect(res.body).toMatchObject({
        score: 4,
        outcome: 'SELECTED_FOR_INTERVIEW',
        stale: false,
        deliverableId: deliverable.id,
      });
      expect(res.body.id).toBeTruthy();
    });

    it('rejects an out-of-range score (6 and 0 → 400)', async () => {
      const { company, deliverable } = await submittedDeliverable();
      await company.client
        .post(`/api/v1/deliverables/${deliverable.id}/evaluation`, {
          score: 6,
          feedback: 'Solid work.',
          outcome: 'SELECTED_FOR_INTERVIEW',
        })
        .expect(400);
      await company.client
        .post(`/api/v1/deliverables/${deliverable.id}/evaluation`, {
          score: 0,
          feedback: 'Solid work.',
          outcome: 'SELECTED_FOR_INTERVIEW',
        })
        .expect(400);
    });

    it('rejects an invalid outcome string (400)', async () => {
      const { company, deliverable } = await submittedDeliverable();
      await company.client
        .post(`/api/v1/deliverables/${deliverable.id}/evaluation`, {
          score: 4,
          feedback: 'Solid work.',
          outcome: 'MAYBE',
        })
        .expect(400);
    });

    it('forbids a company that does not own the project (403)', async () => {
      const { deliverable } = await submittedDeliverable();
      const other = await registerCompany(ctx.server);
      const res = await other.client
        .post(`/api/v1/deliverables/${deliverable.id}/evaluation`, {
          score: 4,
          feedback: 'Solid work.',
          outcome: 'SELECTED_FOR_INTERVIEW',
        })
        .expect(403);
      expect(JSON.stringify(res.body)).toContain('Only the owning company');
    });

    it('refuses to evaluate a deliverable twice (409, rule E3)', async () => {
      const { company, deliverable } = await submittedDeliverable();
      await evaluateDeliverable(company, deliverable.id);
      const res = await company.client
        .post(`/api/v1/deliverables/${deliverable.id}/evaluation`, {
          score: 4,
          feedback: 'Solid work.',
          outcome: 'SELECTED_FOR_INTERVIEW',
        })
        .expect(409);
      // The create path rejects a second evaluation (the exact wording is the
      // rule's own sentence about one evaluation per deliverable).
      expect(res.body.statusCode).toBe(409);
    });
  });

  describe('PATCH /deliverables/:id/evaluation', () => {
    it('updates an existing evaluation (score → 2)', async () => {
      const { company, deliverable } = await submittedDeliverable();
      await evaluateDeliverable(company, deliverable.id);
      const res = await company.client
        .patch(`/api/v1/deliverables/${deliverable.id}/evaluation`, {
          score: 2,
        })
        .expect(200);
      expect(res.body.score).toBe(2);
    });

    it('returns 404 when no evaluation exists yet', async () => {
      const { company, deliverable } = await submittedDeliverable();
      await company.client
        .patch(`/api/v1/deliverables/${deliverable.id}/evaluation`, {
          score: 2,
        })
        .expect(404);
    });
  });

  describe('GET /deliverables/:id/evaluation', () => {
    it('lets the concerned graduate read it once evaluated', async () => {
      const { company, graduate, deliverable } = await submittedDeliverable();
      await evaluateDeliverable(company, deliverable.id);
      const res = await graduate.client
        .get(`/api/v1/deliverables/${deliverable.id}/evaluation`)
        .expect(200);
      expect(res.body.deliverableId).toBe(deliverable.id);
    });

    it('forbids an unrelated graduate (403)', async () => {
      const { company, deliverable } = await submittedDeliverable();
      await evaluateDeliverable(company, deliverable.id);
      const stranger = await registerGraduate(ctx.server);
      await stranger.client
        .get(`/api/v1/deliverables/${deliverable.id}/evaluation`)
        .expect(403);
    });

    it('returns 404 before any evaluation', async () => {
      const { company, deliverable } = await submittedDeliverable();
      await company.client
        .get(`/api/v1/deliverables/${deliverable.id}/evaluation`)
        .expect(404);
    });
  });
});
