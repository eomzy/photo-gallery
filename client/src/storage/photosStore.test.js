import { describe, it, expect, beforeEach } from 'vitest';
import { resetConnectionForTests } from './idb.js';
import * as photosStore from './photosStore.js';
const { resetUrlCacheForTests } = photosStore;

async function freshDatabase() {
  await resetConnectionForTests();
  resetUrlCacheForTests();
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('photo-gallery');
    req.onsuccess = resolve;
    req.onerror = reject;
    req.onblocked = resolve;
  });
}

beforeEach(async () => {
  await freshDatabase();
});

function sampleBlob() {
  return new Blob(['fake-image-bytes'], { type: 'image/jpeg' });
}

function samplePhoto(overrides = {}) {
  return {
    blob: sampleBlob(),
    thumbBlob: sampleBlob(),
    originalName: '원본.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1234,
    width: 800,
    height: 600,
    ...overrides,
  };
}

describe('photosStore', () => {
  it('insertPhoto stores metadata and returns a DTO with url/thumbUrl and empty tags', async () => {
    const photo = await photosStore.insertPhoto(samplePhoto());

    expect(photo.originalName).toBe('원본.jpg');
    expect(photo.url).toBeTruthy();
    expect(photo.thumbUrl).toBeTruthy();
    expect(photo.width).toBe(800);
    expect(photo.tags).toEqual([]);
  });

  it('falls back to the original as thumbUrl when there is no thumbnail blob', async () => {
    const photo = await photosStore.insertPhoto(samplePhoto({ thumbBlob: undefined }));
    expect(photo.thumbUrl).toBe(photo.url);
  });

  it('listPhotos returns newest-first and getPhotoById finds a single photo', async () => {
    const first = await photosStore.insertPhoto(samplePhoto({ originalName: 'first.jpg' }));
    const second = await photosStore.insertPhoto(samplePhoto({ originalName: 'second.jpg' }));

    const all = await photosStore.listPhotos();
    expect(all.map((p) => p.id)).toEqual([second.id, first.id]);
    expect((await photosStore.getPhotoById(first.id)).originalName).toBe('first.jpg');
  });

  it('getPhotoById returns null for a missing photo', async () => {
    expect(await photosStore.getPhotoById(99999)).toBeNull();
  });

  it('deletePhoto removes the row and returns false on a second delete', async () => {
    const photo = await photosStore.insertPhoto(samplePhoto());

    expect(await photosStore.deletePhoto(photo.id)).toBe(true);
    expect(await photosStore.getPhotoById(photo.id)).toBeNull();
    expect(await photosStore.deletePhoto(photo.id)).toBe(false);
  });
});
