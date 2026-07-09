import { getDb, promisify, txDone } from './idb.js';

// URL.createObjectURL isn't implemented in the jsdom test environment;
// fall back to a stable placeholder there so store-layer tests can run
// without touching real Blob URLs (rendering is covered separately).
const canCreateObjectUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';

const urlCache = new Map(); // photoId -> { url, thumbUrl }

function getUrls(record) {
  let cached = urlCache.get(record.id);
  if (!cached) {
    const url = canCreateObjectUrl ? URL.createObjectURL(record.blob) : `blob:test-${record.id}`;
    const thumbUrl = !record.thumbBlob
      ? url
      : canCreateObjectUrl
        ? URL.createObjectURL(record.thumbBlob)
        : `blob:test-thumb-${record.id}`;
    cached = { url, thumbUrl };
    urlCache.set(record.id, cached);
  }
  return cached;
}

function revokeUrls(photoId) {
  const cached = urlCache.get(photoId);
  if (!cached) return;
  if (canCreateObjectUrl) {
    URL.revokeObjectURL(cached.url);
    if (cached.thumbUrl !== cached.url) URL.revokeObjectURL(cached.thumbUrl);
  }
  urlCache.delete(photoId);
}

// Test-only: the cache is keyed by photo id, which resets to 1 whenever
// a test wipes the database, so stale entries from earlier tests must be
// cleared alongside resetConnectionForTests().
export function resetUrlCacheForTests() {
  urlCache.clear();
}

function toPhotoDto(record, tags = []) {
  const { url, thumbUrl } = getUrls(record);
  return {
    id: record.id,
    url,
    thumbUrl,
    originalName: record.originalName,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    width: record.width,
    height: record.height,
    createdAt: record.createdAt,
    tags,
  };
}

async function getTagsForPhoto(tx, photoId) {
  const joinRows = await promisify(tx.objectStore('photoTags').index('photoId').getAll(photoId));
  const tags = [];
  for (const row of joinRows) {
    const tag = await promisify(tx.objectStore('tags').get(row.tagId));
    if (tag) tags.push({ id: tag.id, name: tag.name });
  }
  return tags;
}

export async function insertPhoto({ blob, thumbBlob, originalName, mimeType, sizeBytes, width, height }) {
  const db = await getDb();
  const tx = db.transaction('photos', 'readwrite');
  const record = {
    blob,
    thumbBlob,
    originalName,
    mimeType,
    sizeBytes,
    width,
    height,
    createdAt: new Date().toISOString(),
  };
  const id = await promisify(tx.objectStore('photos').add(record));
  await txDone(tx);
  return toPhotoDto({ ...record, id });
}

export async function getPhotoById(id) {
  const db = await getDb();
  const tx = db.transaction(['photos', 'photoTags', 'tags'], 'readonly');
  const record = await promisify(tx.objectStore('photos').get(id));
  if (!record) {
    await txDone(tx);
    return null;
  }
  const tags = await getTagsForPhoto(tx, id);
  await txDone(tx);
  return toPhotoDto(record, tags);
}

export async function listPhotos({ tagId } = {}) {
  const db = await getDb();
  const tx = db.transaction(['photos', 'photoTags', 'tags'], 'readonly');

  let records;
  if (tagId != null) {
    const joinRows = await promisify(tx.objectStore('photoTags').index('tagId').getAll(tagId));
    records = [];
    for (const row of joinRows) {
      const record = await promisify(tx.objectStore('photos').get(row.photoId));
      if (record) records.push(record);
    }
  } else {
    records = await promisify(tx.objectStore('photos').getAll());
  }

  const photos = [];
  for (const record of records) {
    const tags = await getTagsForPhoto(tx, record.id);
    photos.push(toPhotoDto(record, tags));
  }
  await txDone(tx);

  // id (autoincrement) is a reliable insertion-order proxy; createdAt's
  // millisecond resolution ties when photos are inserted in quick succession.
  photos.sort((a, b) => b.id - a.id);
  return photos;
}

export async function deletePhoto(id) {
  const db = await getDb();
  const tx = db.transaction(['photos', 'photoTags'], 'readwrite');
  const record = await promisify(tx.objectStore('photos').get(id));
  if (!record) {
    await txDone(tx);
    return false;
  }

  await promisify(tx.objectStore('photos').delete(id));
  const joinRows = await promisify(tx.objectStore('photoTags').index('photoId').getAll(id));
  for (const row of joinRows) {
    await promisify(tx.objectStore('photoTags').delete(row.id));
  }
  await txDone(tx);
  revokeUrls(id);
  return true;
}
