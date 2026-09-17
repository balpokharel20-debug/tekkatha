import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { ZodError, z } from 'zod';
import { randomBytes } from 'node:crypto';
import { db, publicRecord } from './db.js';
import { config } from './config.js';
import {
  cookieName,
  cookieOptions,
  verifyPassword,
  createSession,
  requireAdmin,
  verifyOrigin,
} from './auth.js';
import {
  articleSchema,
  productSchema,
  settingsSchema,
  loginSchema,
  slug,
  pagination,
  searchRegex,
} from './schemas.js';
import { answerQuestion } from './assistant.js';
export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || config.origins.includes(origin)),
    credentials: true,
  }),
);
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
app.get('/api/health', async (_req, res, next) => {
  try {
    await db.command({ ping: 1 });
    res.json({ status: 'ok', database: 'connected', databaseName: config.database });
  } catch (e) {
    next(e);
  }
});
app.get('/api/settings', async (_req, res, next) => {
  try {
    res.json(publicRecord(await db.collection('settings').findOne({ id: 'brand' })));
  } catch (e) {
    next(e);
  }
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
          .find(filter)
          .sort(sort)
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
      res.json(publicRecord(record));
    } catch (e) {
      next(e);
    }
  });
}
app.post(
  '/api/assistant',
  verifyOrigin,
  rateLimit({ windowMs: 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }),
  async (req, res, next) => {
    try {
      const { question } = z
        .object({ question: z.string().trim().min(1).max(1000) })
        .strict()
        .parse(req.body);
      res.json(await answerQuestion(question));
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
for (const [name, schema] of [
  ['articles', articleSchema],
  ['products', productSchema],
]) {
  app.get('/api/admin/' + name, async (req, res, next) => {
    try {
      const { page, limit } = pagination(req.query);
      const filter =
        req.query.archived === 'true' ? { deletedAt: { $ne: null } } : { deletedAt: null };
      if (typeof req.query.q === 'string' && req.query.q.trim())
        filter.$or = (name === 'articles' ? ['title', 'category'] : ['name', 'brand']).map(
          (key) => ({ [key]: searchRegex(req.query.q) }),
        );
      if (name === 'articles' && ['draft', 'published'].includes(req.query.status))
        filter.status = req.query.status;
      const [items, total] = await Promise.all([
        db
          .collection(name)
          .find(filter)
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
      const base = slug(name === 'articles' ? value.title : value.brand + ' ' + value.name);
      let id = base;
      if (await db.collection(name).findOne({ id }))
        id = base + '-' + randomBytes(4).toString('hex');
      const record = {
        ...value,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const record = await db
        .collection(name)
        .findOneAndUpdate(
          { id: req.params.id, deletedAt: null },
          { $set: { ...value, updatedAt: new Date() } },
          { returnDocument: 'after' },
        );
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
    await db
      .collection('settings')
      .updateOne({ id: 'brand' }, { $set: { ...value, updatedAt: new Date() } }, { upsert: true });
    res.json(publicRecord(await db.collection('settings').findOne({ id: 'brand' })));
  } catch (e) {
    next(e);
  }
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
