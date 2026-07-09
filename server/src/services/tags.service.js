import { db, transaction } from '../db/connection.js';

export class ConflictError extends Error {}
export class NotFoundError extends Error {}
export class BadRequestError extends Error {}

function tagNameTaken(name, excludeId = null) {
  const row = excludeId
    ? db.prepare('SELECT id FROM tags WHERE name = ? COLLATE NOCASE AND id != ?').get(name, excludeId)
    : db.prepare('SELECT id FROM tags WHERE name = ? COLLATE NOCASE').get(name);
  return Boolean(row);
}

export function listTags() {
  return db
    .prepare(
      `SELECT t.id, t.name, t.created_at AS createdAt, COUNT(pt.photo_id) AS photoCount
       FROM tags t LEFT JOIN photo_tags pt ON pt.tag_id = t.id
       GROUP BY t.id ORDER BY t.created_at DESC`
    )
    .all();
}

export function getTag(id) {
  return db.prepare('SELECT id, name, created_at AS createdAt FROM tags WHERE id = ?').get(id);
}

export function createTagWithPhotos(name, photoIds) {
  if (tagNameTaken(name)) throw new ConflictError('TAG_NAME_TAKEN');

  return transaction(() => {
    const { lastInsertRowid: tagId } = db.prepare('INSERT INTO tags (name) VALUES (?)').run(name);
    const insertJoin = db.prepare('INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)');
    let addedCount = 0;
    for (const photoId of photoIds) {
      addedCount += insertJoin.run(photoId, tagId).changes;
    }
    return { tag: getTag(tagId), addedCount };
  })();
}

export function addPhotosToTag(tagId, photoIds) {
  const tag = getTag(tagId);
  if (!tag) throw new NotFoundError('TAG_NOT_FOUND');

  return transaction(() => {
    const insertJoin = db.prepare('INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)');
    let addedCount = 0;
    for (const photoId of photoIds) {
      addedCount += insertJoin.run(photoId, tagId).changes;
    }
    return { tag, addedCount };
  })();
}

export function removePhotoFromTag(tagId, photoId) {
  db.prepare('DELETE FROM photo_tags WHERE tag_id = ? AND photo_id = ?').run(tagId, photoId);
}

export function deleteTag(id) {
  const result = db.prepare('DELETE FROM tags WHERE id = ?').run(id); // cascades photo_tags only
  return result.changes > 0;
}

export function renameTag(id, name) {
  if (tagNameTaken(name, id)) throw new ConflictError('TAG_NAME_TAKEN');
  const result = db.prepare('UPDATE tags SET name = ? WHERE id = ?').run(name, id);
  if (result.changes === 0) throw new NotFoundError('TAG_NOT_FOUND');
  return getTag(id);
}

// Merges N source folders (tags) into a brand-new tag containing the union
// of their photos. Source tags and their photo_tags rows are only ever
// SELECTed here, never UPDATEd/DELETEd, so original tag assignments survive
// completely untouched.
export function mergeTags(sourceTagIds, newName) {
  const uniqueIds = [...new Set(sourceTagIds)];
  if (uniqueIds.length < 2) throw new BadRequestError('NEED_AT_LEAST_TWO_SOURCE_TAGS');

  const existingTags = uniqueIds.map((id) => getTag(id));
  const missing = existingTags.some((t) => !t);
  if (missing) throw new NotFoundError('TAG_NOT_FOUND');

  if (tagNameTaken(newName)) throw new ConflictError('TAG_NAME_TAKEN');

  return transaction(() => {
    const { lastInsertRowid: newTagId } = db.prepare('INSERT INTO tags (name) VALUES (?)').run(newName);

    const placeholders = uniqueIds.map(() => '?').join(',');
    db.prepare(
      `INSERT OR IGNORE INTO photo_tags (photo_id, tag_id)
       SELECT DISTINCT pt.photo_id, ?
       FROM photo_tags pt
       WHERE pt.tag_id IN (${placeholders})`
    ).run(newTagId, ...uniqueIds);

    const photoCount = db.prepare('SELECT COUNT(*) AS c FROM photo_tags WHERE tag_id = ?').get(newTagId).c;

    return { tag: getTag(newTagId), photoCount };
  })();
}
