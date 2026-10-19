import { z } from 'zod';
import { MAX_PRODUCT_IMAGE_TEXT } from '../../shared/product-image.js';
import { isEncodedProductImage } from './product-image.js';
import { AD_PLACEMENTS } from '../../shared/ads.js';
import { MAX_AD_IMAGE_TEXT } from '../../shared/ad-image.js';
import { isEncodedAdGif } from './ad-image.js';
import { MAX_FOOTER_SEO_CODE } from '../../shared/seo.js';
import { MAX_PRODUCT_CONTENT_TEXT } from '../../shared/product-content.js';
const text = (min, max) => z.string().trim().min(min).max(max);
const image = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (x) => (x.startsWith('/assets/') && !x.includes('..')) || /^https?:\/\//i.test(x),
    'Use a /assets/ path or HTTP(S) URL.',
  );
const url = z
  .string()
  .trim()
  .max(2000)
  .refine((x) => x === '' || /^https?:\/\//i.test(x), 'Use an HTTP(S) URL.');
const productImage = z
  .string()
  .trim()
  .max(MAX_PRODUCT_IMAGE_TEXT)
  .refine(
    (value) => image.safeParse(value).success || isEncodedProductImage(value),
    'Use a /assets/ path, HTTP(S) URL, or Base64 JPEG, PNG, or WebP image no larger than 350 KB.',
  );
const productReviewBlock = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('text'),
      heading: text(0, 200).default(''),
      text: z
        .string()
        .max(30000)
        .refine((value) => value.trim().length > 0, 'Review text cannot be empty.'),
    })
    .strict(),
  z
    .object({
      type: z.literal('image'),
      image: productImage,
      alt: text(1, 200),
      caption: text(0, 400).default(''),
    })
    .strict(),
]);
export const articleSchema = z
  .object({
    title: text(1, 180),
    category: z.enum([
      'Technology News',
      'Smartphones',
      'Laptops',
      'PC Components',
      'Gaming',
      'AI',
      'Reviews',
      'Buying Guides',
      'PC Builds',
    ]),
    excerpt: text(0, 400),
    image,
    read: z.number().int().min(1).max(120),
    author: text(1, 100),
    kind: text(1, 60),
    status: z.enum(['draft', 'published']),
    isSample: z.boolean().default(false),
    body: z
      .array(z.object({ heading: text(1, 200), text: text(1, 20000) }))
      .min(1)
      .max(60),
    productIds: z
      .array(z.string().trim().min(1).max(140))
      .max(30)
      .refine((values) => new Set(values).size === values.length, 'Choose each product once.')
      .default([]),
    guideProducts: z
      .array(
        z
          .object({
            productId: z.string().trim().min(1).max(140),
            description: z.string().max(8000).default(''),
          })
          .strict(),
      )
      .max(30)
      .refine(
        (items) => new Set(items.map((item) => item.productId)).size === items.length,
        'Choose each guide product once.',
      )
      .default([]),
  })
  .strict()
  .refine(
    (article) =>
      !article.guideProducts.length ||
      (article.productIds.length === article.guideProducts.length &&
        article.guideProducts.every((item, index) => item.productId === article.productIds[index])),
    {
      message: 'Guide product details must match the selected products and order.',
      path: ['guideProducts'],
    },
  );
export const productSchema = z
  .object({
    brand: text(1, 80),
    name: text(1, 120),
    type: z.enum(['Smartphones', 'Laptops', 'PC Components', 'Gaming', 'Accessories']),
    price: z.number().min(0).max(10000000),
    priceStatus: z.enum(['sample', 'verified', 'unverified']),
    priceSource: url.default(''),
    priceCheckedAt: z
      .string()
      .refine((x) => x === '' || !Number.isNaN(Date.parse(x)), 'Use a valid date.')
      .default(''),
    availability: z.enum(['unverified', 'in-stock', 'out-of-stock']),
    variant: text(0, 150),
    image: productImage,
    display: text(0, 200),
    processor: text(0, 200),
    battery: text(0, 100),
    memory: text(0, 100),
    storage: text(0, 100),
    camera: text(0, 200),
    source: url,
    note: text(0, 600),
    description: z.string().max(MAX_PRODUCT_CONTENT_TEXT).default(''),
    review: z.string().max(MAX_PRODUCT_CONTENT_TEXT).default(''),
    reviewBlocks: z
      .array(productReviewBlock)
      .max(80)
      .refine(
        (blocks) =>
          blocks.reduce(
            (length, block) =>
              length + (block.type === 'text' ? block.heading.length + block.text.length : 0),
            0,
          ) <= MAX_PRODUCT_CONTENT_TEXT,
        'The combined review text is too long.',
      )
      .refine(
        (blocks) =>
          blocks.reduce(
            (length, block) =>
              length +
              (block.type === 'image' && block.image.startsWith('data:image/')
                ? block.image.length
                : 0),
            0,
          ) <= 6 * 1024 * 1024,
        'The combined uploaded review images are too large.',
      )
      .default([]),
    variants: z
      .array(
        z
          .object({
            label: text(1, 150),
            price: z.number().min(0).max(10000000),
            priceStatus: z.enum(['sample', 'verified', 'unverified']),
            priceSource: url.default(''),
            priceCheckedAt: z
              .string()
              .refine((x) => x === '' || !Number.isNaN(Date.parse(x)), 'Use a valid date.')
              .default(''),
            availability: z.enum(['unverified', 'in-stock', 'out-of-stock']),
          })
          .strict()
          .refine(
            (variant) => variant.priceStatus !== 'verified' || (variant.priceSource && variant.priceCheckedAt),
            'A verified variant price needs a retailer source and date checked.',
          ),
      )
      .max(30)
      .refine(
        (variants) => new Set(variants.map((variant) => variant.label.toLowerCase())).size === variants.length,
        'Each variant label must be unique.',
      )
      .default([]),
  })
  .strict()
  .refine(
    (p) => p.priceStatus !== 'verified' || (p.priceSource && p.priceCheckedAt),
    'A verified price needs a retailer source and date checked.',
  );
