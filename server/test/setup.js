import { beforeEach } from 'vitest';
import { migrate, resetDb } from '../src/db/migrate.js';

migrate();
beforeEach(() => {
  resetDb();
});
