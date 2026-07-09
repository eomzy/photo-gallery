const MAX_DIMENSION = 400;

// Mirrors the server's sharp-based thumbnail generation, but with the
// canvas API in the browser: downscale to at most 400px on the longest
// edge and re-encode as webp. Also reports the original image's true
// pixel dimensions (needed for the DTO's width/height fields).
export function generateThumbnail(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (thumbBlob) => {
          URL.revokeObjectURL(objectUrl);
          resolve({ thumbBlob, width, height });
        },
        'image/webp',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ thumbBlob: null, width: null, height: null });
    };

    img.src = objectUrl;
  });
}
