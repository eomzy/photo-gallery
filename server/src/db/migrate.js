import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
}

// Test-only helper: wipes all rows so each test starts from a clean,
// already-migrated schema without re-creating the DatabaseSync instance.
export function resetDb() {
  db.exec('DELETE FROM photo_tags; DELETE FROM tags; DELETE FROM photos;');
}
