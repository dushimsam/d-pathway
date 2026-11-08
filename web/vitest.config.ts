import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      // Cover the testable units: pure helpers/hooks and the components. Pages are
      // integration-heavy (server data, Next routing) and excluded from unit scope,
      // as are type-only and environment-bound server modules.
      include: ['src/lib/**/*.ts', 'src/components/**/*.tsx'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/lib/types.ts',
        'src/lib/server-api.ts',
        'src/lib/auth-cookie.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
});
