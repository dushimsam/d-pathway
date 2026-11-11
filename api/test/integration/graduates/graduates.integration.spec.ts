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

describe('Graduates (integration)', () => {
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

  describe('GET /graduates/me', () => {
    it('returns the profile created at registration', async () => {
      const grad = await registerGraduate(ctx.server, {
        fullName: 'Grace Hopper',
      });
      const res = await grad.client.get('/api/v1/graduates/me').expect(200);
      expect(res.body.id).toBe(grad.graduateId);
      expect(res.body.fullName).toBe('Grace Hopper');
    });

    it('forbids a company from reading the graduate profile (403)', async () => {
      const company = await registerCompany(ctx.server);
      await company.client.get('/api/v1/graduates/me').expect(403);
    });

    it('rejects a request with no token (401)', async () => {
      await anonymous(ctx.server).get('/api/v1/graduates/me').expect(401);
    });
  });

  describe('PATCH /graduates/me', () => {
    it('updates the full name and returns it', async () => {
      const grad = await registerGraduate(ctx.server);
      const res = await grad.client
        .patch('/api/v1/graduates/me', { fullName: 'Ada Lovelace' })
        .expect(200);
      expect(res.body.fullName).toBe('Ada Lovelace');
    });

    it('normalises skills to lowercase and trimmed', async () => {
      const grad = await registerGraduate(ctx.server);
      const res = await grad.client
        .patch('/api/v1/graduates/me', { skills: ['React', '  TypeScript '] })
        .expect(200);
      expect(res.body.skills).toEqual(['react', 'typescript']);
    });

    it('rejects an invalid link (400)', async () => {
      const grad = await registerGraduate(ctx.server);
      await grad.client
        .patch('/api/v1/graduates/me', { links: ['not-a-url'] })
        .expect(400);
    });
  });
});
