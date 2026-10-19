import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { productSchema } from '../src/schemas.js';
import { MAX_PRODUCT_CONTENT_TEXT, renderProductText } from '../../shared/product-content.js';
import { redImage } from './fixtures/images.js';

const seed = JSON.parse(readFileSync(new URL('../seeds/content.json', import.meta.url)));
const { id, ...product } = seed.products[0];

test('long description and review support older products, lengthy text, replacement, and clearing', () => {
  const older = productSchema.parse(product);
  assert.equal(older.description, '');
  assert.equal(older.review, '');
  assert.deepEqual(older.reviewBlocks, []);
  const description = '  Design & features\n\n' + 'Detailed description. '.repeat(1500) + '\n';
  const review = 'Display and performance\nSecond line\n\n' + 'Long review. '.repeat(2000);
  const saved = productSchema.parse({ ...product, description, review });
  assert.equal(saved.description, description);
  assert.equal(saved.review, review);
  const changed = productSchema.parse({ ...saved, description: 'New description', review: '' });
  assert.equal(changed.description, 'New description');
  assert.equal(changed.review, '');
});

test('detailed reviews support ordered text and image blocks', () => {
  const reviewBlocks = [
    { type: 'text', heading: 'Display', text: 'The panel remains readable outdoors.' },
    {
      type: 'image',
      image: redImage,
      alt: 'Phone display photographed outdoors',
      caption: 'The display during our outdoor test.',
    },
    { type: 'text', heading: 'Battery life', text: 'It comfortably lasted through the day.' },
  ];
  assert.deepEqual(productSchema.parse({ ...product, reviewBlocks }).reviewBlocks, reviewBlocks);
  assert.equal(
    productSchema.safeParse({
      ...product,
      reviewBlocks: [{ type: 'image', image: redImage, alt: '', caption: '' }],
    }).success,
    false,
  );
  assert.equal(
    productSchema.safeParse({
      ...product,
      reviewBlocks: [{ type: 'text', heading: '', text: '   ' }],
    }).success,
    false,
  );
});

test('each long product field has its own length and string validation', () => {
  const maximum = 'क'.repeat(MAX_PRODUCT_CONTENT_TEXT);
  assert.equal(
    productSchema.safeParse({ ...product, description: maximum, review: maximum }).success,
    true,
  );
  for (const field of ['description', 'review']) {
    for (const value of [maximum + 'x', null, ['Unexpected array'], {}])
      assert.equal(productSchema.safeParse({ ...product, [field]: value }).success, false);
  }
});

test('products support additional variants with independent prices and availability', () => {
  const saved = productSchema.parse({
    ...product,
    variants: [
      {
        label: '12GB RAM · 256GB storage',
        price: 62999,
        priceStatus: 'unverified',
        priceSource: '',
        priceCheckedAt: '',
        availability: 'in-stock',
      },
    ],
  });
  assert.equal(saved.variants[0].price, 62999);
  assert.equal(saved.variants[0].availability, 'in-stock');
  assert.equal(productSchema.safeParse({ ...product, variants: [{ ...saved.variants[0], label: 'x' }, { ...saved.variants[0], label: 'X' }] }).success, false);
});

test('device content preserves paragraphs and line breaks and displays HTML safely as text', () => {
  assert.equal(
    renderProductText('First paragraph\r\nSecond line\r\n\r\nNext paragraph'),
    '<p>First paragraph<br>Second line</p><p>Next paragraph</p>',
  );
  assert.equal(renderProductText(' \n\n '), '');
  const rendered = renderProductText(
    '<script>alert("x")</script>\n<img src=x onerror=alert(1)>\n\nBattery & camera',
  );
  assert.equal(rendered.includes('<script'), false);
  assert.equal(rendered.includes('<img'), false);
  assert.ok(rendered.includes('&lt;script&gt;'));
  assert.ok(rendered.includes('<p>Battery &amp; camera</p>'));
});
