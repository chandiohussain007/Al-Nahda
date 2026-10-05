import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // NestJS compiles a full DI graph inside `beforeEach`, which can exceed the
    // 10s default on a loaded machine or a slow CI runner.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
