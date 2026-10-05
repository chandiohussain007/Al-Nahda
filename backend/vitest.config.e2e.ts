import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Booting a full Nest application and connecting to Postgres can exceed the
    // 10s default on a loaded machine or a slow CI runner.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
