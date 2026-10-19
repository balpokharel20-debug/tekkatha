import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { restoreOriginalPath } from '../../api/request-path.js';

test('Vercel rewrites restore backend paths and preserve request queries', () => {
  const req = {
    url: '/api/index?__vercel_path=%2Fapi%2Fproducts&page=2&category=phone',
  };

  restoreOriginalPath(req);

  assert.equal(req.url, '/api/products?page=2&category=phone');
});

test('Vercel rewrite adapter leaves direct function requests intact', () => {
  const req = { url: '/api/index?status=ready' };

  restoreOriginalPath(req);

  assert.equal(req.url, '/api/index?status=ready');
});

test('Vercel deploys static output separately and routes app requests through the API function', async () => {
  const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));
  const rewrites = config.rewrites;

  assert.equal(config.framework, null);
  assert.equal(config.outputDirectory, 'public');
  assert.ok(rewrites.some(({ source, destination }) => source === '/api/:path*' && destination.startsWith('/api/index?')));
  assert.ok(rewrites.some(({ source, destination }) => source === '/:path*' && destination.startsWith('/api/index?')));
});
