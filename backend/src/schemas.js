import { z } from 'zod';
import { MAX_PRODUCT_IMAGE_TEXT } from '../../shared/product-image.js';
import { isEncodedProductImage } from './product-image.js';
import { AD_PLACEMENTS } from '../../shared/ads.js';
import { MAX_AD_IMAGE_TEXT } from '../../shared/ad-image.js';
import { isEncodedAdGif } from './ad-image.js';
import { MAX_FOOTER_SEO_CODE } from '../../shared/seo.js';
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
  })
  .strict();
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