const adDate = z
  .union([z.literal(''), z.iso.datetime({ offset: true })])
  .transform((value) => (value ? new Date(value).toISOString() : ''));
export const adSchema = z
  .object({
    title: text(1, 120),
    advertiser: text(1, 100),
    alt: text(1, 200),
    image: z
      .string()
      .trim()
      .max(MAX_AD_IMAGE_TEXT)
      .refine(
        (value) => productImage.safeParse(value).success || isEncodedAdGif(value),
        'Use an image URL, a compressed JPEG/PNG/WebP, or a Base64 GIF no larger than 2 MB.',
      ),
    link: z
      .string()
      .trim()
      .max(2000)
      .url()
      .refine((value) => /^https?:\/\//i.test(value), 'Use an HTTP(S) destination URL.'),
    placements: z
      .array(z.enum(AD_PLACEMENTS.map((placement) => placement.id)))
      .min(1)
      .max(AD_PLACEMENTS.length)
      .refine((values) => new Set(values).size === values.length, 'Choose each placement once.'),
    active: z.boolean().default(false),
    startsAt: adDate.default(''),
    endsAt: adDate.default(''),
  })
  .strict()
  .refine((ad) => !ad.startsAt || !ad.endsAt || Date.parse(ad.endsAt) > Date.parse(ad.startsAt), {
    message: 'The end date must be after the start date.',
    path: ['endsAt'],
  });
const popupImage = z
  .string()
  .trim()
  .max(MAX_PRODUCT_IMAGE_TEXT)
  .refine(
    (value) =>
      image.safeParse(value).success || isEncodedProductImage(value),
    'Upload a JPEG, PNG, or WebP image, or use a direct /assets/ path or HTTP(S) image URL.',
  );
const popupLink = url.refine((value) => value !== '', 'Add the destination link for this popup banner.');
export const popupNoticeSchema = z
  .object({
    title: text(1, 120),
    body: z.string().trim().max(5000).default(''),
    image: popupImage,
    imageAlt: z.string().trim().max(200).default(''),
    link: popupLink,
    buttonLabel: z.string().trim().max(40).default(''),
    displayMode: z.enum(['first_visit', 'every_visit', 'after_days']).default('first_visit'),
    repeatDays: z.number().int().min(1).max(365).default(7),
    delaySeconds: z.number().int().min(0).max(86400).default(0),
    dismissible: z.boolean().default(true),
    active: z.boolean().default(false),
    startsAt: adDate.default(''),
    endsAt: adDate.default(''),
  })
  .strict()
  .refine((notice) => !notice.startsAt || !notice.endsAt || Date.parse(notice.endsAt) > Date.parse(notice.startsAt), {
    message: 'The end date must be after the start date.',
    path: ['endsAt'],
  });
export const settingsSchema = z
  .object({
    siteName: text(1, 60),
    tagline: text(1, 120),
    description: text(1, 400),
    primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
    aiName: text(1, 60),
    adminName: text(1, 60),
    contactEmail: z.email(),
    editorialEmail: z.email(),
    advertiseEmail: z.email(),
    supportEmail: z.email(),
    footerSeoCode: z.string().max(MAX_FOOTER_SEO_CODE).default(''),
  })
  .strict();
export const loginSchema = z
  .object({
    email: z.email().transform((x) => x.toLowerCase()),
    password: z.string().min(1).max(256),
  })
  .strict();
export const adminCreateSchema = z
  .object({
    email: z.email().transform((value) => value.toLowerCase()),
    name: text(1, 100),
    password: z.string().min(12).max(256),
    role: z.enum(['admin', 'super_admin']),
  })
  .strict();
const analyticsEventSchema = z
  .object({
    visitorId: z.string().regex(/^[a-zA-Z0-9_-]{16,80}$/),
    sessionId: z.string().regex(/^[a-zA-Z0-9_-]{16,80}$/),
    type: z.enum(['pageview', 'heartbeat', 'session_end']),
    path: z.string().regex(/^\/[a-zA-Z0-9_/?=&%.:-]*$/).max(300),
    durationSec: z.number().int().min(0).max(86400).default(0),
    deviceType: z.enum(['mobile', 'tablet', 'desktop']),
    browser: text(1, 40),
    os: text(1, 40),
    language: z.string().trim().min(2).max(20),
    timezone: z.string().trim().min(1).max(80),
  })
  .strict();
export const analyticsBatchSchema = z.object({ events: z.array(analyticsEventSchema).min(1).max(20) }).strict();
const assistantHistoryMessageSchema = z
  .object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(2000),
  })
  .strict();
export const assistantRequestSchema = z
  .object({
    question: z.string().trim().min(1).max(1000),
    history: z.array(assistantHistoryMessageSchema).max(8).default([]),
    contextProductIds: z
      .array(z.string().trim().min(1).max(140))
      .max(8)
      .refine((values) => new Set(values).size === values.length, 'Use each context product once.')
      .default([]),
  })
  .strict();
export function slug(value) {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100) || 'entry'
  );
}
export function pagination(query) {
  return {
    page: Math.max(1, Math.min(100000, parseInt(query.page, 10) || 1)),
    limit: Math.max(1, Math.min(100, parseInt(query.limit, 10) || 30)),
  };
}
export function searchRegex(value) {
  return new RegExp(
    String(value)
      .slice(0, 200)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    'i',
  );
}
