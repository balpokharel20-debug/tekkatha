import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { connect, client } from '../src/db.js';
import { redImage, blueImage } from '../test/fixtures/images.js';
import { MAX_PRODUCT_CONTENT_TEXT } from '../../shared/product-content.js';
const base = 'http://127.0.0.1:4000/api';
const origin = 'http://localhost:5174';
let cookie = '',
  testIds = { articles: [], products: [] };
async function request(route, method = 'GET', body, authenticated = false, customOrigin = origin) {
  const res = await fetch(base + route, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: customOrigin,
      ...(authenticated ? { Cookie: cookie } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, data: await res.json(), cookie: res.headers.get('set-cookie') };
}
try {
  const creds = JSON.parse(
    await readFile(new URL('../../.local/admin-credentials.json', import.meta.url)),
  );
  assert.equal((await request('/health')).data.database, 'connected');
  assert.equal((await request('/admin/stats')).status, 401);
  assert.equal((await request('/auth/login', 'POST', creds)).status, 400);
  const login = await request('/auth/login', 'POST', {
    email: creds.email,
    password: creds.password,
  });
  assert.equal(login.status, 200);
  cookie = login.cookie.split(';')[0];
  assert.match(login.cookie, /HttpOnly/i);
  assert.match(login.cookie, /SameSite=Strict/i);
  const article = {
    title: 'Integration check ' + randomBytes(5).toString('hex'),
    category: 'AI',
    excerpt: 'A temporary integration test article.',
    image: '/assets/laptop.svg',
    read: 3,
    author: 'Test editor',
    kind: 'Article',
    status: 'draft',
    isSample: false,
    body: [
      { heading: 'Database persistence', text: 'Created by the automated integration check.' },
    ],
  };
  let result = await request('/admin/articles', 'POST', article, true);
  assert.equal(result.status, 201);
  const a = result.data;
  testIds.articles.push(a.id);
  assert.equal((await request('/articles/' + a.id)).status, 404);
  assert.equal(
    (
      await request(
        '/admin/articles/' + a.id,
        'PUT',
        { ...article, status: 'published' },
        true,
        'https://untrusted.example',
      )
    ).status,
    403,
  );
  result = await request(
    '/admin/articles/' + a.id,
    'PUT',
    { ...article, status: 'published' },
    true,
  );
  assert.equal(result.status, 200);
  assert.equal((await request('/articles/' + a.id)).data.body[0].text, article.body[0].text);
  assert.equal((await request('/admin/articles/' + a.id, 'DELETE', {}, true)).status, 200);
  assert.equal((await request('/articles/' + a.id)).status, 404);
  assert.equal(
    (await request('/admin/articles/' + a.id + '/restore', 'POST', {}, true)).status,
    200,
  );
  assert.equal((await request('/articles/' + a.id)).status, 200);
  const product = {
    brand: 'Integration',
    name: 'Test phone ' + randomBytes(5).toString('hex'),
    type: 'Smartphones',
    price: 15000,
    priceStatus: 'sample',
    priceSource: '',
    priceCheckedAt: '',
    availability: 'unverified',
    variant: 'Test configuration',
    image: redImage,
    display: 'AMOLED · 120Hz',
    processor: 'Test processor',
    memory: '8GB',
    storage: '128GB',
    battery: '5,000 mAh',
    camera: 'Test camera',
    source: 'https://example.com/specifications',
    note: 'Temporary integration-test product.',
    description: 'Design and features\n\n' + 'Detailed device description. '.repeat(1000),
    review: 'Performance and battery\nSecond line\n\n' + 'Full device review. '.repeat(1000),
  };
  result = await request('/admin/products', 'POST', product, true);
  assert.equal(result.status, 201);
  testIds.products.push(result.data.id);
  assert.equal((await request('/products/' + result.data.id)).data.price, 15000);
  assert.equal((await request('/products/' + result.data.id)).data.image, redImage);
  assert.equal(
    (await request('/products/' + result.data.id)).data.description,
    product.description,
  );
  assert.equal((await request('/products/' + result.data.id)).data.review, product.review);
  const summary = (
    await request('/products?q=' + encodeURIComponent(product.name))
  ).data.items.find((item) => item.id === result.data.id);
  assert.ok(summary);
  assert.equal(Object.hasOwn(summary, 'description'), false);
  assert.equal(Object.hasOwn(summary, 'review'), false);
  const productId = result.data.id;
  // Escaped text reaches >1 MB even without a large image, exercising the
  // dedicated product parser while remaining within both character limits.
  const largeDescription = '\u0001'.repeat(MAX_PRODUCT_CONTENT_TEXT);
  const largeReview = '\u0002'.repeat(MAX_PRODUCT_CONTENT_TEXT);
  assert.ok(
    Buffer.byteLength(
      JSON.stringify({ ...product, description: largeDescription, review: largeReview }),
    ) >
      1024 * 1024,
  );
  assert.equal(
    (
      await request(
        '/admin/products/' + productId,
        'PUT',
        { ...product, description: largeDescription, review: largeReview },
        true,
      )
    ).status,
    200,
  );
  assert.equal((await request('/products/' + productId)).data.description, largeDescription);
  assert.equal((await request('/products/' + productId)).data.review, largeReview);
  const description = 'Updated description\n\nNew device details.';
  const review = 'Updated full review\nSecond line\n\nOur final verdict.';
  assert.equal(
    (
      await request(
        '/admin/products/' + productId,
        'PUT',
        { ...product, price: 23000, image: blueImage, description, review },
        true,
      )
    ).status,
    200,
  );
  assert.equal((await request('/products/' + productId)).data.price, 23000);
  assert.equal((await request('/products/' + productId)).data.image, blueImage);
  assert.equal((await request('/products/' + productId)).data.description, description);
  assert.equal((await request('/products/' + productId)).data.review, review);
  assert.equal(
    (
      await request(
        '/admin/products/' + productId,
        'PUT',
        { ...product, review: 'x'.repeat(MAX_PRODUCT_CONTENT_TEXT + 1) },
        true,
      )
    ).status,
    400,
  );
  assert.equal((await request('/products/' + productId)).data.review, review);
  assert.equal(
    (
      await request(
        '/admin/products/' + productId,
        'PUT',
        { ...product, image: 'data:image/svg+xml;base64,PHN2Zy8+' },
        true,
      )
    ).status,
    400,
  );
  assert.equal((await request('/products/' + productId)).data.image, blueImage);
  assert.equal(
    (await request('/assistant', 'POST', { question: 'Show phones under Rs. 50,000' })).status,
    200,
  );
  const db = await connect();
  assert.equal((await db.collection('articles').findOne({ id: a.id })).status, 'published');
  const savedProduct = await db.collection('products').findOne({ id: testIds.products[0] });
  assert.equal(savedProduct.price, 23000);
  assert.equal(typeof savedProduct.image, 'string');
  assert.equal(savedProduct.image, blueImage);
  assert.equal(savedProduct.description, description);
  assert.equal(savedProduct.review, review);
  assert.equal(
    JSON.stringify(savedProduct).includes(product.description),
    false,
    'old description text is removed',
  );
  assert.equal(
    JSON.stringify(savedProduct).includes(product.review),
    false,
    'old review text is removed',
  );
  assert.equal(JSON.stringify(savedProduct).includes(redImage), false, 'old image text is removed');
  assert.equal(
    (
      await request(
        '/admin/products/' + productId,
        'PUT',
        { ...product, description: '', review: '' },
        true,
      )
    ).status,
    200,
  );
  const cleared = (await request('/products/' + productId)).data;
  assert.equal(cleared.description, '');
  assert.equal(cleared.review, '');
  await request('/auth/logout', 'POST', {}, true);
  assert.equal((await request('/auth/me', 'GET', undefined, true)).status, 401);
  console.log(
    'PASS: MongoDB persistence, admin auth, draft privacy, publishing, archive/restore, product creation, long descriptions/reviews, large product uploads, catalog summaries, image/text replacement and clearing, invalid field rejection, catalog assistant and logout.',
  );
} catch (error) {
  console.error('Integration check failed:', error.message);
  process.exitCode = 1;
} finally {
  const db = await connect();
  for (const [collection, ids] of Object.entries(testIds))
    if (ids.length) await db.collection(collection).deleteMany({ id: { $in: ids } });
  await client.close();
}
