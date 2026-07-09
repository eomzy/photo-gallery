import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Vite's SSR resolver (used by Vitest) doesn't yet recognize `node:sqlite`
// as a builtin and tries to resolve it as an npm package. Routing it
// through a real require() bypasses Vite's static import graph entirely.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tests set GALLERY_DB_PATH=':memory:' (or a temp file) before importing
// this module, so each test run gets an isolated database instead of the
// real gallery.db.
const dbPath = process.env.GALLERY_DB_PATH ?? path.join(path.resolve(__dirname, '../../data'), 'gallery.db');
if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Mirrors better-sqlite3's db.transaction(fn) API: wraps fn in BEGIN/COMMIT,
// rolling back on any thrown error, so callers stay unchanged.
export function transaction(fn) {
  return (...args) => {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
}
