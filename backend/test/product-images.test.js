import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { productSchema } from '../src/schemas.js';
import { getPublicBrandLogo } from '../src/product-image.js';
import { fitImageDimensions, MAX_PRODUCT_IMAGE_BYTES } from '../../shared/product-image.js';
import { redImage } from './fixtures/images.js';

const seed = JSON.parse(readFileSync(new URL('../seeds/content.json', import.meta.url)));
const { id, ...product } = seed.products[0];

test('product images accept stored PNG text and existing URL/asset records', () => {
  for (const image of [redImage, '/assets/phone.svg', 'https://example.com/phone.webp'])
    assert.equal(productSchema.safeParse({ ...product, image }).success, true);
});

test('uploaded brand logos are served as validated public image bytes', () => {
  const logo = getPublicBrandLogo({ logoImage: redImage });
  assert.equal(logo.type, 'image/png');
  assert.deepEqual(logo.bytes, Buffer.from(redImage.split(',')[1], 'base64'));
  assert.equal(getPublicBrandLogo({ logoImage: 'data:image/svg+xml;base64,PHN2Zy8+' }), null);
});

test('product images reject SVG, malformed Base64, mismatched image types and oversized text', () => {
  const original = Buffer.from(redImage.split(',')[1], 'base64');
  const oversized = Buffer.alloc(MAX_PRODUCT_IMAGE_BYTES + 1);
  original.copy(oversized);
  original.subarray(-12).copy(oversized, oversized.length - 12);
  const images = [
    'data:image/svg+xml;base64,' + Buffer.from('<svg/>').toString('base64'),
    'data:text/html;base64,' + Buffer.from('<script>alert(1)</script>').toString('base64'),
    'data:image/png;base64,not-valid-base64',
    redImage.replace('image/png', 'image/webp'),
    'data:image/png;base64,' + oversized.toString('base64'),
    'javascript:alert(1)',
    '',
  ];
  for (const image of images)
    assert.equal(productSchema.safeParse({ ...product, image }).success, false);
});

test('compression dimensions preserve aspect ratio, bound large images, and keep small images at original size', () => {
  assert.deepEqual(fitImageDimensions(4000, 3000), { width: 1600, height: 1200 });
  assert.deepEqual(fitImageDimensions(3000, 4000), { width: 1200, height: 1600 });
  assert.deepEqual(fitImageDimensions(200, 100), { width: 200, height: 100 });
  assert.deepEqual(fitImageDimensions(10000, 1), { width: 1600, height: 1 });
  assert.throws(() => fitImageDimensions(0, 100));
});
