import fs from 'fs';
import path from 'path';
import { db } from '../db/connection.js';
import { uploadDir, thumbDir } from '../middleware/upload.middleware.js';

function toPhotoDto(row) {
  return {
    id: row.id,
    url: `/uploads/${row.filename}`,
    thumbUrl: row.thumb_filename ? `/uploads/thumbs/${row.thumb_filename}` : `/uploads/${row.filename}`,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  };
}

export function insertPhoto({ filename, originalName, thumbFilename, mimeType, sizeBytes, width, height }) {
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO photos (filename, original_name, thumb_filename, mime_type, size_bytes, width, height)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(filename, originalName, thumbFilename, mimeType, sizeBytes, width, height);
  return getPhotoById(lastInsertRowid);
}

export function getPhotoById(id) {
  const row = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
  if (!row) return null;
  const tags = db
    .prepare(`SELECT t.id, t.name FROM photo_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.photo_id = ?`)
    .all(id);
  return { ...toPhotoDto(row), tags };
}

export function listPhotos({ tagId } = {}) {
  const rows = tagId
    ? db
        .prepare(
          `SELECT p.* FROM photos p JOIN photo_tags pt ON pt.photo_id = p.id
           WHERE pt.tag_id = ? ORDER BY p.created_at DESC`
        )
        .all(tagId)
    : db.prepare('SELECT * FROM photos ORDER BY created_at DESC').all();

  if (rows.length === 0) return [];

  const tagRows = db
    .prepare(
      `SELECT pt.photo_id AS photoId, t.id, t.name FROM photo_tags pt
       JOIN tags t ON t.id = pt.tag_id
       WHERE pt.photo_id IN (${rows.map(() => '?').join(',')})`
    )
    .all(...rows.map((r) => r.id));

  const tagsByPhotoId = new Map();
  for (const tr of tagRows) {
    if (!tagsByPhotoId.has(tr.photoId)) tagsByPhotoId.set(tr.photoId, []);
    tagsByPhotoId.get(tr.photoId).push({ id: tr.id, name: tr.name });
  }

  return rows.map((row) => ({ ...toPhotoDto(row), tags: tagsByPhotoId.get(row.id) ?? [] }));
}

export function deletePhoto(id) {
  const row = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
  if (!row) return false;

  db.prepare('DELETE FROM photos WHERE id = ?').run(id); // cascades photo_tags

  for (const [dir, filename] of [
    [uploadDir, row.filename],
    [thumbDir, row.thumb_filename],
  ]) {
    if (!filename) continue;
    const filePath = path.join(dir, filename);
    fs.rm(filePath, { force: true }, () => {});
  }

  return true;
}
