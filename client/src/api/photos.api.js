import * as photosStore from '../storage/photosStore.js';
import { generateThumbnail } from '../storage/thumbnail.js';

export async function listPhotos(tagId) {
  const photos = await photosStore.listPhotos({ tagId });
  return { photos };
}

export async function uploadPhotos(files) {
  const photos = [];
  for (const file of files) {
    const { thumbBlob, width, height } = await generateThumbnail(file);
    const photo = await photosStore.insertPhoto({
      blob: file,
      thumbBlob,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      width,
      height,
    });
    photos.push(photo);
  }
  return { photos };
}

export async function deletePhoto(id) {
  await photosStore.deletePhoto(id);
}
