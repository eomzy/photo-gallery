import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      GALLERY_DB_PATH: ':memory:',
    },
    setupFiles: ['./test/setup.js'],
  },
});
