import test from 'node:test';
import assert from 'node:assert/strict';
import { popupNoticeSchema } from '../src/schemas.js';

const base = {
  title: 'Welcome to Tekkatha',
  body: '',
  image: '/assets/popup.webp',
  imageAlt: 'Tekkatha promotion',
  link: 'https://example.com/offer',
  buttonLabel: '',
  displayMode: 'first_visit',
  repeatDays: 7,
  delaySeconds: 0,
  dismissible: true,
  active: true,
  startsAt: '',
  endsAt: '',
};

test('popup banners require clickable artwork and support display rules', () => {
  assert.equal(popupNoticeSchema.parse(base).title, 'Welcome to Tekkatha');
  assert.equal(popupNoticeSchema.parse({ ...base, displayMode: 'after_days', repeatDays: 14, delaySeconds: 30 }).repeatDays, 14);
  assert.equal(popupNoticeSchema.safeParse({ ...base, title: '' }).success, false);
  assert.equal(popupNoticeSchema.safeParse({ ...base, image: '' }).success, false);
  assert.equal(popupNoticeSchema.safeParse({ ...base, link: '' }).success, false);
  assert.equal(popupNoticeSchema.safeParse({ ...base, delaySeconds: -1 }).success, false);
  assert.equal(popupNoticeSchema.safeParse({ ...base, startsAt: '2026-09-18T10:00:00.000Z', endsAt: '2026-09-17T10:00:00.000Z' }).success, false);
});
