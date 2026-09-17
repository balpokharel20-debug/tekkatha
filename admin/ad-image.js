import { compressProductImage } from './product-image.js';
import { MAX_AD_GIF_BYTES, gifDimensions } from '../shared/ad-image.js';

export function isGifUpload(file) {
  return file.type === 'image/gif' || /\.(gif|gof)$/i.test(file.name || '');
}

export async function prepareAdImage(file) {
  if (!isGifUpload(file)) return compressProductImage(file);
  if (!file.size || file.size > MAX_AD_GIF_BYTES)
    throw new Error('Choose a GIF no larger than 2 MB.');
  const dimensions = gifDimensions(new Uint8Array(await file.arrayBuffer()));
  if (!dimensions) throw new Error('This is not a valid GIF file.');
  const text = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve('data:image/gif;base64,' + reader.result.split(',')[1]);
    reader.onerror = reader.onabort = () => reject(new Error('The GIF could not be read.'));
    reader.readAsDataURL(file);
  });
  return { text, bytes: file.size, ...dimensions, type: 'image/gif', animated: true };
}
