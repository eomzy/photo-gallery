import path from 'path';
import sharp from 'sharp';
import { thumbDir } from '../middleware/upload.middleware.js';

// Generates a webp thumbnail (max 400px, longest edge) and returns
// { thumbFilename, width, height } read from the original. Returns
// thumbFilename: null if sharp cannot parse the file (e.g. corrupt image),
// so the caller can still keep the original and fall back client-side.
export async function generateThumbnail(originalPath, baseFilename) {
  try {
    const image = sharp(originalPath);
    const metadata = await image.metadata();
    const thumbFilename = `${path.parse(baseFilename).name}.webp`;
    await image
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(thumbDir, thumbFilename));

    return { thumbFilename, width: metadata.width ?? null, height: metadata.height ?? null };
  } catch {
    return { thumbFilename: null, width: null, height: null };
  }
}
