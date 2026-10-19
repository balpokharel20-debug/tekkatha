import test from 'node:test';
import assert from 'node:assert/strict';
import { settingsSchema } from '../src/schemas.js';
import { buildSeoData, buildSeoMarkup, MAX_FOOTER_SEO_CODE } from '../../shared/seo.js';

const settings = {
  siteName: 'Tekkatha',
  tagline: 'Technology, Explained.',
  description: 'Technology news and gadget buying guides.',
  primaryColor: '#1357D6',
  aiName: 'Tekkatha AI',
  adminName: 'Tekkatha CMS',
  contactEmail: 'contact@tekkatha.com',
  editorialEmail: 'editorial@tekkatha.com',
  advertiseEmail: 'advertise@tekkatha.com',
  supportEmail: 'support@tekkatha.com',
};

test('footer code preserves HTML and script text; older settings and clearing are supported', () => {
  const code =
    '  <div>Tech & gadgets</div>\n<script type="application/ld+json">{"name":"Tekkatha"}</script>\n';
  assert.equal(settingsSchema.parse({ ...settings, footerSeoCode: code }).footerSeoCode, code);
  assert.equal(settingsSchema.parse(settings).footerSeoCode, '');
  assert.equal(settingsSchema.parse({ ...settings, footerSeoCode: '' }).footerSeoCode, '');
  assert.equal(
    settingsSchema.safeParse({ ...settings, footerSeoCode: 'x'.repeat(MAX_FOOTER_SEO_CODE + 1) })
      .success,
    false,
  );
  assert.equal(settingsSchema.safeParse({ ...settings, footerSeoCode: 42 }).success, false);
});

test('structured data uses the serving origin and current page, without placeholder business facts', () => {
  const data = buildSeoData({
    settings,
    url: 'http://localhost:5173/article/new-phone?tracking=1#details',
    title: 'New phone — Tekkatha',
    description: 'The actual article summary.',
  });
  const [organization, website, page] = data['@graph'];
  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(organization.url, 'http://localhost:5173/');
  assert.equal(organization.logo, 'http://localhost:5173/assets/mark.svg');
  assert.equal(website.publisher['@id'], organization['@id']);
  assert.equal(page.url, 'http://localhost:5173/article/new-phone');
  assert.equal(page.name, 'New phone — Tekkatha');
  assert.equal(page.description, 'The actual article summary.');
  assert.equal(page.isPartOf['@id'], website['@id']);
  for (const key of ['email', 'contactPoint', 'address', 'offers', 'aggregateRating'])
    assert.equal(Object.hasOwn(organization, key), false);
});

test('product markup stays present after client rendering and includes only current sourced NPR offers', () => {
  const product = {
    id: 'phone', brand: 'Example', name: 'Phone', variant: '8 GB / 256 GB', type: 'Smartphones',
    image: '/api/products/phone/image/main?v=1', note: 'A practical device.', price: 82999,
    priceStatus: 'verified', priceSource: 'https://shop.example/phone',
    priceCheckedAt: new Date().toISOString(), availability: 'in-stock',
  };
  const data = buildSeoData({
    settings,
    url: 'https://tekkatha.example/product/phone?variant=1',
    title: 'Example Phone — Tekkatha',
    description: 'A practical device.',
    product,
  });
  const [organization, website, page, entity] = data['@graph'];
  assert.equal(page.url, 'https://tekkatha.example/product/phone');
  assert.equal(page.mainEntity['@id'], 'https://tekkatha.example/product/phone#product');
  assert.equal(entity['@type'], 'Product');
  assert.equal(entity.name, 'Example Phone 8 GB / 256 GB');
  assert.equal(entity.image[0], 'https://tekkatha.example/api/products/phone/image/main?v=1');
  assert.equal(entity.offers.priceCurrency, 'NPR');
  assert.equal(entity.offers.price, 82999);
  assert.equal(entity.offers.availability, 'https://schema.org/InStock');
  assert.equal(Object.hasOwn(entity, 'aggregateRating'), false);

  const stale = buildSeoData({
    settings,
    url: 'https://tekkatha.example/product/phone',
    title: 'Phone',
    product: { ...product, priceCheckedAt: '2020-01-01T00:00:00.000Z' },
  })['@graph'][3];
  assert.equal(Object.hasOwn(stale, 'offers'), false);
  assert.equal(Object.hasOwn(organization, 'offers'), false);
  assert.equal(website.publisher['@id'], organization['@id']);
});

test('copyable SEO HTML cannot be broken by a closing script tag in brand text', () => {
  const name = 'Tech </script><script>alert(1)</script>';
  const markup = buildSeoMarkup({
    settings: { ...settings, siteName: name },
    url: 'https://tekkatha.example/products',
    title: name,
  });
  assert.equal((markup.match(/<script/g) || []).length, 1);
  assert.equal((markup.match(/<\/script>/g) || []).length, 1);
  const data = JSON.parse(markup.slice(markup.indexOf('\n') + 1, markup.lastIndexOf('\n')));
  assert.equal(data['@graph'][0].name, name);
  assert.equal(data['@graph'][2].url, 'https://tekkatha.example/products');
});
