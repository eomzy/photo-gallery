import { describe, it, expect, beforeEach } from 'vitest';
import { resetConnectionForTests } from './idb.js';
import * as photosStore from './photosStore.js';
import * as tagsStore from './tagsStore.js';

async function freshDatabase() {
  await resetConnectionForTests();
  photosStore.resetUrlCacheForTests();
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

function makePhoto(name) {
  return photosStore.insertPhoto({
    blob: new Blob(['x'], { type: 'image/jpeg' }),
    thumbBlob: undefined,
    originalName: name,
    mimeType: 'image/jpeg',
    sizeBytes: 100,
    width: 100,
    height: 100,
  });
}

describe('tagsStore - create & list', () => {
  it('createTagWithPhotos creates a tag and attaches the given photos', async () => {
    const p1 = await makePhoto('a.jpg');
    const p2 = await makePhoto('b.jpg');

    const { tag, addedCount } = await tagsStore.createTagWithPhotos('여행', [p1.id, p2.id]);

    expect(tag.name).toBe('여행');
    expect(addedCount).toBe(2);
    expect(await tagsStore.listTags()).toEqual([expect.objectContaining({ id: tag.id, name: '여행', photoCount: 2 })]);
  });

  it('rejects a duplicate tag name, case-insensitively', async () => {
    await tagsStore.createTagWithPhotos('Family', []);
    await expect(tagsStore.createTagWithPhotos('family', [])).rejects.toBeInstanceOf(tagsStore.ConflictError);
  });

  it('addPhotosToTag adds new photos and ignores ones already in the tag', async () => {
    const p1 = await makePhoto('a.jpg');
    const p2 = await makePhoto('b.jpg');
    const { tag } = await tagsStore.createTagWithPhotos('여행', [p1.id]);

    const result = await tagsStore.addPhotosToTag(tag.id, [p1.id, p2.id]);

    expect(result.addedCount).toBe(1);
    expect((await tagsStore.listTags())[0].photoCount).toBe(2);
  });

  it('addPhotosToTag rejects a missing tag', async () => {
    await expect(tagsStore.addPhotosToTag(9999, [])).rejects.toBeInstanceOf(tagsStore.NotFoundError);
  });
});

describe('tagsStore - mergeTags (requirement 6)', () => {
  it('creates a new tag containing the union of the source tags photos', async () => {
    const a = await makePhoto('a.jpg');
    const b = await makePhoto('b.jpg');
    const c = await makePhoto('c.jpg');
    const trip = (await tagsStore.createTagWithPhotos('여행', [a.id, b.id])).tag;
    const family = (await tagsStore.createTagWithPhotos('가족', [c.id])).tag;

    const { tag: merged, photoCount } = await tagsStore.mergeTags([trip.id, family.id], '2026 상반기');

    expect(merged.name).toBe('2026 상반기');
    expect(photoCount).toBe(3);
  });

  it('never mutates the source tags: photo counts and per-photo tag lists survive the merge untouched', async () => {
    const a = await makePhoto('a.jpg');
    const b = await makePhoto('b.jpg');
    const c = await makePhoto('c.jpg');
    const trip = (await tagsStore.createTagWithPhotos('여행', [a.id, b.id])).tag;
    const family = (await tagsStore.createTagWithPhotos('가족', [c.id])).tag;

    await tagsStore.mergeTags([trip.id, family.id], '2026 상반기');

    const byName = Object.fromEntries((await tagsStore.listTags()).map((t) => [t.name, t.photoCount]));
    expect(byName['여행']).toBe(2);
    expect(byName['가족']).toBe(1);

    const aTags = (await photosStore.getPhotoById(a.id)).tags.map((t) => t.name).sort();
    const cTags = (await photosStore.getPhotoById(c.id)).tags.map((t) => t.name).sort();
    expect(aTags).toEqual(['2026 상반기', '여행']);
    expect(cTags).toEqual(['2026 상반기', '가족']);
  });

  it('does not duplicate a photo shared by both source tags in the merged result', async () => {
    const shared = await makePhoto('shared.jpg');
    const onlyTrip = await makePhoto('trip-only.jpg');
    const trip = (await tagsStore.createTagWithPhotos('여행', [shared.id, onlyTrip.id])).tag;
    const family = (await tagsStore.createTagWithPhotos('가족', [shared.id])).tag;

    const { photoCount } = await tagsStore.mergeTags([trip.id, family.id], '병합');

    expect(photoCount).toBe(2);
  });

  it('rejects merging fewer than two distinct source tags', async () => {
    const solo = (await tagsStore.createTagWithPhotos('혼자', [])).tag;
    await expect(tagsStore.mergeTags([solo.id], '새이름')).rejects.toBeInstanceOf(tagsStore.BadRequestError);
    await expect(tagsStore.mergeTags([solo.id, solo.id], '새이름')).rejects.toBeInstanceOf(tagsStore.BadRequestError);
  });

  it('rejects a missing source tag id', async () => {
    const only = (await tagsStore.createTagWithPhotos('혼자', [])).tag;
    await expect(tagsStore.mergeTags([only.id, 999999], '새이름')).rejects.toBeInstanceOf(tagsStore.NotFoundError);
  });

  it('rejects a new name that collides with an existing tag, including a source tag itself', async () => {
    const t1 = (await tagsStore.createTagWithPhotos('여행', [])).tag;
    const t2 = (await tagsStore.createTagWithPhotos('가족', [])).tag;
    await expect(tagsStore.mergeTags([t1.id, t2.id], '여행')).rejects.toBeInstanceOf(tagsStore.ConflictError);
  });
});
