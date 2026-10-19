import test from 'node:test';
import assert from 'node:assert/strict';
import { articleSchema } from '../src/schemas.js';

const article = {
  title: 'Best phones under Rs. 50,000',
  category: 'Buying Guides',
  excerpt: 'A practical shortlist.',
  image: '/assets/phone.svg',
  read: 5,
  author: 'Tekkatha Editorial',
  kind: 'Guide',
  status: 'draft',
  isSample: false,
  body: [{ heading: 'How we choose', text: 'We compare the details that matter.' }],
};

test('editorial posts can select unique products and older posts default to none', () => {
  const olderArticle = articleSchema.parse(article);
  assert.deepEqual(olderArticle.productIds, []);
  assert.deepEqual(olderArticle.guideProducts, []);
  assert.deepEqual(articleSchema.parse({ ...article, productIds: ['phone-a', 'phone-b'] }).productIds, ['phone-a', 'phone-b']);
  assert.equal(articleSchema.safeParse({ ...article, productIds: ['phone-a', 'phone-a'] }).success, false);
});

test('buying guides can save an ordered description for each selected product', () => {
  const guideProducts = [
    { productId: 'phone-a', description: 'Best for battery life.' },
    { productId: 'phone-b', description: 'Best camera in this shortlist.' },
  ];
  assert.deepEqual(articleSchema.parse({ ...article, productIds: ['phone-a', 'phone-b'], guideProducts }).guideProducts, guideProducts);
  assert.equal(
    articleSchema.safeParse({ ...article, guideProducts: [...guideProducts, guideProducts[0]] }).success,
    false,
  );
  assert.equal(
    articleSchema.safeParse({ ...article, productIds: ['phone-b', 'phone-a'], guideProducts }).success,
    false,
  );
});
