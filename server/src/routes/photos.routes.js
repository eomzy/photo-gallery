import { Router } from 'express';
import { upload } from '../middleware/upload.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as photosController from '../controllers/photos.controller.js';

export const photosRouter = Router();

photosRouter.post('/', upload.array('photos', 100), asyncHandler(photosController.uploadPhotos));
photosRouter.get('/', photosController.listPhotos);
photosRouter.get('/:id/tags', photosController.getPhotoTags);
photosRouter.delete('/:id', photosController.deletePhoto);
