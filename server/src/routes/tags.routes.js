import { Router } from 'express';
import * as tagsController from '../controllers/tags.controller.js';

export const tagsRouter = Router();

tagsRouter.get('/', tagsController.listTags);
tagsRouter.post('/', tagsController.createTag);
tagsRouter.post('/merge', tagsController.mergeTags); // must precede /:id routes
tagsRouter.get('/:id/photos', tagsController.getTagPhotos);
tagsRouter.post('/:id/photos', tagsController.addPhotosToTag);
tagsRouter.delete('/:tagId/photos/:photoId', tagsController.removePhotoFromTag);
tagsRouter.patch('/:id', tagsController.renameTag);
tagsRouter.delete('/:id', tagsController.deleteTag);
