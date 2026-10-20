import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { products } from '../scripts/researched-catalog-data.js';
import {
  PRODUCT_IMAGE_HOSTS,
  optimizedProductImageUrl,
  productImageSources,
} from '../../shared/product-image-delivery.js';

test('Vercel image optimization stays within the remote origin limit', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(config.images.sizes, [320, 640, 960]);
  assert.deepEqual(config.images.qualities, [75]);
  assert.ok(config.images.formats.includes('image/webp'));
  assert.ok(config.images.remotePatterns.length <= 50);
  const patterns = config.images.remotePatterns.map(({ hostname }) => hostname);
  const isAllowed = (hostname) => patterns.includes(hostname);
  assert.ok(PRODUCT_IMAGE_HOSTS.every(isAllowed));
  for (const product of products) {
    const hostname = new URL(product.image).hostname;
    assert.equal(new URL(product.image).protocol, 'https:', product.image);
    if (PRODUCT_IMAGE_HOSTS.includes(hostname)) assert.ok(isAllowed(hostname), product.image);
    else assert.equal(optimizedProductImageUrl(product.image, 640, true), product.image);
  }
});

test('catalog photos get cached responsive WebP/AVIF transform URLs only on Vercel', () => {
  const source = products.find((product) => PRODUCT_IMAGE_HOSTS.includes(new URL(product.image).hostname)).image;
  const optimized = optimizedProductImageUrl(source, 640, true);
  assert.match(optimized, /^\/_vercel\/image\?url=https%3A%2F%2F/);
  assert.match(optimized, /&w=640&q=75$/);
  assert.equal(optimizedProductImageUrl(source, 500, true), source);
  assert.equal(
    optimizedProductImageUrl('https://unapproved.example/image.jpg', 640, true),
    'https://unapproved.example/image.jpg',
  );
  assert.equal(optimizedProductImageUrl(source, 640, false), source);
  assert.equal(productImageSources(source, [320, 640], true).srcSet.split(', ').length, 2);
});
