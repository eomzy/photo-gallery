import { apiClient } from './client.js';

export function listPhotos(tagId) {
  const query = tagId ? `?tagId=${tagId}` : '';
  return apiClient.get(`/photos${query}`);
}

export function uploadPhotos(files) {
  const formData = new FormData();
  for (const file of files) formData.append('photos', file);
  return apiClient.post('/photos', formData);
}

export function deletePhoto(id) {
  return apiClient.del(`/photos/${id}`);
}
