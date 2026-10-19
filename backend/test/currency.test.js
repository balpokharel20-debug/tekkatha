import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNpr } from '../../shared/currency.js';
import { settingsSchema } from '../src/schemas.js';

test('product prices use Nepalese rupees', () => {
  assert.equal(formatNpr(67999), 'Rs. 67,999');
  assert.equal(formatNpr(149999), 'Rs. 1,49,999');
});

test('brand settings no longer include exchange-rate controls', () => {
  const settings = {
    siteName: 'Tekkatha',
    tagline: 'Technology, Explained.',
    description: 'Tech news.',
    primaryColor: '#1357D6',
    aiName: 'Tekkatha AI',
    adminName: 'Tekkatha CMS',
    contactEmail: 'contact@tekkatha.com',
    editorialEmail: 'editorial@tekkatha.com',
    advertiseEmail: 'advertise@tekkatha.com',
    supportEmail: 'support@tekkatha.com',
  };
  assert.equal(settingsSchema.parse(settings).siteName, 'Tekkatha');
  assert.equal(settingsSchema.safeParse({ ...settings, usdToNpr: 150.25 }).success, false);
});
