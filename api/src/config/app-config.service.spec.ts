import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConfigService } from './app-config.service.js';

function make(values: Record<string, unknown>) {
  const config = {
    getOrThrow: vi.fn((key: string) => values[key]),
  };
  const service = new AppConfigService(config as never);
  return { service, config };
}

const VALUES = {
  NODE_ENV: 'test',
  PORT: 3000,
  CORS_ORIGIN: 'http://localhost',
  DATABASE_URL: 'postgres://db',
  REDIS_URL: 'redis://cache',
  JWT_SECRET: 'secret',
  JWT_EXPIRES_IN: '1d',
  CLOUDINARY_CLOUD_NAME: 'cloud',
  CLOUDINARY_API_KEY: 'ck',
  CLOUDINARY_API_SECRET: 'cs',
  CLOUDINARY_UPLOAD_FOLDER: 'capstone',
  STRIPE_SECRET_KEY: 'sk',
  STRIPE_CURRENCY: 'usd',
  RESEND_API_KEY: 'rk',
  MAIL_FROM: 'from@x.com',
};

beforeEach(() => vi.clearAllMocks());

describe('AppConfigService getters', () => {
  it('maps scalar config keys', () => {
    const { service } = make(VALUES);
    expect(service.nodeEnv).toBe('test');
    expect(service.port).toBe(3000);
    expect(service.corsOrigin).toBe('http://localhost');
    expect(service.databaseUrl).toBe('postgres://db');
    expect(service.redisUrl).toBe('redis://cache');
    expect(service.jwtSecret).toBe('secret');
    expect(service.jwtExpiresIn).toBe('1d');
  });

  it('derives isProduction from NODE_ENV', () => {
    expect(make(VALUES).service.isProduction).toBe(false);
    expect(make({ ...VALUES, NODE_ENV: 'production' }).service.isProduction).toBe(true);
  });

  it('maps the cloudinary group', () => {
    const { service } = make(VALUES);
    expect(service.cloudinary).toEqual({
      cloudName: 'cloud',
      apiKey: 'ck',
      apiSecret: 'cs',
      uploadFolder: 'capstone',
    });
  });

  it('maps the stripe group', () => {
    expect(make(VALUES).service.stripe).toEqual({ secretKey: 'sk', currency: 'usd' });
  });

  it('maps the mail group', () => {
    expect(make(VALUES).service.mail).toEqual({ apiKey: 'rk', from: 'from@x.com' });
  });
});
