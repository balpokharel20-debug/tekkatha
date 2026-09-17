export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PRODUCT_IMAGE_BYTES = 350 * 1024;
export const MAX_PRODUCT_IMAGE_TEXT = 4 * Math.ceil(MAX_PRODUCT_IMAGE_BYTES / 3) + 32;
export const MAX_PRODUCT_IMAGE_EDGE = 1600;
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export function fitImageDimensions(width, height, maxEdge = MAX_PRODUCT_IMAGE_EDGE) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    throw new Error('The image has invalid dimensions.');
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
