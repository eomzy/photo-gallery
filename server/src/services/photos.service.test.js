import { describe, it, expect } from 'vitest';
import * as photosService from './photos.service.js';

function samplePhoto(overrides = {}) {
  return {
    filename: 'a.jpg',
    originalName: '원본.jpg',
    thumbFilename: 'a.webp',
    mimeType: 'image/jpeg',
    sizeBytes: 1234,
    width: 800,
    height: 600,
    ...overrides,
  };
}

describe('photos.service', () => {
  it('insertPhoto stores metadata and returns a DTO with url/thumbUrl and empty tags', () => {
    const photo = photosService.insertPhoto(samplePhoto());

    expect(photo.originalName).toBe('원본.jpg');
    expect(photo.url).toBe('/uploads/a.jpg');
    expect(photo.thumbUrl).toBe('/uploads/thumbs/a.webp');
    expect(photo.width).toBe(800);
    expect(photo.tags).toEqual([]);
  });

  it('falls back to the original file as thumbUrl when no thumbnail was generated', () => {
    const photo = photosService.insertPhoto(samplePhoto({ thumbFilename: null }));
    expect(photo.thumbUrl).toBe(photo.url);
  });

  it('listPhotos returns newest-first and getPhotoById finds a single photo', () => {
    const first = photosService.insertPhoto(samplePhoto({ filename: 'first.jpg' }));
    const second = photosService.insertPhoto(samplePhoto({ filename: 'second.jpg' }));

    const all = photosService.listPhotos();
    expect(all.map((p) => p.id)).toEqual([second.id, first.id]);
    expect(photosService.getPhotoById(first.id).url).toBe('/uploads/first.jpg');
  });

  it('getPhotoById returns null for a missing photo', () => {
    expect(photosService.getPhotoById(99999)).toBeNull();
  });

  it('deletePhoto removes the row and returns false on a second delete', () => {
    const photo = photosService.insertPhoto(samplePhoto());

    expect(photosService.deletePhoto(photo.id)).toBe(true);
    expect(photosService.getPhotoById(photo.id)).toBeNull();
    expect(photosService.deletePhoto(photo.id)).toBe(false);
  });
});
