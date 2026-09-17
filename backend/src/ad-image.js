import { MAX_AD_GIF_BYTES, gifDimensions } from '../../shared/ad-image.js';

export function isEncodedAdGif(value) {
  const match = /^data:image\/gif;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  const bytes = Buffer.from(match[1], 'base64');
  return (
    bytes.length <= MAX_AD_GIF_BYTES &&
    bytes.toString('base64') === match[1] &&
    gifDimensions(bytes) !== null
  );
}
