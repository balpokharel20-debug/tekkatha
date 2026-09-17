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
