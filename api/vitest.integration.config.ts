import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Integration tests: the real Nest app over real Postgres + Redis, spun up as
 * throwaway Docker containers by Testcontainers. Kept separate from the unit
 * config (`vitest.config.ts`) so `npm test` stays fast and Docker-free, and
 * `npm run test:integration` opts into the heavier suite.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/integration/**/*.integration.spec.ts'],
    root: './',
    // Start/stop the shared containers once around the whole run.
    globalSetup: ['test/integration/support/global-setup.ts'],
    // Populate env (incl. this worker's DATABASE_URL/REDIS_URL) before any test
    // file imports AppModule — ConfigModule validates process.env at import time.
    setupFiles: ['test/integration/support/setup-env.ts'],
    // Booting the app, building the schema, and pulling images on a cold cache
    // all take real time — be generous so a slow runner doesn't flake.
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // Each worker gets its own database + Redis logical DB, so files run in
    // parallel. Forks give clean process isolation for Nest's DI + TypeORM.
    pool: 'forks',
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2023',
        transform: { legacyDecorator: true, decoratorMetadata: true },
        parser: { syntax: 'typescript', decorators: true },
      },
    }),
  ],
});
