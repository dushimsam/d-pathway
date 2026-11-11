import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Runs BOTH suites in a single pass — the colocated unit specs and the
 * integration specs (which boot the real app over Testcontainers) — so the
 * coverage report is the true UNION of the two. Use via `npm run test:coverage:all`.
 * Requires Docker (the integration specs start Postgres + Redis containers).
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/integration/**/*.integration.spec.ts'],
    root: './',
    // Integration harness: start/stop containers once, and set env (incl. this
    // worker's DATABASE_URL/REDIS_URL) before any spec imports AppModule.
    globalSetup: ['test/integration/support/global-setup.ts'],
    setupFiles: ['test/integration/support/setup-env.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    pool: 'forks',
    coverage: {
      // On by default for this config, so the single command reports coverage.
      enabled: true,
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      // Measure the whole codebase, minus declarative wiring and generated code.
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.module.ts',
        'src/main.ts',
        'src/database/migrations/**',
        'src/database/data-source.ts',
      ],
      reportsDirectory: 'coverage/combined',
    },
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
