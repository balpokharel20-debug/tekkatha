import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { connect, client } from '../src/db.js';
import { redImage, animatedGif } from '../test/fixtures/images.js';

const base = 'http://127.0.0.1:4000/api';
const origin = 'http://localhost:5174';
const ids = [];
const run = randomBytes(6).toString('hex');
let cookie = '';
async function request(route, method = 'GET', body, authenticated = false, requestOrigin = origin) {
  const response = await fetch(base + route, {
    method,
    headers: {
      Origin: requestOrigin,
      'Content-Type': 'application/json',
      ...(authenticated ? { Cookie: cookie } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get('set-cookie'),
  };
}
async function publicIds() {
  const response = await request('/ads');
  assert.equal(response.status, 200);
  return response.data.items.map((ad) => ad.id).filter((id) => ids.includes(id));
}
try {
  const credentials = JSON.parse(
    await readFile(new URL('../../.local/admin-credentials.json', import.meta.url)),
  );
  assert.equal((await request('/admin/ads')).status, 401);
  const login = await request('/auth/login', 'POST', {
    email: credentials.email,
    password: credentials.password,
  });
  assert.equal(login.status, 200);
  cookie = login.cookie.split(';')[0];
  const campaign = {
    title: 'ADS-INTEGRATION-' + run,
    advertiser: 'Integration test',
    alt: 'Temporary test banner',
    image: animatedGif,
    link: 'https://example.com/test-ad',
    placements: ['site-top', 'home-sidebar'],
    active: true,
    startsAt: '',
    endsAt: '',
  };
  async function create(value) {
    const result = await request('/admin/ads', 'POST', value, true);
    assert.equal(result.status, 201);
    ids.push(result.data.id);
    return result.data;
  }
  const first = await create(campaign);
  const second = await create({ ...campaign, title: campaign.title + '-second', image: redImage });
  const imageResponse = await fetch(base + '/ads/' + first.id + '/image');
  assert.equal(imageResponse.status, 200);
  assert.equal(imageResponse.headers.get('content-type'), 'image/gif');
  assert.equal(
    Buffer.from(await imageResponse.arrayBuffer()).toString('base64'),
    animatedGif.split(',')[1],
  );
  const publicCampaigns = (await request('/ads')).data.items;
  assert.ok(publicCampaigns.find((ad) => ad.id === first.id).image.startsWith('/api/ads/'));
  const future = new Date(Date.now() + 86400000).toISOString();
  const past = new Date(Date.now() - 86400000).toISOString();
  await create({ ...campaign, title: campaign.title + '-future', startsAt: future });
  await create({ ...campaign, title: campaign.title + '-expired', endsAt: past });
  await create({ ...campaign, title: campaign.title + '-paused', active: false });
  assert.deepEqual(new Set(await publicIds()), new Set([first.id, second.id]));

  // A valid GIF with large comment blocks exercises the dedicated 3 MB JSON limit.
  const gifBytes = Buffer.from(animatedGif.split(',')[1], 'base64');
  const blocks = Array.from({ length: 4200 }, () =>
    Buffer.concat([Buffer.from([255]), Buffer.alloc(255, 65)]),
  );
  const largeGif =
    'data:image/gif;base64,' +
    Buffer.concat([
      gifBytes.subarray(0, -1),
      Buffer.from([33, 254]),
      ...blocks,
      Buffer.from([0, 59]),
    ]).toString('base64');
  assert.ok(largeGif.length > 1024 * 1024);
  const large = await create({
    ...campaign,
    title: campaign.title + '-large-gif',
    image: largeGif,
    active: false,
  });
  assert.equal(large.image, largeGif);

  assert.equal(
    (await request('/admin/ads', 'POST', { ...campaign, placements: ['unknown'] }, true)).status,
    400,
  );
  assert.equal(
    (
      await request(
        '/admin/ads/' + first.id + '/active',
        'PATCH',
        { active: false },
        true,
        'https://untrusted.example',
      )
    ).status,
    403,
  );
  assert.equal(
    (await request('/admin/ads/' + first.id + '/active', 'PATCH', { active: false }, true)).status,
    200,
  );
  assert.deepEqual(await publicIds(), [second.id]);
  assert.equal((await fetch(base + '/ads/' + first.id + '/image')).status, 404);
  assert.equal(
    (await request('/admin/ads/' + first.id + '/active', 'PATCH', { active: true }, true)).status,
    200,
  );
  assert.ok((await publicIds()).includes(first.id));

  const changed = {
    ...campaign,
    image: redImage,
    placements: ['article-inline', 'product-details'],
  };
  assert.equal((await request('/admin/ads/' + first.id, 'PUT', changed, true)).status, 200);
  assert.equal((await request('/admin/ads/' + second.id, 'DELETE', {}, true)).status, 200);
  assert.deepEqual(await publicIds(), [first.id]);
  assert.equal(
    (await request('/admin/ads/' + second.id + '/restore', 'POST', {}, true)).status,
    200,
  );
  assert.ok((await publicIds()).includes(second.id));
  const db = await connect();
  const saved = await db.collection('ads').findOne({ id: first.id });
  assert.equal(saved.image, redImage);
  assert.equal(JSON.stringify(saved).includes(animatedGif), false);
  assert.deepEqual(saved.placements, changed.placements);
  assert.equal((await db.collection('ads').findOne({ id: large.id })).image, largeGif);
  assert.equal((await request('/auth/logout', 'POST', {}, true)).status, 200);
  console.log(
    'PASS: ad auth, multiple placements, animated GIF persistence, uploads over 1 MB, schedule filtering, pause/enable, image replacement, archive/restore, and origin checks.',
  );
} catch (error) {
  console.error('Ad integration check failed:', error.message);
  process.exitCode = 1;
} finally {
  const db = await connect();
  if (ids.length) await db.collection('ads').deleteMany({ id: { $in: ids } });
  if (cookie) await request('/auth/logout', 'POST', {}, true).catch(() => {});
  await client.close();
}
