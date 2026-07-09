import { apiClient } from './client.js';

export function listTags() {
  return apiClient.get('/tags');
}

export function createTag(name, photoIds) {
  return apiClient.post('/tags', { name, photoIds });
}

export function getTagPhotos(tagId) {
  return apiClient.get(`/tags/${tagId}/photos`);
}

export function addPhotosToTag(tagId, photoIds) {
  return apiClient.post(`/tags/${tagId}/photos`, { photoIds });
}

export function removePhotoFromTag(tagId, photoId) {
  return apiClient.del(`/tags/${tagId}/photos/${photoId}`);
}

export function deleteTag(id) {
  return apiClient.del(`/tags/${id}`);
}

export function mergeTags(sourceTagIds, newName) {
  return apiClient.post('/tags/merge', { sourceTagIds, newName });
}
