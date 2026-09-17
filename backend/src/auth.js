import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { db } from './db.js';
import { config } from './config.js';
const derive = promisify(scrypt);
export const cookieName = 'tekkatha_session';
export const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: config.production,
  path: '/api',
  maxAge: 8 * 60 * 60 * 1000,
};
export const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  try {
    const [method, salt, key] = stored.split(':');
    if (method !== 'scrypt') return false;
    const supplied = await derive(password, salt, 64);
    const expected = Buffer.from(key, 'hex');
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  } catch {
    return false;
  }
}
export async function createSession(adminId) {
  const token = randomBytes(32).toString('base64url');
  await db
    .collection('sessions')
    .insertOne({
      adminId,
      tokenHash: tokenHash(token),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + cookieOptions.maxAge),
    });
  return token;
}
export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies[cookieName];
    if (typeof token !== 'string' || token.length > 100)
      return res.status(401).json({ error: 'Sign in to Tekkatha CMS.' });
    const session = await db
      .collection('sessions')
      .findOne({ tokenHash: tokenHash(token), expiresAt: { $gt: new Date() } });
    if (!session)
      return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
    const admin = await db
      .collection('admins')
      .findOne({ _id: session.adminId, role: 'super_admin' });
    if (!admin) return res.status(401).json({ error: 'Sign in to Tekkatha CMS.' });
    req.admin = admin;
    req.session = session;
    next();
  } catch (e) {
    next(e);
  }
}
export function verifyOrigin(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (!config.origins.includes(req.get('origin')))
    return res.status(403).json({ error: 'This request origin is not allowed.' });
  if (!req.is('application/json')) return res.status(415).json({ error: 'Send application/json.' });
  next();
}
