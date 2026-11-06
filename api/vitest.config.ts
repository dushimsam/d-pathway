import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    root: './',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      // Cover the code that carries behaviour: services and domain rules.
      // Framework wiring (modules, entities, DTOs, config, migrations, main) is
      // either declarative or exercised by the e2e smoke tests, not unit tests.
      include: ['src/**/*.service.ts', 'src/**/rules/*.ts'],
      exclude: ['src/**/*.spec.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
  plugins: [
    // SWC transforms decorators + emits metadata so Nest DI works under Vitest.
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
