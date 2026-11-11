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
  type TestCompany,
  type TestGraduate,
} from '../support/factory.js';

describe('Team memberships (integration)', () => {
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
   * Stand up a company + open project, a lead graduate with a PENDING
   * application, and a fresh invitee graduate. The building block for every
   * membership scenario below.
   */
  async function teamSetup(): Promise<{
    company: TestCompany;
    project: Record<string, any>;
    lead: TestGraduate;
    app: Record<string, any>;
    invitee: TestGraduate;
  }> {
    const company = await registerCompany(ctx.server);
    const project = await createOpenProject(company);
    const lead = await registerGraduate(ctx.server);
    const app = await applyToProject(lead, project.id);
    const invitee = await registerGraduate(ctx.server);
    return { company, project, lead, app, invitee };
  }

  describe('POST /applications/:id/invitations', () => {
    it('lets the lead invite an existing graduate by email (201, INVITED)', async () => {
      const { lead, app, invitee } = await teamSetup();
      const res = await lead.client
        .post(`/api/v1/applications/${app.id}/invitations`, {
          email: invitee.email,
        })
        .expect(201);
      expect(res.body).toMatchObject({
        status: 'INVITED',
        graduateId: invitee.graduateId,
        applicationId: app.id,
      });
      expect(res.body.id).toBeTruthy();
    });

    it('forbids a non-lead graduate from inviting on the application (403)', async () => {
      const { lead, app, invitee } = await teamSetup();
      const third = await registerGraduate(ctx.server);
      await third.client
        .post(`/api/v1/applications/${app.id}/invitations`, {
          email: invitee.email,
        })
        .expect(403);
    });

    it('rejects inviting an email with no account (404)', async () => {
      const { lead, app } = await teamSetup();
      await lead.client
        .post(`/api/v1/applications/${app.id}/invitations`, {
          email: 'nobody@nowhere.test',
        })
        .expect(404);
    });

    it('rejects inviting a graduate who already applied to the project (400)', async () => {
      const { project, lead, app } = await teamSetup();
      const grad2 = await registerGraduate(ctx.server);
      await applyToProject(grad2, project.id);
      await lead.client
        .post(`/api/v1/applications/${app.id}/invitations`, {
          email: grad2.email,
        })
        .expect(400);
    });

    it('rejects inviting once the application is no longer pending (400)', async () => {
      const { company, lead, app, invitee } = await teamSetup();
      await acceptApplication(company, app.id);
      await lead.client
        .post(`/api/v1/applications/${app.id}/invitations`, {
          email: invitee.email,
        })
        .expect(400);
    });
  });

  describe('GET /invitations/mine', () => {
    it('shows the invitee their pending invitation with project context', async () => {
      const { project, lead, app, invitee } = await teamSetup();
      await lead.client
        .post(`/api/v1/applications/${app.id}/invitations`, {
          email: invitee.email,
        })
        .expect(201);

      const res = await invitee.client
        .get('/api/v1/invitations/mine')
        .expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].application.project.title).toBe(project.title);
      expect(res.body[0].application.id).toBe(app.id);
    });
  });

  describe('POST /invitations/:id/accept', () => {
    it('lets the invitee accept, then the team roster shows them ACCEPTED', async () => {
      const { lead, app, invitee } = await teamSetup();
      const invite = await lead.client
        .post(`/api/v1/applications/${app.id}/invitations`, {
          email: invitee.email,
        })
        .expect(201);

      const accepted = await invitee.client
        .post(`/api/v1/invitations/${invite.body.id}/accept`)
        .expect(200);
      expect(accepted.body.status).toBe('ACCEPTED');

      const team = await lead.client
        .get(`/api/v1/applications/${app.id}/team`)
        .expect(200);
      expect(team.body.lead.graduateId).toBe(lead.graduateId);
      const member = team.body.members.find(
        (m: any) => m.graduateId === invitee.graduateId,
      );
      expect(member).toBeDefined();
      expect(member.status).toBe('ACCEPTED');
    });

    it('forbids accepting an invitation addressed to someone else (403)', async () => {
      const { lead, app, invitee } = await teamSetup();
      const invite = await lead.client
        .post(`/api/v1/applications/${app.id}/invitations`, {
          email: invitee.email,
        })
        .expect(201);
      const other = await registerGraduate(ctx.server);
      await other.client
        .post(`/api/v1/invitations/${invite.body.id}/accept`)
        .expect(403);
    });
  });

  describe('POST /invitations/:id/decline', () => {
    it('lets the invitee decline a fresh invitation (200, DECLINED)', async () => {
      const { lead, app, invitee } = await teamSetup();
      const invite = await lead.client
        .post(`/api/v1/applications/${app.id}/invitations`, {
          email: invitee.email,
        })
        .expect(201);
      const declined = await invitee.client
        .post(`/api/v1/invitations/${invite.body.id}/decline`)
        .expect(200);
      expect(declined.body.status).toBe('DECLINED');
    });
  });

  describe('GET /applications/:id/team', () => {
    it('forbids an unrelated graduate from reading the roster (403)', async () => {
      const { app } = await teamSetup();
      const stranger = await registerGraduate(ctx.server);
      await stranger.client
        .get(`/api/v1/applications/${app.id}/team`)
        .expect(403);
    });
  });
});
