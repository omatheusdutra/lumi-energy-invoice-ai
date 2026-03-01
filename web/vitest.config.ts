import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [['**/*.spec.tsx', 'jsdom']],
    setupFiles: ['./test/setup.ts'],
    include: ['./test/**/*.spec.ts', './test/**/*.spec.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      all: true,
      include: [
        'lib/api/schemas.ts',
        'lib/api/query-schemas.ts',
        'lib/api/query-keys.ts',
        'lib/dashboard/dashboard-dto.ts',
        'lib/env.ts',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
});
