import test from 'node:test';
import assert from 'node:assert/strict';
import { adSchema } from '../src/schemas.js';
import { AD_PLACEMENTS, createAdRotation, isAdRunning, adStatus } from '../../shared/ads.js';
import { MAX_AD_GIF_BYTES } from '../../shared/ad-image.js';
import { prepareAdImage } from '../../admin/ad-image.js';
import { redImage, animatedGif } from './fixtures/images.js';

const campaign = {
  title: 'Test campaign',
  advertiser: 'Test advertiser',
  alt: 'Banner offer',
  image: redImage,
  link: 'https://example.com/offer',
  placements: ['site-top'],
  active: true,
  startsAt: '',
  endsAt: '',
};
const now = Date.parse('2026-09-17T06:00:00Z');

test('ad campaigns validate image, placement, link, and schedule and normalize time zones', () => {
  assert.equal(adSchema.safeParse(campaign).success, true);
  for (const value of [
    { placements: [] },
    { placements: ['unknown'] },
    { placements: ['site-top', 'site-top'] },
    { link: 'javascript:alert(1)' },
    { startsAt: 'not-a-date' },
    { startsAt: '2026-09-18T00:00:00Z', endsAt: '2026-09-17T00:00:00Z' },
  ])
    assert.equal(adSchema.safeParse({ ...campaign, ...value }).success, false);
  assert.equal(
    adSchema.parse({ ...campaign, startsAt: '2026-09-17T11:45:00+05:45' }).startsAt,
    '2026-09-17T06:00:00.000Z',
  );
  assert.equal(AD_PLACEMENTS.length, 6);
});

test('paused, future, expired and archived campaigns do not run', () => {
  assert.equal(isAdRunning(campaign, now), true);
  const variants = [
    [{ active: false }, 'paused'],
    [{ startsAt: '2026-09-18T00:00:00Z' }, 'scheduled'],
    [{ endsAt: '2026-09-17T06:00:00Z' }, 'expired'],
    [{ deletedAt: new Date(now) }, 'archived'],
  ];
  for (const [value, status] of variants) {
    assert.equal(isAdRunning({ ...campaign, ...value }, now), false);
    assert.equal(adStatus({ ...campaign, ...value }, now), status);
  }
  assert.equal(isAdRunning({ ...campaign, startsAt: '2026-09-17T06:00:00Z' }, now), true);
});

test('every placement rotates all eligible ads once per cycle without consecutive repeats', () => {
  const rotation = createAdRotation(() => 0);
  const candidates = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  let previous;
  for (let cycle = 0; cycle < 8; cycle++) {
    const seen = new Set();
    for (let i = 0; i < candidates.length; i++) {
      const ad = rotation.next('site-top', candidates);
      assert.notEqual(ad.id, previous);
      previous = ad.id;
      seen.add(ad.id);
    }
    assert.equal(seen.size, candidates.length);
  }
  assert.equal(rotation.next('home-sidebar', candidates).id, 'b', 'placements have separate bags');
  assert.equal(rotation.next('site-top', [{ id: 'replacement' }]).id, 'replacement');
  assert.equal(rotation.next('site-top', []), null);
});

test('animated GIF text is allowed for ads and bounded to 2 MB', () => {
  assert.equal(adSchema.safeParse({ ...campaign, image: animatedGif }).success, true);
  assert.equal(
    adSchema.safeParse({ ...campaign, image: animatedGif.replace('image/gif', 'image/png') })
      .success,
    false,
  );
  const bytes = Buffer.from(animatedGif.split(',')[1], 'base64');
  const oversized = Buffer.alloc(MAX_AD_GIF_BYTES + 1);
  bytes.copy(oversized);
  oversized[oversized.length - 1] = 0x3b;
  assert.equal(
    adSchema.safeParse({
      ...campaign,
      image: 'data:image/gif;base64,' + oversized.toString('base64'),
    }).success,
    false,
  );
});

test('GIF files named .gof keep all animation bytes and receive an image/gif data URL', async () => {
  const previousReader = globalThis.FileReader;
  globalThis.FileReader = class {
    async readAsDataURL(file) {
      this.result = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`;
      this.onload();
    }
  };
  try {
    const bytes = Buffer.from(animatedGif.split(',')[1], 'base64');
    const file = new File([bytes], 'banner.gof', { type: 'application/octet-stream' });
    const prepared = await prepareAdImage(file);
    assert.equal(prepared.text, animatedGif);
    assert.equal(prepared.animated, true);
    assert.equal(prepared.width, 1);
    assert.equal(prepared.bytes, bytes.length);
  } finally {
    if (previousReader) globalThis.FileReader = previousReader;
    else delete globalThis.FileReader;
  }
});
