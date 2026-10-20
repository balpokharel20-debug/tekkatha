import test from 'node:test';
import assert from 'node:assert/strict';
import { slug, articleSchema, productSchema } from '../src/schemas.js';
import { articles, products } from '../scripts/researched-catalog-data.js';

test('researched catalog contains 145 valid products with device photos and no purchase links', () => {
  assert.equal(products.length, 145);
  const counts = products.reduce((result, product) => {
    result[product.type] = (result[product.type] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, {
    Smartphones: 50,
    Laptops: 50,
    Tablets: 20,
    'PC Components': 8,
    Accessories: 15,
    Gaming: 2,
  });
  for (const product of products) {
    assert.equal(productSchema.safeParse(product).success, true, `${product.brand} ${product.name}`);
    assert.equal(product.priceSource, '');
    assert.equal(product.source, '');
    assert.equal(product.priceStatus, 'unverified');
    assert.ok(product.priceCheckedAt);
    assert.match(product.image, /^https:\/\//, `${product.brand} ${product.name} should have a product photo`);
  }
});

test('published guides and comparisons reference valid catalog products in display order', () => {
  assert.equal(articles.length, 6);
  const ids = new Set(products.map((product) => slug(product.brand + ' ' + product.name)));
  for (const article of articles) {
    assert.equal(articleSchema.safeParse(article).success, true, article.title);
    assert.equal(article.status, 'published');
    assert.equal(article.isSample, false);
    assert.ok(article.productIds.length >= 2);
    assert.ok(article.productIds.every((id) => ids.has(id)), article.title);
    if (article.guideProducts.length)
      assert.deepEqual(article.guideProducts.map((entry) => entry.productId), article.productIds);
  }
});
