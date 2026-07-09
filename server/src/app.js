import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { uploadDir } from './middleware/upload.middleware.js';
import { errorHandler } from './middleware/errorHandler.js';
import { photosRouter } from './routes/photos.routes.js';
import { tagsRouter } from './routes/tags.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistDir = path.resolve(__dirname, '../../client/dist');

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.use('/api/photos', photosRouter);
app.use('/api/tags', tagsRouter);

// Serves the built React app (client/dist) when present, so a single
// deployed Node process can host both the API and the frontend — no
// separate static host or CORS setup needed. Absent in local dev unless
// `npm --prefix client run build` has been run.
if (fs.existsSync(path.join(clientDistDir, 'index.html'))) {
  app.use(express.static(clientDistDir));
}

app.use(errorHandler);
