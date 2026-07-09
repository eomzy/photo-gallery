import * as tagsService from '../services/tags.service.js';
import * as photosService from '../services/photos.service.js';

export function listTags(req, res) {
  res.json({ tags: tagsService.listTags() });
}

export function createTag(req, res) {
  const { name, photoIds = [] } = req.body ?? {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'NAME_REQUIRED' });

  const { tag, addedCount } = tagsService.createTagWithPhotos(name.trim(), photoIds);
  res.status(201).json({ tag, addedCount });
}

export function getTagPhotos(req, res) {
  const tagId = Number(req.params.id);
  const tag = tagsService.getTag(tagId);
  if (!tag) return res.status(404).json({ error: 'TAG_NOT_FOUND' });
  res.json({ tag, photos: photosService.listPhotos({ tagId }) });
}

export function addPhotosToTag(req, res) {
  const tagId = Number(req.params.id);
  const { photoIds = [] } = req.body ?? {};
  const { tag, addedCount } = tagsService.addPhotosToTag(tagId, photoIds);
  res.json({ tag, addedCount });
}

export function removePhotoFromTag(req, res) {
  tagsService.removePhotoFromTag(Number(req.params.tagId), Number(req.params.photoId));
  res.status(204).end();
}

export function deleteTag(req, res) {
  const ok = tagsService.deleteTag(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'TAG_NOT_FOUND' });
  res.status(204).end();
}

export function renameTag(req, res) {
  const { name } = req.body ?? {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'NAME_REQUIRED' });
  const tag = tagsService.renameTag(Number(req.params.id), name.trim());
  res.json({ tag });
}

export function mergeTags(req, res) {
  const { sourceTagIds = [], newName } = req.body ?? {};
  if (!newName || !newName.trim()) return res.status(400).json({ error: 'NAME_REQUIRED' });
  const { tag, photoCount } = tagsService.mergeTags(sourceTagIds, newName.trim());
  res.status(201).json({ tag, photoCount });
}
