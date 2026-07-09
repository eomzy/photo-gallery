import * as tagsStore from '../storage/tagsStore.js';
import * as photosStore from '../storage/photosStore.js';
import { toFriendlyError } from '../storage/errorMessages.js';

export async function listTags() {
  const tags = await tagsStore.listTags();
  return { tags };
}

export async function createTag(name, photoIds) {
  try {
    const { tag, addedCount } = await tagsStore.createTagWithPhotos(name, photoIds);
    return { tag, addedCount };
  } catch (err) {
    throw toFriendlyError(err);
  }
}

export async function getTagPhotos(tagId) {
  const tag = await tagsStore.getTag(tagId);
  const photos = await photosStore.listPhotos({ tagId });
  return { tag, photos };
}

export async function addPhotosToTag(tagId, photoIds) {
  try {
    return await tagsStore.addPhotosToTag(tagId, photoIds);
  } catch (err) {
    throw toFriendlyError(err);
  }
}

export async function removePhotoFromTag(tagId, photoId) {
  await tagsStore.removePhotoFromTag(tagId, photoId);
}

export async function deleteTag(id) {
  await tagsStore.deleteTag(id);
}

export async function mergeTags(sourceTagIds, newName) {
  try {
    return await tagsStore.mergeTags(sourceTagIds, newName);
  } catch (err) {
    throw toFriendlyError(err);
  }
}
