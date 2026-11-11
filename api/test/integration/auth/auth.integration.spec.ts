import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  createIntegrationApp,
  type IntegrationApp,
} from '../support/integration-app.js';

const graduate = {
  email: 'Grace.Graduate@Example.com',
  password: 'sup3r-secret-pw',
  fullName: 'Grace Graduate',
  education: 'BSc Software Engineering, ALU',
  skills: ['typescript', 'react'],
  location: 'Kigali',
};

describe('Auth (integration)', () => {
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

  describe('POST /api/v1/auth/register/graduate', () => {
    it('creates the account and returns a token + the graduate view', async () => {
      const res = await request(ctx.server)
        .post('/api/v1/auth/register/graduate')
        .send(graduate);

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({
        // Email is normalised to lowercase on the way in.
        email: graduate.email.toLowerCase(),
        role: 'GRADUATE',
      });
      expect(res.body.user.id).toEqual(expect.any(String));
    });

    it('rejects a duplicate email with 409', async () => {
      await request(ctx.server)
        .post('/api/v1/auth/register/graduate')
        .send(graduate)
        .expect(201);

      const res = await request(ctx.server)
        .post('/api/v1/auth/register/graduate')
        .send(graduate);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('rejects an invalid body with 400', async () => {
      const res = await request(ctx.server)
        .post('/api/v1/auth/register/graduate')
        .send({ email: 'not-an-email', password: 'short', fullName: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns a token for correct credentials', async () => {
      await request(ctx.server)
        .post('/api/v1/auth/register/graduate')
        .send(graduate)
        .expect(201);

      const res = await request(ctx.server)
        .post('/api/v1/auth/login')
        // Different casing proves email normalisation on login too.
        .send({ email: graduate.email.toUpperCase(), password: graduate.password });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user.role).toBe('GRADUATE');
    });

    it('rejects a wrong password with 401', async () => {
      await request(ctx.server)
        .post('/api/v1/auth/register/graduate')
        .send(graduate)
        .expect(201);

      const res = await request(ctx.server)
        .post('/api/v1/auth/login')
        .send({ email: graduate.email, password: 'wrong-password' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns the current user and profile for a valid bearer token', async () => {
      const registered = await request(ctx.server)
        .post('/api/v1/auth/register/graduate')
        .send(graduate)
        .expect(201);
      const token = registered.body.accessToken as string;

      const res = await request(ctx.server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        email: graduate.email.toLowerCase(),
        role: 'GRADUATE',
      });
      expect(res.body.profile).toMatchObject({ fullName: graduate.fullName });
    });

    it('rejects a request with no token (global JwtAuthGuard) with 401', async () => {
      const res = await request(ctx.server).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/register/company', () => {
    const company = {
      email: 'owner@acme.test',
      password: 'sup3r-secret-pw',
      companyName: 'Acme Inc',
      industry: 'Software',
      title: 'CTO',
    };

    it('creates a company account and returns a token + company view', async () => {
      const res = await request(ctx.server)
        .post('/api/v1/auth/register/company')
        .send(company);

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({
        email: company.email,
        role: 'COMPANY',
      });
    });

    it('rejects a duplicate company name with 409', async () => {
      await request(ctx.server)
        .post('/api/v1/auth/register/company')
        .send(company)
        .expect(201);

      const res = await request(ctx.server)
        .post('/api/v1/auth/register/company')
        .send({ ...company, email: 'someone-else@acme.test' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('changes the password and lets the user log in with the new one', async () => {
      const registered = await request(ctx.server)
        .post('/api/v1/auth/register/graduate')
        .send(graduate)
        .expect(201);
      const token = registered.body.accessToken as string;

      await request(ctx.server)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: graduate.password, newPassword: 'a-new-password' })
        .expect(200);

      await request(ctx.server)
        .post('/api/v1/auth/login')
        .send({ email: graduate.email, password: 'a-new-password' })
        .expect(200);

      await request(ctx.server)
        .post('/api/v1/auth/login')
        .send({ email: graduate.email, password: graduate.password })
        .expect(401);
    });

    it('rejects a wrong current password with 401', async () => {
      const registered = await request(ctx.server)
        .post('/api/v1/auth/register/graduate')
        .send(graduate)
        .expect(201);
      const token = registered.body.accessToken as string;

      await request(ctx.server)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'not-it', newPassword: 'a-new-password' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/auth/me', () => {
    it('deletes the account after a password check, and login then fails', async () => {
      const registered = await request(ctx.server)
        .post('/api/v1/auth/register/graduate')
        .send(graduate)
        .expect(201);
      const token = registered.body.accessToken as string;

      await request(ctx.server)
        .delete('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: graduate.password })
        .expect(200);

      await request(ctx.server)
        .post('/api/v1/auth/login')
        .send({ email: graduate.email, password: graduate.password })
        .expect(401);
    });

    it('rejects deletion with a wrong password (401)', async () => {
      const registered = await request(ctx.server)
        .post('/api/v1/auth/register/graduate')
        .send(graduate)
        .expect(201);
      const token = registered.body.accessToken as string;

      await request(ctx.server)
        .delete('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'wrong' })
        .expect(401);
    });
  });
});
