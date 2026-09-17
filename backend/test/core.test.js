import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, tokenHash } from '../src/auth.js';
import { articleSchema, productSchema, searchRegex, pagination } from '../src/schemas.js';
test('password hashes reject incorrect and malformed passwords', async () => {
  const password = 'correct-test-password-123';
  const hash = await hashPassword(password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('incorrect-password', hash), false);
  assert.equal(await verifyPassword(password, 'invalid'), false);
  assert.notEqual(hash, password);
  assert.equal(tokenHash('session').length, 64);
});
test('search treats user input as literal text and pagination is bounded', () => {
  const re = searchRegex('phone (3a) + [OLED]');
  assert.equal(re.test('phone (3a) + [OLED]'), true);
  assert.equal(re.test('phone 3a OLED'), false);
  assert.deepEqual(pagination({ page: '-10', limit: '10000' }), { page: 1, limit: 100 });
});
test('article status, unsafe image protocols and missing body are rejected', () => {
  const a = {
    title: 'Test article',
    category: 'AI',
    excerpt: '',
    image: '/assets/laptop.svg',
    read: 5,
    author: 'Editor',
    kind: 'Article',
    status: 'draft',
    isSample: false,
    body: [{ heading: 'Overview', text: 'Useful information.' }],
  };
  assert.equal(articleSchema.safeParse(a).success, true);
  assert.equal(articleSchema.safeParse({ ...a, status: 'hidden' }).success, false);
  assert.equal(articleSchema.safeParse({ ...a, image: 'javascript:alert(1)' }).success, false);
  assert.equal(articleSchema.safeParse({ ...a, body: [] }).success, false);
});
test('source-recorded prices require a retailer URL and date', () => {
  const p = {
    brand: 'Test',
    name: 'Phone',
    type: 'Smartphones',
    price: 10000,
    priceStatus: 'verified',
    priceSource: '',
    priceCheckedAt: '',
    availability: 'unverified',
    variant: '',
    image: '/assets/phone.svg',
    display: '',
    processor: '',
    battery: '',
    memory: '',
    storage: '',
    camera: '',
    source: '',
    note: '',
  };
  assert.equal(productSchema.safeParse(p).success, false);
  assert.equal(
    productSchema.safeParse({
      ...p,
      priceSource: 'https://example.com/product',
      priceCheckedAt: '2026-09-17T10:00:00Z',
    }).success,
    true,
  );
  assert.equal(productSchema.safeParse({ ...p, priceStatus: 'sample', price: -1 }).success, false);
});
