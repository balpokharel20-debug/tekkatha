import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sitemapPages,
  buildSitemapIndex,
  buildUrlSet,
  buildRobots,
  recordEntries,
} from '../src/sitemap.js';

test('sitemap index points to the three public XML maps with real modification dates', () => {
  const xml = buildSitemapIndex('https://tekkatha.example/path/', {
    articleUpdatedAt: new Date('2026-09-20T12:30:00Z'),
  });
  assert.match(xml, /<sitemapindex xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  assert.match(xml, /<loc>https:\/\/tekkatha.example\/page-sitemap.xml<\/loc>/);
  assert.match(xml, /<loc>https:\/\/tekkatha.example\/post-sitemap.xml<\/loc><lastmod>2026-09-20T12:30:00.000Z<\/lastmod>/);
  assert.match(xml, /<loc>https:\/\/tekkatha.example\/product-sitemap.xml<\/loc><\/sitemap>/);
  assert.equal((xml.match(/<sitemap>/g) || []).length, 3);
});

test('URL sitemap includes canonical pages and escapes XML special characters', () => {
  const xml = buildUrlSet('https://tekkatha.example', [
    ...sitemapPages.map((path) => ({ path })),
    { path: '/article/phones?brand=A&B', lastmod: '2026-09-19T00:00:00Z' },
  ]);
  assert.match(xml, /<loc>https:\/\/tekkatha.example\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/tekkatha.example\/article\/phones\?brand=A&amp;B<\/loc>/);
  assert.match(xml, /<lastmod>2026-09-19T00:00:00.000Z<\/lastmod>/);
  assert.equal((xml.match(/<url>/g) || []).length, sitemapPages.length + 1);
});

test('static sitemap includes public legal pages', () => {
  assert.ok(sitemapPages.includes('/privacy'));
  assert.ok(sitemapPages.includes('/terms'));
});

test('content entries encode identifiers and robots advertises the XML index', () => {
  const entries = recordEntries([
    { id: 'phone & tablet', updatedAt: new Date('2026-09-20T00:00:00Z') },
    { id: '' },
  ], 'product');
  assert.deepEqual(entries, [{ path: '/product/phone%20%26%20tablet', lastmod: new Date('2026-09-20T00:00:00Z') }]);
  assert.match(buildRobots('https://tekkatha.example/'), /Sitemap: https:\/\/tekkatha.example\/sitemap_index.xml/);
});
