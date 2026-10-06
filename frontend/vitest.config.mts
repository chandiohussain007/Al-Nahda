import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        // The axios 401 interceptor skips navigation when already on /login,
        // which keeps these unit tests free of "not implemented" jsdom noise.
        url: 'http://localhost:3000/login',
      },
    },
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    testTimeout: 30_000,
  },
});
