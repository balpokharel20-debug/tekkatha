import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderArticleDocument, renderProductDocument } from '../src/prerender.js';
import { getPublicProductImage, publicProduct } from '../src/product-image.js';
import { redImage } from './fixtures/images.js';

const settings = {
  siteName: 'Tekkatha',
  tagline: 'Technology, Explained.',
  description: 'Technology news and buying guidance.',
};

async function render(article) {
  return renderArticleDocument({
    template: await readFile(new URL('../../frontend/index.html', import.meta.url), 'utf8'),
    article,
    settings,
    siteUrl: 'https://www.example.com',
  });
}

test('published article documents include crawler-visible article content and metadata', async () => {
  const html = await render({
    id: 'guide-story',
    title: 'A useful buying guide',
    category: 'Buying Guides',
    excerpt: 'A short description for search results.',
    author: 'Tekkatha Editorial',
    image: '/assets/phone.svg',
    status: 'published',
    isSample: false,
    read: 4,
    publishedAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-19T10:00:00.000Z',
    body: [{ heading: 'Choose the right device', text: 'Compare your options.\n\nCheck the local price.' }],
  });

  assert.match(html, /<title>A useful buying guide — Tekkatha<\/title>/);
  assert.match(html, /<h1>A useful buying guide<\/h1>/);
  assert.match(html, /A short description for search results\./);
  assert.match(html, /rel="canonical" href="https:\/\/www\.example\.com\/article\/guide-story"/);
  assert.match(html, /"@type": "BlogPosting"/);
  assert.match(html, /"datePublished": "2026-10-18T10:00:00\.000Z"/);
  assert.match(html, /Check the local price\./);
});

test('article text is escaped and sample previews do not claim BlogPosting markup', async () => {
  const html = await render({
    id: 'sample-story',
    title: 'Sample <script>alert(1)</script>',
    category: 'Reviews',
    excerpt: 'Preview only.',
    author: 'Tekkatha Editorial',
    image: '/assets/phone.svg',
    status: 'published',
    isSample: true,
    read: 2,
    body: [{ heading: 'Example section', text: '<script>alert(1)</script>' }],
  });

  assert.match(html, /Sample &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Editorial preview/);
  assert.doesNotMatch(html, /"@type": "BlogPosting"/);
});

test('product pages include server-rendered specifications, review, canonical metadata, and Product markup', async () => {
  const html = renderProductDocument({
    template: await readFile(new URL('../../frontend/index.html', import.meta.url), 'utf8'),
    product: publicProduct({
      id: 'phone-model',
      brand: 'Example',
      name: 'Phone Model',
      type: 'Smartphones',
      variant: '8 GB / 256 GB',
      price: 82999,
      priceStatus: 'verified',
      availability: 'in-stock',
      priceSource: 'https://shop.example/phone',
      priceCheckedAt: new Date().toISOString(),
      image: redImage,
      display: '6.5-inch OLED',
      processor: 'Example chipset',
      memory: '8 GB',
      storage: '256 GB',
      battery: '5000 mAh',
      camera: '50 MP',
      note: 'A compact phone for everyday use.',
      description: 'Long description with practical details.',
      reviewBlocks: [
        { type: 'text', heading: 'Our assessment', text: 'Fast for daily tasks.\n\nBattery life is strong.' },
        { type: 'image', image: redImage, alt: 'Phone display', caption: 'Display in daylight' },
      ],
      updatedAt: new Date(),
    }),
    settings,
    siteUrl: 'https://www.example.com',
  });

  assert.match(html, /<title>Example Phone Model — Tekkatha<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/www\.example\.com\/product\/phone-model"/);
  assert.match(html, /<h1>Example Phone Model<\/h1>/);
  assert.match(html, /6\.5-inch OLED/);
  assert.match(html, /Our assessment/);
  assert.match(html, /Battery life is strong\./);
  assert.match(html, /\/api\/products\/phone-model\/image\/review-1/);
  assert.match(html, /"@type": "Product"/);
  assert.match(html, /"priceCurrency": "NPR"/);
  assert.match(html, /"availability": "https:\/\/schema\.org\/InStock"/);
  assert.doesNotMatch(html, /data:image\/png;base64/);
});

test('product structured data omits unverified offers and review ratings', async () => {
  const html = renderProductDocument({
    template: await readFile(new URL('../../frontend/index.html', import.meta.url), 'utf8'),
    product: {
      id: 'sample-phone', brand: 'Example', name: 'Sample Phone', type: 'Smartphones',
      price: 1, priceStatus: 'sample', availability: 'unverified',
      priceSource: 'https://shop.example/phone', image: '/assets/phone.svg',
      review: 'A plain editorial review with no numerical score.',
    },
    settings,
    siteUrl: 'https://www.example.com',
  });
  assert.match(html, /A plain editorial review with no numerical score\./);
  assert.doesNotMatch(html, /"offers"|"@type": "Review"|"@type": "AggregateRating"/);
});

test('public product image data is moved to versioned URLs and deleted or invalid images stay private', () => {
  const product = {
    id: 'phone/model',
    updatedAt: new Date('2026-10-19T00:00:00.000Z'),
    image: redImage,
    reviewBlocks: [
      { type: 'text', text: 'Review' },
      { type: 'image', image: redImage, alt: 'Phone' },
    ],
  };
  const value = publicProduct(product);
  assert.equal(product.image, redImage);
  assert.equal(value._id, undefined);
  assert.match(value.image, /^\/api\/products\/phone%2Fmodel\/image\/main\?v=/);
  assert.match(value.reviewBlocks[1].image, /^\/api\/products\/phone%2Fmodel\/image\/review-1\?v=/);
  assert.equal(getPublicProductImage(product, 'main').type, 'image/png');
  assert.deepEqual(getPublicProductImage(product, 'review-1').bytes, Buffer.from(redImage.split(',')[1], 'base64'));
  assert.equal(getPublicProductImage(product, 'review-0'), null);
  assert.equal(getPublicProductImage({ ...product, deletedAt: new Date() }, 'main'), null);
});
