import express from 'express';
import cors from 'cors';
import { uploadDir } from './middleware/upload.middleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import { photosRouter } from './routes/photos.routes.js';
import { tagsRouter } from './routes/tags.routes.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.use('/api/photos', photosRouter);
app.use('/api/tags', tagsRouter);

app.use(errorHandler);
