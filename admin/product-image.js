import {
  PRODUCT_IMAGE_TYPES,
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_IMAGE_EDGE,
  MAX_UPLOAD_BYTES,
  fitImageDimensions,
} from '../shared/product-image.js';

function encodeCanvas(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be compressed.'))),
      'image/webp',
      quality,
    );
  });
}

function imageText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reader.onabort = () =>
      reject(new Error('The compressed image could not be read.'));
    reader.readAsDataURL(blob);
  });
}

export async function compressProductImage(file) {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type))
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  if (!file.size || file.size > MAX_UPLOAD_BYTES)
    throw new Error('Choose an image no larger than 12 MB.');

  const source = new Image();
  const sourceUrl = URL.createObjectURL(file);
  const canvas = document.createElement('canvas');
  try {
    source.src = sourceUrl;
    try {
      await source.decode();
    } catch {
      throw new Error('This image could not be opened. Choose another JPEG, PNG, or WebP file.');
    }
    if (source.naturalWidth * source.naturalHeight > 40000000)
      throw new Error('Choose an image with fewer than 40 million pixels.');

    let maxEdge = MAX_PRODUCT_IMAGE_EDGE;
    while (true) {
      const dimensions = fitImageDimensions(source.naturalWidth, source.naturalHeight, maxEdge);
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Your browser could not process this image.');
      context.imageSmoothingQuality = 'high';
      context.drawImage(source, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.86, 0.76, 0.66, 0.56, 0.46]) {
        const blob = await encodeCanvas(canvas, quality);
        if (blob.size <= MAX_PRODUCT_IMAGE_BYTES)
          return {
            text: await imageText(blob),
            bytes: blob.size,
            width: canvas.width,
            height: canvas.height,
            type: blob.type,
          };
        // Browsers without WebP encoding return PNG; its quality setting has no effect.
        if (blob.type !== 'image/webp') break;
      }
      if (maxEdge <= 256)
        throw new Error('This image could not be compressed below 350 KB. Choose a simpler image.');
      maxEdge = Math.max(256, Math.floor(maxEdge * 0.8));
    }
  } finally {
    URL.revokeObjectURL(sourceUrl);
    canvas.width = canvas.height = 0;
  }
}
