import { getDb, promisify, txDone } from './idb.js';

export class ConflictError extends Error {}
export class NotFoundError extends Error {}
export class BadRequestError extends Error {}

function toTagDto(record) {
  return { id: record.id, name: record.name, createdAt: record.createdAt };
}

async function tagNameTaken(nameLower, excludeId = null) {
  const db = await getDb();
  const tx = db.transaction('tags', 'readonly');
  const existing = await promisify(tx.objectStore('tags').index('nameLower').get(nameLower));
  await txDone(tx);
  return Boolean(existing) && existing.id !== excludeId;
}

// INSERT OR IGNORE via the unique (photoId, tagId) index. An unhandled
// request error aborts the whole transaction per the IndexedDB spec, so
// a duplicate-key ConstraintError must call preventDefault() to keep the
// transaction alive for the remaining inserts in the loop.
function insertJoinIgnore(store, photoId, tagId) {
  return new Promise((resolve, reject) => {
    const request = store.add({ photoId, tagId });
    request.onsuccess = () => resolve(true);
    request.onerror = (event) => {
      if (request.error?.name === 'ConstraintError') {
        event.preventDefault();
        resolve(false);
      } else {
        reject(request.error);
      }
    };
  });
}

export async function listTags() {
  const db = await getDb();
  const tx = db.transaction(['tags', 'photoTags'], 'readonly');
  const tags = await promisify(tx.objectStore('tags').getAll());
  const result = [];
  for (const tag of tags) {
    const rows = await promisify(tx.objectStore('photoTags').index('tagId').getAll(tag.id));
    result.push({ ...toTagDto(tag), photoCount: rows.length });
  }
  await txDone(tx);
  result.sort((a, b) => b.id - a.id);
  return result;
}

export async function getTag(id) {
  const db = await getDb();
  const tx = db.transaction('tags', 'readonly');
  const record = await promisify(tx.objectStore('tags').get(id));
  await txDone(tx);
  return record ? toTagDto(record) : null;
}

export async function createTagWithPhotos(name, photoIds) {
  const nameLower = name.toLowerCase();
  if (await tagNameTaken(nameLower)) throw new ConflictError('TAG_NAME_TAKEN');

  const db = await getDb();
  const tx = db.transaction(['tags', 'photoTags'], 'readwrite');
  let tagId;
  try {
    tagId = await promisify(tx.objectStore('tags').add({ name, nameLower, createdAt: new Date().toISOString() }));
  } catch (err) {
    // An unhandled add() error already aborts the transaction per spec;
    // no need to (and mustn't) call tx.abort() again here.
    throw err?.name === 'ConstraintError' ? new ConflictError('TAG_NAME_TAKEN') : err;
  }

  const joinStore = tx.objectStore('photoTags');
  let addedCount = 0;
  for (const photoId of photoIds) {
    if (await insertJoinIgnore(joinStore, photoId, tagId)) addedCount++;
  }
  await txDone(tx);
  return { tag: await getTag(tagId), addedCount };
}

export async function addPhotosToTag(tagId, photoIds) {
  const tag = await getTag(tagId);
  if (!tag) throw new NotFoundError('TAG_NOT_FOUND');

  const db = await getDb();
  const tx = db.transaction('photoTags', 'readwrite');
  const joinStore = tx.objectStore('photoTags');
  let addedCount = 0;
  for (const photoId of photoIds) {
    if (await insertJoinIgnore(joinStore, photoId, tagId)) addedCount++;
  }
  await txDone(tx);
  return { tag, addedCount };
}

export async function removePhotoFromTag(tagId, photoId) {
  const db = await getDb();
  const tx = db.transaction('photoTags', 'readwrite');
  const row = await promisify(tx.objectStore('photoTags').index('photoId_tagId').get([photoId, tagId]));
  if (row) await promisify(tx.objectStore('photoTags').delete(row.id));
  await txDone(tx);
}

export async function deleteTag(id) {
  const db = await getDb();
  const tx = db.transaction(['tags', 'photoTags'], 'readwrite');
  const existing = await promisify(tx.objectStore('tags').get(id));
  if (!existing) {
    await txDone(tx);
    return false;
  }
  await promisify(tx.objectStore('tags').delete(id));
  const joinRows = await promisify(tx.objectStore('photoTags').index('tagId').getAll(id));
  for (const row of joinRows) {
    await promisify(tx.objectStore('photoTags').delete(row.id));
  }
  await txDone(tx);
  return true;
}

export async function renameTag(id, name) {
  const nameLower = name.toLowerCase();
  if (await tagNameTaken(nameLower, id)) throw new ConflictError('TAG_NAME_TAKEN');

  const db = await getDb();
  const tx = db.transaction('tags', 'readwrite');
  const existing = await promisify(tx.objectStore('tags').get(id));
  if (!existing) {
    await txDone(tx);
    throw new NotFoundError('TAG_NOT_FOUND');
  }
  await promisify(tx.objectStore('tags').put({ ...existing, name, nameLower }));
  await txDone(tx);
  return getTag(id);
}

// Merges N source folders (tags) into a brand-new tag containing the union
// of their photos. Source tags and their photoTags rows are only ever read
// (getAll) here, never updated/deleted — so original tag assignments
// survive completely untouched. Mirrors server/src/services/tags.service.js.
export async function mergeTags(sourceTagIds, newName) {
  const uniqueIds = [...new Set(sourceTagIds)];
  if (uniqueIds.length < 2) throw new BadRequestError('NEED_AT_LEAST_TWO_SOURCE_TAGS');

  const db = await getDb();

  const checkTx = db.transaction('tags', 'readonly');
  const tagsStoreRO = checkTx.objectStore('tags');
  for (const id of uniqueIds) {
    const found = await promisify(tagsStoreRO.get(id));
    if (!found) {
      await txDone(checkTx);
      throw new NotFoundError('TAG_NOT_FOUND');
    }
  }
  await txDone(checkTx);

  const nameLower = newName.toLowerCase();
  if (await tagNameTaken(nameLower)) throw new ConflictError('TAG_NAME_TAKEN');

  const tx = db.transaction(['tags', 'photoTags'], 'readwrite');
  let newTagId;
  try {
    newTagId = await promisify(
      tx.objectStore('tags').add({ name: newName, nameLower, createdAt: new Date().toISOString() })
    );
  } catch (err) {
    // An unhandled add() error already aborts the transaction per spec;
    // no need to (and mustn't) call tx.abort() again here.
    throw err?.name === 'ConstraintError' ? new ConflictError('TAG_NAME_TAKEN') : err;
  }

  const joinStore = tx.objectStore('photoTags');
  const unionPhotoIds = new Set();
  for (const sourceId of uniqueIds) {
    const rows = await promisify(joinStore.index('tagId').getAll(sourceId));
    for (const row of rows) unionPhotoIds.add(row.photoId);
  }
  for (const photoId of unionPhotoIds) {
    await insertJoinIgnore(joinStore, photoId, newTagId);
  }
  await txDone(tx);

  return { tag: await getTag(newTagId), photoCount: unionPhotoIds.size };
}
