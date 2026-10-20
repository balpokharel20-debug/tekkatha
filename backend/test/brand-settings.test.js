import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_BRAND_SETTINGS, withDefaultBrandSettings } from '../../shared/brand-settings.js';

test('missing brand settings use safe defaults for a fresh production database', () => {
  assert.deepEqual(withDefaultBrandSettings(null), DEFAULT_BRAND_SETTINGS);
});

test('stored brand settings override defaults without dropping newer defaults', () => {
  const settings = withDefaultBrandSettings({ siteName: 'Tekkatha Nepal' });

  assert.equal(settings.siteName, 'Tekkatha Nepal');
  assert.equal(settings.tagline, DEFAULT_BRAND_SETTINGS.tagline);
  assert.equal(settings.logoImage, DEFAULT_BRAND_SETTINGS.logoImage);
  assert.equal(settings.homepageTitle, DEFAULT_BRAND_SETTINGS.homepageTitle);
  assert.equal(settings.pageTitleSuffix, DEFAULT_BRAND_SETTINGS.pageTitleSuffix);
  assert.equal(settings.footerSeoCode, '');
  assert.notEqual(settings, DEFAULT_BRAND_SETTINGS);
});
