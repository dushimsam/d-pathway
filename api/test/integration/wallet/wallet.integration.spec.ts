import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';
import {
  registerCompany,
  registerGraduate,
  runFullLifecycle,
} from '../support/factory.js';

describe('Wallet (integration)', () => {
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

  describe('GET /wallet', () => {
    it('returns the company wallet shape', async () => {
      const company = await registerCompany(ctx.server);
      const res = await company.client.get('/api/v1/wallet').expect(200);
      expect(res.body).toMatchObject({
        role: 'COMPANY',
        balance: 0,
        reserved: 0,
        transactions: [],
      });
      expect(res.body.currency).toBeTruthy();
    });

    it('returns the graduate wallet shape', async () => {
      const graduate = await registerGraduate(ctx.server);
      const res = await graduate.client.get('/api/v1/wallet').expect(200);
      expect(res.body).toMatchObject({
        role: 'GRADUATE',
        balance: 0,
        transactions: [],
      });
      expect(res.body.currency).toBeTruthy();
    });
  });

  describe('POST /wallet/topup', () => {
    it('tops up a company balance through the (mocked) checkout flow', async () => {
      const company = await registerCompany(ctx.server);

      const topup = await company.client
        .post('/api/v1/wallet/topup', { amount: 20_000 })
        .expect(201);
      expect(topup.body.url).toBeTruthy();

      const sid = new URL(topup.body.url).searchParams.get('session_id');
      expect(sid).toBeTruthy();

      const confirm = await company.client
        .get(`/api/v1/wallet/topup/confirm?session_id=${sid}`)
        .expect(200);
      expect(confirm.body).toMatchObject({ credited: true, balance: 20_000 });

      // Confirming the same session again is idempotent.
      const again = await company.client
        .get(`/api/v1/wallet/topup/confirm?session_id=${sid}`)
        .expect(200);
      expect(again.body.credited).toBe(false);
    });

    it('rejects a zero amount (400) and forbids graduates (403)', async () => {
      const company = await registerCompany(ctx.server);
      await company.client
        .post('/api/v1/wallet/topup', { amount: 0 })
        .expect(400);

      const graduate = await registerGraduate(ctx.server);
      await graduate.client
        .post('/api/v1/wallet/topup', { amount: 20_000 })
        .expect(403);
    });
  });

  describe('POST /wallet/withdrawals', () => {
    it('rejects withdrawing more than the balance (409)', async () => {
      const graduate = await registerGraduate(ctx.server);
      await graduate.client
        .post('/api/v1/wallet/withdrawals', { amount: 100 })
        .expect(409);
    });

    it('rejects a zero amount (400) and forbids companies (403)', async () => {
      const graduate = await registerGraduate(ctx.server);
      await graduate.client
        .post('/api/v1/wallet/withdrawals', { amount: 0 })
        .expect(400);

      const company = await registerCompany(ctx.server);
      await company.client
        .post('/api/v1/wallet/withdrawals', { amount: 100 })
        .expect(403);
    });

    it('withdraws from a prize-funded balance (200)', async () => {
      const { company, graduate, projectId } = await runFullLifecycle(
        ctx.server,
        ctx.dataSource,
        { prizeAmount: 30_000 },
      );
      await company.client
        .post(`/api/v1/projects/${projectId}/award`, {
          graduateId: graduate.graduateId,
        })
        .expect(201);

      const res = await graduate.client
        .post('/api/v1/wallet/withdrawals', { amount: 10_000 })
        .expect(200);
      expect(res.body.balance).toBe(20_000);
    });
  });
});
