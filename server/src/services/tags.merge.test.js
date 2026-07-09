import { describe, it, expect } from 'vitest';
import * as photosService from './photos.service.js';
import * as tagsService from './tags.service.js';

function makePhoto(filename) {
  return photosService.insertPhoto({
    filename,
    originalName: filename,
    thumbFilename: null,
    mimeType: 'image/jpeg',
    sizeBytes: 100,
    width: 100,
    height: 100,
  });
}

function photoTagsOf(photoId) {
  return photosService
    .getPhotoById(photoId)
    .tags.map((t) => t.name)
    .sort();
}

describe('tags.service - mergeTags (requirement 6)', () => {
  it('creates a new tag containing the union of the source tags photos', () => {
    const a = makePhoto('a.jpg');
    const b = makePhoto('b.jpg');
    const c = makePhoto('c.jpg');
    const trip = tagsService.createTagWithPhotos('여행', [a.id, b.id]).tag;
    const family = tagsService.createTagWithPhotos('가족', [c.id]).tag;

    const { tag: merged, photoCount } = tagsService.mergeTags([trip.id, family.id], '2026 상반기');

    expect(merged.name).toBe('2026 상반기');
    expect(photoCount).toBe(3);
  });

  it('never mutates the source tags: their photo counts and associations survive the merge untouched', () => {
    const a = makePhoto('a.jpg');
    const b = makePhoto('b.jpg');
    const c = makePhoto('c.jpg');
    const trip = tagsService.createTagWithPhotos('여행', [a.id, b.id]).tag;
    const family = tagsService.createTagWithPhotos('가족', [c.id]).tag;

    tagsService.mergeTags([trip.id, family.id], '2026 상반기');

    const tagsByName = Object.fromEntries(tagsService.listTags().map((t) => [t.name, t]));
    expect(tagsByName['여행'].photoCount).toBe(2);
    expect(tagsByName['가족'].photoCount).toBe(1);

    // and at the individual-photo level, each photo keeps its original tag
    // *plus* the new one — merging only adds, it never removes.
    expect(photoTagsOf(a.id)).toEqual(['2026 상반기', '여행']);
    expect(photoTagsOf(b.id)).toEqual(['2026 상반기', '여행']);
    expect(photoTagsOf(c.id)).toEqual(['2026 상반기', '가족']);
  });

  it('does not duplicate a photo shared by both source tags in the merged result', () => {
    const shared = makePhoto('shared.jpg');
    const onlyTrip = makePhoto('trip-only.jpg');
    const trip = tagsService.createTagWithPhotos('여행', [shared.id, onlyTrip.id]).tag;
    const family = tagsService.createTagWithPhotos('가족', [shared.id]).tag;

    const { photoCount } = tagsService.mergeTags([trip.id, family.id], '병합');

    expect(photoCount).toBe(2); // shared + onlyTrip, not 3
  });

  it('rejects merging fewer than two distinct source tags', () => {
    const solo = tagsService.createTagWithPhotos('혼자', []).tag;
    expect(() => tagsService.mergeTags([solo.id], '새이름')).toThrow(tagsService.BadRequestError);
    expect(() => tagsService.mergeTags([solo.id, solo.id], '새이름')).toThrow(tagsService.BadRequestError);
  });

  it('rejects a missing source tag id', () => {
    const only = tagsService.createTagWithPhotos('혼자', []).tag;
    expect(() => tagsService.mergeTags([only.id, 999999], '새이름')).toThrow(tagsService.NotFoundError);
  });

  it('rejects a new name that collides with an existing tag, including a source tag itself', () => {
    const t1 = tagsService.createTagWithPhotos('여행', []).tag;
    const t2 = tagsService.createTagWithPhotos('가족', []).tag;
    expect(() => tagsService.mergeTags([t1.id, t2.id], '여행')).toThrow(tagsService.ConflictError);
  });
});
