import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { ZodError, z } from 'zod';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { connect, db, publicRecord } from './db.js';
import { config, validateProductionConfig } from './config.js';
import {
  sitemapPages,
  buildSitemapIndex,
  buildUrlSet,
  buildRobots,
  recordEntries,
} from './sitemap.js';
import {
  cookieName,
  cookieOptions,
  verifyPassword,
  hashPassword,
  createSession,
  requireAdmin,
  requireSuperAdmin,
  verifyOrigin,
} from './auth.js';
import {
  articleSchema,
  productSchema,
  adSchema,
  popupNoticeSchema,
  settingsSchema,
  loginSchema,
  adminCreateSchema,
  analyticsBatchSchema,
  assistantRequestSchema,
  slug,
  pagination,
  searchRegex,
} from './schemas.js';
import { answerQuestion } from './assistant.js';
import { renderArticleDocument, renderProductDocument } from './prerender.js';
import { getPublicProductImage, publicProduct } from './product-image.js';
import { DEFAULT_BRAND_SETTINGS } from '../../shared/brand-settings.js';
export const app = express();
app.set('trust proxy', config.trustProxyHops);
if (config.runningOnVercel) {
  let initialization;
  app.use((_req, _res, next) => {
    if (!initialization) {
      initialization = (async () => {
        validateProductionConfig();
        await connect();
      })().catch((error) => {
        initialization = undefined;
        throw error;
      });
    }
    initialization.then(() => next(), next);
  });
}
const sitemapStylesheet = readFileSync(new URL('./sitemap.xsl', import.meta.url), 'utf8');
const publicDocumentUrl = new URL('../../frontend/dist/index.html', import.meta.url);
export const publicDocumentTemplate = existsSync(publicDocumentUrl)
  ? readFileSync(publicDocumentUrl, 'utf8')
  : '';
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || config.origins.includes(origin)),
    credentials: true,
  }),
);
app.use('/api/admin/ads', express.json({ limit: '3mb' }));
app.use('/api/admin/products', express.json({ limit: config.runningOnVercel ? '4mb' : '10mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  '/api',
  rateLimit({ windowMs: 60000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }),
);
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
const articleSitemapFilter = { status: 'published', deletedAt: null };
const productSitemapFilter = { deletedAt: null };
const sitemapProjection = { projection: { _id: 0, id: 1, createdAt: 1, updatedAt: 1 } };
function sendXml(res, value) {
  res.set('Cache-Control', 'public, max-age=300').type('application/xml').send(value);
}
app.get('/robots.txt', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300').type('text/plain').send(buildRobots(config.publicSiteUrl));
});
app.get('/sitemap.xsl', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=86400').type('text/xsl').send(sitemapStylesheet);
});
app.get('/sitemap.xml', (_req, res) => res.redirect(308, '/sitemap_index.xml'));
app.get('/sitemap_index.xml', async (_req, res, next) => {
  try {
    const [article, product] = await Promise.all([
      db.collection('articles').find(articleSitemapFilter, sitemapProjection).sort({ updatedAt: -1 }).limit(1).next(),
      db.collection('products').find(productSitemapFilter, sitemapProjection).sort({ updatedAt: -1 }).limit(1).next(),
    ]);
    sendXml(res, buildSitemapIndex(config.publicSiteUrl, {
      articleUpdatedAt: article?.updatedAt || article?.createdAt,
      productUpdatedAt: product?.updatedAt || product?.createdAt,
    }));
  } catch (error) { next(error); }
});
app.get('/page-sitemap.xml', (_req, res) => {
  sendXml(res, buildUrlSet(config.publicSiteUrl, sitemapPages.map((path) => ({ path }))));
});
for (const [path, collection, filter, type] of [
  ['/post-sitemap.xml', 'articles', articleSitemapFilter, 'article'],
  ['/product-sitemap.xml', 'products', productSitemapFilter, 'product'],
]) {
  app.get(path, async (_req, res, next) => {
    try {
      const records = await db.collection(collection).find(filter, sitemapProjection).sort({ createdAt: -1 }).toArray();
      sendXml(res, buildUrlSet(config.publicSiteUrl, recordEntries(records, type)));
    } catch (error) { next(error); }
  });
}
app.get('/api/health', async (_req, res, next) => {
  try {
    await db.command({ ping: 1 });
    res.json({ status: 'ok', database: 'connected' });
  } catch (e) {
    next(e);
  }
});
app.get('/api/settings', async (_req, res, next) => {
  try {
    res.json(publicRecord(await db.collection('settings').findOne({ id: 'brand' })) || DEFAULT_BRAND_SETTINGS);
  } catch (e) {
    next(e);
  }
});
function runningAdsFilter() {
  const now = new Date().toISOString();
  return {
    active: true, deletedAt: null,
    $and: [
      { $or: [{ startsAt: '' }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: '' }, { endsAt: { $gt: now } }] },
    ],
  };
}
app.get('/api/ads', async (_req, res, next) => {
  try {
    const items = await db.collection('ads').find(runningAdsFilter()).sort({ createdAt: 1 }).toArray();
    res.json({ items: items.map((record) => {
      const ad = publicRecord(record);
      if (ad.image.startsWith('data:image/'))
        ad.image = '/api/ads/' + encodeURIComponent(ad.id) + '/image?v=' + new Date(ad.updatedAt).getTime();
      return ad;
    }) });
  } catch (error) { next(error); }
});
app.get('/api/ads/:id/image', async (req, res, next) => {
  try {
    const ad = await db.collection('ads').findOne({ ...runningAdsFilter(), id: req.params.id });
    const encoded = ad?.image.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!encoded) return res.status(404).json({ error: 'This ad image was not found.' });
    res.set('Cross-Origin-Resource-Policy', 'cross-origin').set('Cache-Control', 'public, max-age=60').type(encoded[1]).send(Buffer.from(encoded[2], 'base64'));
  } catch (error) { next(error); }
});
function runningPopupFilter() {
  const now = new Date().toISOString();
  return {
    active: true,
    deletedAt: null,
    $and: [
      { $or: [{ startsAt: '' }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: '' }, { endsAt: { $gt: now } }] },
    ],
  };
}
app.get('/api/popup-notice', async (_req, res, next) => {
  try {
    const notice = await db.collection('notices').findOne(runningPopupFilter(), { sort: { updatedAt: -1 } });
    if (!notice) return res.json(null);
    const value = publicRecord(notice);
    if (value.image?.startsWith('data:image/'))
      value.image = '/api/popup-notice/' + encodeURIComponent(value.id) + '/image?v=' + new Date(value.updatedAt).getTime();
    res.json(value);
  } catch (error) { next(error); }
});
app.get('/api/popup-notice/:id/image', async (req, res, next) => {
  try {
    const notice = await db.collection('notices').findOne({ ...runningPopupFilter(), id: req.params.id });
    const encoded = notice?.image?.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!encoded) return res.status(404).json({ error: 'This popup image was not found.' });
    res.set('Cross-Origin-Resource-Policy', 'cross-origin').set('Cache-Control', 'public, max-age=60').type(encoded[1]).send(Buffer.from(encoded[2], 'base64'));
  } catch (error) { next(error); }
});
for (const name of ['articles', 'products']) {
  app.get('/api/' + name, async (req, res, next) => {
    try {
      const { page, limit } = pagination(req.query);
      const filter = { deletedAt: null, ...(name === 'articles' ? { status: 'published' } : {}) };
      if (typeof req.query.q === 'string' && req.query.q.trim())
        filter.$or = (
          name === 'articles'
            ? ['title', 'excerpt', 'category']
            : ['name', 'brand', 'processor', 'display']
        ).map((key) => ({ [key]: searchRegex(req.query.q) }));
      if (name === 'products') {
        if (typeof req.query.type === 'string') filter.type = req.query.type;
        if (typeof req.query.brand === 'string') filter.brand = req.query.brand;
        if (req.query.maxPrice && !Number.isNaN(Number(req.query.maxPrice)))
          filter.price = { $lte: Number(req.query.maxPrice) };
      } else if (typeof req.query.category === 'string') filter.category = req.query.category;
      const sort =
        name === 'products'
          ? req.query.sort === 'price-low'
            ? { price: 1 }
            : req.query.sort === 'price-high'
              ? { price: -1 }
              : { createdAt: 1 }
          : { createdAt: 1 };
      const [items, total] = await Promise.all([
        db
          .collection(name)
          .find(
            filter,
            name === 'products'
              ? { projection: { description: 0, review: 0, reviewBlocks: 0 } }
              : {},
          )
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        db.collection(name).countDocuments(filter),
      ]);
      res.json({ items: items.map(name === 'products' ? publicProduct : publicRecord), total, page, limit });
    } catch (e) {
      next(e);
    }
  });
  app.get('/api/' + name + '/:id', async (req, res, next) => {
    try {
      const record = await db
        .collection(name)
        .findOne({
          id: req.params.id,
          deletedAt: null,
          ...(name === 'articles' ? { status: 'published' } : {}),
        });
      if (!record) return res.status(404).json({ error: 'This entry was not found.' });
      res.json(name === 'products' ? publicProduct(record) : publicRecord(record));
    } catch (e) {
      next(e);
    }
  });
}
app.get('/api/products/:id/image/:slot', async (req, res, next) => {
  try {
    const product = await db.collection('products').findOne({ id: req.params.id, deletedAt: null });
    const image = getPublicProductImage(product, req.params.slot);
    if (!image) return res.status(404).json({ error: 'This product image was not found.' });
    res.set('Cache-Control', 'public, max-age=86400').type(image.type).send(image.bytes);
  } catch (error) {
    next(error);
  }
});
app.get('/article/:id', async (req, res, next) => {
  try {
    if (!publicDocumentTemplate) return res.status(503).type('text/plain').send('Public site build is unavailable.');
    const article = await db.collection('articles').findOne({
      id: req.params.id,
      status: 'published',
      deletedAt: null,
    });
    if (!article) return res.status(404).type('text/html').send(publicDocumentTemplate);
    const settings = await db.collection('settings').findOne({ id: 'brand' });
    res
      .set('Cache-Control', 'public, max-age=0, must-revalidate')
      .type('html')
      .send(renderArticleDocument({
        template: publicDocumentTemplate,
        article,
        settings: {
          siteName: settings?.siteName || 'Tekkatha',
          tagline: settings?.tagline || 'Technology, Explained.',
          description: settings?.description || 'Technology news, product reviews, prices, comparisons, and buying guides.',
        },
        siteUrl: config.publicSiteUrl,
      }));
  } catch (error) {
    next(error);
  }
});
app.get('/product/:id', async (req, res, next) => {
  try {
    if (!publicDocumentTemplate) return res.status(503).type('text/plain').send('Public site build is unavailable.');
    const record = await db.collection('products').findOne({
      id: req.params.id,
      deletedAt: null,
    });
    if (!record) return res.status(404).type('text/html').send(publicDocumentTemplate);
    const settings = await db.collection('settings').findOne({ id: 'brand' });
    res
      .set('Cache-Control', 'public, max-age=0, must-revalidate')
      .type('html')
      .send(renderProductDocument({
        template: publicDocumentTemplate,
        product: publicProduct(record),
        settings: {
          siteName: settings?.siteName || 'Tekkatha',
          tagline: settings?.tagline || 'Technology, Explained.',
          description: settings?.description || 'Technology news, product reviews, prices, comparisons, and buying guides.',
        },
        siteUrl: config.publicSiteUrl,
      }));
  } catch (error) {
    next(error);
  }
});
app.post(
  '/api/assistant',
  verifyOrigin,
  rateLimit({ windowMs: 60000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false }),
  async (req, res, next) => {
    try {
      const { question, history, contextProductIds } = assistantRequestSchema.parse(req.body);
      res.json(await answerQuestion(question, { history, contextProductIds }));
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  '/api/analytics/events',
  verifyOrigin,
  rateLimit({ windowMs: 60000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }),
  async (req, res, next) => {
    try {
      const { events } = analyticsBatchSchema.parse(req.body);
      const now = new Date();
      await db.collection('analytics').insertMany(events.map((event) => ({ ...event, createdAt: now })));
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);
app.post(
  '/api/auth/login',
  verifyOrigin,
  rateLimit({ windowMs: 15 * 60000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }),
  async (req, res, next) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const admin = await db.collection('admins').findOne({ email });
      if (!admin || !(await verifyPassword(password, admin.passwordHash)))
        return res.status(401).json({ error: 'The email or password is incorrect.' });
      const token = await createSession(admin._id);
      res
        .cookie(cookieName, token, cookieOptions)
        .json({ admin: { email: admin.email, name: admin.name, role: admin.role } });
    } catch (e) {
      next(e);
    }
  },
);
app.get('/api/auth/me', requireAdmin, (req, res) =>
  res.json({ admin: { email: req.admin.email, name: req.admin.name, role: req.admin.role } }),
);
app.post('/api/auth/logout', verifyOrigin, requireAdmin, async (req, res, next) => {
  try {
    await db.collection('sessions').deleteOne({ _id: req.session._id });
    res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined }).json({ ok: true });
  } catch (e) {
    next(e);
  }
});
app.use('/api/admin', verifyOrigin, requireAdmin);
app.get('/api/admin/admins', requireSuperAdmin, async (_req, res, next) => {
  try {
    const admins = await db
      .collection('admins')
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: 1 })
      .toArray();
    res.json({ admins: admins.map(publicRecord) });
  } catch (e) {
    next(e);
  }
});
app.post('/api/admin/admins', requireSuperAdmin, async (req, res, next) => {
  try {
    const value = adminCreateSchema.parse(req.body);
    if (await db.collection('admins').findOne({ email: value.email }))
      return res.status(409).json({ error: 'An administrator with that email already exists.' });
    const { password, ...profile } = value;
    const record = {
      ...profile,
      passwordHash: await hashPassword(password),
      createdAt: new Date(),
    };
    const result = await db.collection('admins').insertOne(record);
    res.status(201).json({ admin: publicRecord({ ...record, id: result.insertedId.toString() }) });
  } catch (e) {
    next(e);
  }
});
app.patch('/api/admin/:collection/:id/active', async (req, res, next) => {
  try {
    if (!['ads', 'notices'].includes(req.params.collection))
      return res.status(404).json({ error: 'This collection was not found.' });
    const value = z.object({ active: z.boolean() }).strict().parse(req.body);
    const record = await db.collection(req.params.collection).findOneAndUpdate(
      { id: req.params.id, deletedAt: null },
      { $set: { ...value, updatedAt: new Date() } },
      { returnDocument: 'after' },
    );
    if (!record) return res.status(404).json({ error: 'This ad was not found.' });
    res.json(publicRecord(record));
  } catch (error) { next(error); }
});
app.get('/api/admin/stats', async (_req, res, next) => {
  try {
    const [published, drafts, products, archivedArticles, archivedProducts] = await Promise.all([
      db.collection('articles').countDocuments({ status: 'published', deletedAt: null }),
      db.collection('articles').countDocuments({ status: 'draft', deletedAt: null }),
      db.collection('products').countDocuments({ deletedAt: null }),
      db.collection('articles').countDocuments({ deletedAt: { $ne: null } }),
      db.collection('products').countDocuments({ deletedAt: { $ne: null } }),
    ]);
    res.json({ published, drafts, products, archivedArticles, archivedProducts });
  } catch (e) {
    next(e);
  }
});
app.get('/api/admin/analytics', async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(90, Number.parseInt(req.query.days, 10) || 30));
    const start = new Date(Date.now() - days * 86400000);
    const events = await db.collection('analytics').find({ createdAt: { $gte: start } }, {
      projection: { _id: 0, visitorId: 1, type: 1, path: 1, durationSec: 1, deviceType: 1, browser: 1, os: 1, language: 1, timezone: 1, createdAt: 1 },
    }).sort({ createdAt: -1 }).limit(100000).toArray();
    const pageviews = events.filter((event) => event.type === 'pageview');
    const sessions = events.filter((event) => event.type === 'session_end' && event.durationSec > 0);
    const countBy = (items, key) => Object.entries(items.reduce((counts, item) => {
      const value = item[key] || 'Unknown';
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, count]) => ({ label, count }));
    const daily = pageviews.reduce((counts, event) => {
      const day = new Date(event.createdAt).toISOString().slice(0, 10);
      counts[day] = (counts[day] || 0) + 1;
      return counts;
    }, {});
    res.json({
      days,
      pageViews: pageviews.length,
      uniqueVisitors: new Set(pageviews.map((event) => event.visitorId)).size,
      averageDurationSec: sessions.length ? Math.round(sessions.reduce((sum, event) => sum + event.durationSec, 0) / sessions.length) : 0,
      topPages: countBy(pageviews, 'path'),
      devices: countBy(pageviews, 'deviceType'),
      browsers: countBy(pageviews, 'browser'),
      operatingSystems: countBy(pageviews, 'os'),
      languages: countBy(pageviews, 'language'),
      dailyViews: Object.entries(daily).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count })),
    });
  } catch (e) {
    next(e);
  }
});
for (const [name, schema] of [
  ['articles', articleSchema],
  ['products', productSchema],
  ['ads', adSchema],
  ['notices', popupNoticeSchema],
]) {
  app.get('/api/admin/' + name, async (req, res, next) => {
    try {
      const { page, limit } = pagination(req.query);
      const filter =
        ['ads', 'notices'].includes(name) && req.query.includeArchived === 'true' ? {} :
        req.query.archived === 'true' ? { deletedAt: { $ne: null } } : { deletedAt: null };
      if (typeof req.query.q === 'string' && req.query.q.trim())
        filter.$or = (name === 'articles' ? ['title', 'category'] : name === 'ads' ? ['title', 'advertiser'] : name === 'notices' ? ['title', 'body'] : ['name', 'brand']).map(
          (key) => ({ [key]: searchRegex(req.query.q) }),
        );
      if (name === 'articles' && ['draft', 'published'].includes(req.query.status))
        filter.status = req.query.status;
      const [items, total] = await Promise.all([
        db
          .collection(name)
          .find(
            filter,
            name === 'products'
              ? { projection: { description: 0, review: 0, reviewBlocks: 0 } }
              : {},
          )
          .sort({ updatedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        db.collection(name).countDocuments(filter),
      ]);
      res.json({ items: items.map(publicRecord), total, page, limit });
    } catch (e) {
      next(e);
    }
  });
  app.post('/api/admin/' + name, async (req, res, next) => {
    try {
      const value = schema.parse(req.body);
      const base = slug(name === 'products' ? value.brand + ' ' + value.name : value.title);
      let id = base;
      if (await db.collection(name).findOne({ id }))
        id = base + '-' + randomBytes(4).toString('hex');
      const record = {
        ...value,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(name === 'articles' && value.status === 'published' ? { publishedAt: new Date() } : {}),
        deletedAt: null,
      };
      await db.collection(name).insertOne(record);
      res.status(201).json(publicRecord(record));
    } catch (e) {
      next(e);
    }
  });
  app.put('/api/admin/' + name + '/:id', async (req, res, next) => {
    try {
      const value = schema.parse(req.body);
      const collection = db.collection(name);
      const filter = { id: req.params.id, deletedAt: null };
      const existing = name === 'articles' ? await collection.findOne(filter) : null;
      const updatedAt = new Date();
      const update = {
        // One image field is overwritten atomically; no previous upload is retained.
        $set: { ...value, updatedAt },
      };
      if (name === 'articles') {
        if (value.status === 'published') {
          update.$set.publishedAt = existing?.status === 'published'
            ? existing.publishedAt || existing.createdAt || updatedAt
            : updatedAt;
        } else {
          update.$unset = { publishedAt: '' };
        }
      }
      const record = await collection.findOneAndUpdate(filter, update, { returnDocument: 'after' });
      if (!record) return res.status(404).json({ error: 'This entry was not found.' });
      res.json(publicRecord(record));
    } catch (e) {
      next(e);
    }
  });
  app.delete('/api/admin/' + name + '/:id', async (req, res, next) => {
    try {
      const result = await db
        .collection(name)
        .updateOne(
          { id: req.params.id, deletedAt: null },
          { $set: { deletedAt: new Date(), updatedAt: new Date() } },
        );
      if (!result.matchedCount) return res.status(404).json({ error: 'This entry was not found.' });
      res.json({ ok: true, archived: true });
    } catch (e) {
      next(e);
    }
  });
  app.post('/api/admin/' + name + '/:id/restore', async (req, res, next) => {
    try {
      const result = await db
        .collection(name)
        .updateOne(
          { id: req.params.id, deletedAt: { $ne: null } },
          { $set: { deletedAt: null, updatedAt: new Date() } },
        );
      if (!result.matchedCount)
        return res.status(404).json({ error: 'The archived entry was not found.' });
      res.json({ ok: true, restored: true });
    } catch (e) {
      next(e);
    }
  });
}
app.put('/api/admin/settings', async (req, res, next) => {
  try {
    const value = settingsSchema.parse(req.body);
    if (req.admin.role !== 'super_admin') {
      const current = await db.collection('settings').findOne(
        { id: 'brand' },
        { projection: { _id: 0, footerSeoCode: 1 } },
      );
      if ((current?.footerSeoCode || '') !== value.footerSeoCode)
        return res.status(403).json({ error: 'Only a super administrator can change public site scripts.' });
    }
    await db
      .collection('settings')
      .updateOne({ id: 'brand' }, { $set: { ...value, updatedAt: new Date() } }, { upsert: true });
    res.json(publicRecord(await db.collection('settings').findOne({ id: 'brand' })));
  } catch (e) {
    next(e);
  }
});
app.use((req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method) || req.path === '/api' || req.path.startsWith('/api/'))
    return next();
  if (!publicDocumentTemplate) return res.status(404).type('text/plain').send('Page not found.');
  res.status(200).type('html').send(publicDocumentTemplate);
});
app.use((_req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((err, _req, res, _next) => {
  if (err instanceof ZodError)
    return res
      .status(400)
      .json({
        error: err.issues.map((i) => `${i.path.join('.') || 'Input'}: ${i.message}`).join('; '),
      });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  if (err.type === 'entity.too.large')
    return res.status(413).json({ error: 'The request is too large.' });
  if (err.code === 11000)
    return res.status(409).json({ error: 'An entry with that identifier already exists.' });
  console.error('API error:', err.name);
  res
    .status(503)
    .json({
      error: 'The service is temporarily unavailable. Check the backend and MongoDB connection.',
    });
});
