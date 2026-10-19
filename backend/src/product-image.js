import { MAX_PRODUCT_IMAGE_BYTES } from '../../shared/product-image.js';

export function isEncodedProductImage(value) {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  const bytes = Buffer.from(match[2], 'base64');
  if (
    !bytes.length ||
    bytes.length > MAX_PRODUCT_IMAGE_BYTES ||
    bytes.toString('base64') !== match[2]
  )
    return false;
  if (match[1] === 'jpeg')
    return (
      bytes.length >= 4 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff &&
      bytes.at(-2) === 0xff &&
      bytes.at(-1) === 0xd9
    );
  if (match[1] === 'png')
    return (
      bytes.length >= 45 &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      bytes.toString('ascii', 12, 16) === 'IHDR' &&
      bytes.toString('ascii', bytes.length - 8, bytes.length - 4) === 'IEND'
    );
  return (
    bytes.length >= 20 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.readUInt32LE(4) + 8 === bytes.length &&
    bytes.toString('ascii', 8, 12) === 'WEBP' &&
    ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16))
  );
}

function imageUrl(product, slot) {
  const version = product.updatedAt ? new Date(product.updatedAt).getTime() : 0;
  return `/api/products/${encodeURIComponent(product.id)}/image/${slot}?v=${version}`;
}

export function publicProduct(record) {
  if (!record) return null;
  const { _id, ...product } = record;
  if (isEncodedProductImage(product.image)) product.image = imageUrl(product, 'main');
  if (Array.isArray(product.reviewBlocks))
    product.reviewBlocks = product.reviewBlocks.map((block, index) =>
      block?.type === 'image' && isEncodedProductImage(block.image)
        ? { ...block, image: imageUrl(product, `review-${index}`) }
        : block,
    );
  return product;
}

export function getPublicProductImage(record, slot) {
  if (!record || record.deletedAt) return null;
  let value;
  if (slot === 'main') value = record.image;
  else {
    const match = /^review-(\d{1,2})$/.exec(slot);
    if (!match) return null;
    const block = record.reviewBlocks?.[Number(match[1])];
    if (block?.type !== 'image') return null;
    value = block.image;
  }
  if (!isEncodedProductImage(value)) return null;
  const [, subtype, encoded] = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  return { type: `image/${subtype}`, bytes: Buffer.from(encoded, 'base64') };
}
