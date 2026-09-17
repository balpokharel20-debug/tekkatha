export const MAX_AD_GIF_BYTES = 2 * 1024 * 1024;
export const MAX_AD_IMAGE_TEXT = 4 * Math.ceil(MAX_AD_GIF_BYTES / 3) + 32;

export function gifDimensions(bytes) {
  if (
    bytes.length < 14 ||
    !['GIF87a', 'GIF89a'].includes(String.fromCharCode(...bytes.subarray(0, 6))) ||
    bytes.at(-1) !== 0x3b
  )
    return null;
  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  return width && height ? { width, height } : null;
}
