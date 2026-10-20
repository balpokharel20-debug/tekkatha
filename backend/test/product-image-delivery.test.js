import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { products } from '../scripts/researched-catalog-data.js';
import {
  PRODUCT_IMAGE_HOSTS,
  optimizedProductImageUrl,
  productImageSources,
} from '../../shared/product-image-delivery.js';

test('Vercel image optimization allowlists each catalog photo host', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(config.images.sizes, [320, 640, 960]);
  assert.deepEqual(config.images.qualities, [75]);
  assert.ok(config.images.formats.includes('image/webp'));
  const allowed = new Set(config.images.remotePatterns.map(({ hostname }) => hostname));
  for (const product of products) {
    assert.ok(allowed.has(new URL(product.image).hostname), product.image);
    assert.ok(PRODUCT_IMAGE_HOSTS.includes(new URL(product.image).hostname), product.image);
  }
});

test('catalog photos get cached responsive WebP/AVIF transform URLs only on Vercel', () => {
  const source = products[0].image;
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
