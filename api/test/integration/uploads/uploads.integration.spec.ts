import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';
import { anonymous, registerCompany, registerGraduate } from '../support/factory.js';

describe('Uploads (integration)', () => {
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

  describe('POST /uploads/sign', () => {
    it('signs an upload for a graduate, namespacing the folder under the root', async () => {
      const grad = await registerGraduate(ctx.server);
      const res = await grad.client
        .post('/api/v1/uploads/sign', { folder: 'deliverables' })
        .expect(200);

      expect(typeof res.body.signature).toBe('string');
      expect(res.body.signature.length).toBeGreaterThan(0);
      expect(res.body.apiKey).toBeTruthy();
      expect(res.body.folder).toBe('capstone-test/deliverables');
    });

    it('signs an upload for a company', async () => {
      const company = await registerCompany(ctx.server);
      await company.client
        .post('/api/v1/uploads/sign', { folder: 'deliverables' })
        .expect(200);
    });

    it('rejects a folder with invalid characters (400)', async () => {
      const grad = await registerGraduate(ctx.server);
      await grad.client
        .post('/api/v1/uploads/sign', { folder: 'bad folder!' })
        .expect(400);
    });

    it('rejects an unauthenticated request (401)', async () => {
      await anonymous(ctx.server)
        .post('/api/v1/uploads/sign', { folder: 'deliverables' })
        .expect(401);
    });
  });
});
