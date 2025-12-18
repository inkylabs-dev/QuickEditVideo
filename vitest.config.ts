/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: true,
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['tests/e2e/**/*'],
  },
});
