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

describe('tags.service - create & list', () => {
  it('createTagWithPhotos creates a tag and attaches the given photos', () => {
    const p1 = makePhoto('a.jpg');
    const p2 = makePhoto('b.jpg');

    const { tag, addedCount } = tagsService.createTagWithPhotos('여행', [p1.id, p2.id]);

    expect(tag.name).toBe('여행');
    expect(addedCount).toBe(2);
    expect(tagsService.listTags()).toEqual([
      expect.objectContaining({ id: tag.id, name: '여행', photoCount: 2 }),
    ]);
  });

  it('rejects a duplicate tag name, case-insensitively', () => {
    tagsService.createTagWithPhotos('여행', []);
    expect(() => tagsService.createTagWithPhotos('여행', [])).toThrow(tagsService.ConflictError);

    tagsService.createTagWithPhotos('Family', []);
    expect(() => tagsService.createTagWithPhotos('family', [])).toThrow(tagsService.ConflictError);
  });

  it('addPhotosToTag adds new photos and ignores ones already in the tag', () => {
    const p1 = makePhoto('a.jpg');
    const p2 = makePhoto('b.jpg');
    const { tag } = tagsService.createTagWithPhotos('여행', [p1.id]);

    const result = tagsService.addPhotosToTag(tag.id, [p1.id, p2.id]);

    expect(result.addedCount).toBe(1); // p1 already there, only p2 is new
    expect(tagsService.listTags()[0].photoCount).toBe(2);
  });

  it('addPhotosToTag throws NotFoundError for a missing tag', () => {
    expect(() => tagsService.addPhotosToTag(9999, [])).toThrow(tagsService.NotFoundError);
  });
});
