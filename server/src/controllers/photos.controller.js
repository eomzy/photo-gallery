import * as photosService from '../services/photos.service.js';
import { generateThumbnail } from '../services/thumbnail.service.js';

export async function uploadPhotos(req, res) {
  const files = req.files ?? [];
  const photos = [];
  for (const file of files) {
    const { thumbFilename, width, height } = await generateThumbnail(file.path, file.filename);
    const photo = photosService.insertPhoto({
      filename: file.filename,
      originalName: file.originalname,
      thumbFilename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      width,
      height,
    });
    photos.push(photo);
  }
  res.status(201).json({ photos });
}

export function listPhotos(req, res) {
  const tagId = req.query.tagId ? Number(req.query.tagId) : undefined;
  res.json({ photos: photosService.listPhotos({ tagId }) });
}

export function getPhotoTags(req, res) {
  const photo = photosService.getPhotoById(Number(req.params.id));
  if (!photo) return res.status(404).json({ error: 'PHOTO_NOT_FOUND' });
  res.json({ tags: photo.tags });
}

export function deletePhoto(req, res) {
  const ok = photosService.deletePhoto(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'PHOTO_NOT_FOUND' });
  res.status(204).end();
}
