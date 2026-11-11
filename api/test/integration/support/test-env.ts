/**
 * Base test environment.
 *
 * Every value the Joi config schema (`src/config/config.schema.ts`) marks
 * required is set here so the integration app boots without depending on a
 * developer's `.env` — which is git-ignored and absent in CI. `DATABASE_URL`
 * and `REDIS_URL` are the exception: Testcontainers assigns them random ports
 * at runtime, so the container layer fills those in (see `container-info.ts`).
 *
 * These are applied BEFORE the Nest app's ConfigModule reads `process.env`, and
 * @nestjs/config lets existing `process.env` values win over the `.env` file, so
 * what we set here is authoritative.
 */
export const BASE_TEST_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '0',
  CORS_ORIGIN: 'http://localhost:3000',

  // Auth — a fixed secret so tokens minted in one spec validate in the next.
  JWT_SECRET: 'integration_test_jwt_secret_key_please_change',
  JWT_EXPIRES_IN: '24h',

  // Cloudinary is required by the schema but never reached in tests (uploads
  // are signed client-side). Dummy values satisfy validation.
  CLOUDINARY_CLOUD_NAME: 'test-cloud',
  CLOUDINARY_API_KEY: 'test-key',
  CLOUDINARY_API_SECRET: 'test-secret',
  CLOUDINARY_UPLOAD_FOLDER: 'capstone-test',

  // Stripe/Resend are optional in the schema; empty keeps the wallet and mailer
  // in their no-op/log-only mode so tests never hit a third party.
  STRIPE_SECRET_KEY: '',
  STRIPE_CURRENCY: 'rwf',
  RESEND_API_KEY: '',
  MAIL_FROM: 'onboarding@resend.dev',
};

/** Apply the base env onto `process.env` (does not touch DATABASE_URL/REDIS_URL). */
export function applyBaseTestEnv(): void {
  for (const [key, value] of Object.entries(BASE_TEST_ENV)) {
    process.env[key] = value;
  }
}
