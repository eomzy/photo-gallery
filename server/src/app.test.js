import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

// 1x1 transparent PNG, valid enough for sharp to generate a real thumbnail.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUAAscqmSMAAAAASUVORK5CYII=',
  'base64'
);

function uploadOne(filename = 'a.png') {
  return request(app).post('/api/photos').attach('photos', PNG_1X1, filename);
}

describe('API - photos & tags routes', () => {
  it('uploads a photo and lists it back', async () => {
    const upload = await uploadOne();
    expect(upload.status).toBe(201);
    expect(upload.body.photos).toHaveLength(1);
    expect(upload.body.photos[0].originalName).toBe('a.png');

    const list = await request(app).get('/api/photos');
    expect(list.status).toBe(200);
    expect(list.body.photos).toHaveLength(1);
  });

  it('creates a tag from photos, then lists it as a folder', async () => {
    const upload = await uploadOne();
    const photoId = upload.body.photos[0].id;

    const create = await request(app).post('/api/tags').send({ name: '여행', photoIds: [photoId] });
    expect(create.status).toBe(201);
    expect(create.body.addedCount).toBe(1);

    const tags = await request(app).get('/api/tags');
    expect(tags.body.tags).toEqual([expect.objectContaining({ name: '여행', photoCount: 1 })]);

    const folder = await request(app).get(`/api/tags/${create.body.tag.id}/photos`);
    expect(folder.body.photos).toHaveLength(1);
  });

  it('rejects creating a tag with a name that already exists', async () => {
    await request(app).post('/api/tags').send({ name: '여행', photoIds: [] });
    const dup = await request(app).post('/api/tags').send({ name: '여행', photoIds: [] });
    expect(dup.status).toBe(409);
  });

  it('merges two folders into a new tag while preserving the originals (requirement 6, end-to-end)', async () => {
    const p1 = (await uploadOne('a.png')).body.photos[0];
    const p2 = (await uploadOne('b.png')).body.photos[0];

    const trip = (await request(app).post('/api/tags').send({ name: '여행', photoIds: [p1.id] })).body.tag;
    const family = (await request(app).post('/api/tags').send({ name: '가족', photoIds: [p2.id] })).body.tag;

    const merge = await request(app)
      .post('/api/tags/merge')
      .send({ sourceTagIds: [trip.id, family.id], newName: '2026 상반기' });

    expect(merge.status).toBe(201);
    expect(merge.body.photoCount).toBe(2);

    const tags = await request(app).get('/api/tags');
    const byName = Object.fromEntries(tags.body.tags.map((t) => [t.name, t.photoCount]));
    expect(byName['여행']).toBe(1);
    expect(byName['가족']).toBe(1);
    expect(byName['2026 상반기']).toBe(2);
  });

  it('rejects merging fewer than two source tags with 400', async () => {
    const only = (await request(app).post('/api/tags').send({ name: '혼자', photoIds: [] })).body.tag;
    const res = await request(app)
      .post('/api/tags/merge')
      .send({ sourceTagIds: [only.id], newName: '새이름' });
    expect(res.status).toBe(400);
  });

  it('deletes a photo so it no longer appears in the listing', async () => {
    const photo = (await uploadOne()).body.photos[0];
    const del = await request(app).delete(`/api/photos/${photo.id}`);
    expect(del.status).toBe(204);

    const list = await request(app).get('/api/photos');
    expect(list.body.photos).toHaveLength(0);
  });
});
