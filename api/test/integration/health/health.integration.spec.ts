import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';

describe('Health (integration)', () => {
  let ctx: IntegrationApp;

  beforeAll(async () => {
    ctx = await createIntegrationApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('GET /api/v1/health reports the app and a live database as ok', async () => {
    const res = await request(ctx.server).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', db: 'ok' });
  });
});
