import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env'),
  quiet: true,
});
const numberWithin = (value, fallback, minimum, maximum) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
};
const runningOnVercel = process.env.VERCEL === '1';
const vercelOrigin = (host) => {
  if (!host) return '';
  try {
    const url = new URL(`https://${host}`);
    return url.origin === `https://${host}` && url.pathname === '/' ? url.origin : '';
  } catch {
    return '';
  }
};
const inferredVercelPublicUrl = vercelOrigin(
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL,
);
const inferredVercelOrigins = [
  inferredVercelPublicUrl,
  vercelOrigin(process.env.VERCEL_URL),
].filter(Boolean);
const configuredOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((x) => x.trim()).filter(Boolean)
  : runningOnVercel
    ? inferredVercelOrigins
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
      ];
export const config = {
  host:
    process.env.HOST || (process.env.NODE_ENV === 'production' || runningOnVercel ? '0.0.0.0' : '127.0.0.1'),
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tekkatha',
  database: process.env.MONGODB_DATABASE || 'tekkatha',
  production: process.env.NODE_ENV === 'production' || runningOnVercel,
  publicSiteUrl:
    process.env.PUBLIC_SITE_URL || inferredVercelPublicUrl || 'http://localhost:5173',
  runningOnVercel,
  trustProxyHops: numberWithin(
    process.env.TRUST_PROXY_HOPS,
    process.env.NODE_ENV === 'production' || runningOnVercel ? 1 : 0,
    0,
    10,
  ),
  origins: [...new Set([...configuredOrigins, ...(runningOnVercel ? inferredVercelOrigins : [])])],
  ai: {
    enabled: process.env.AI_ENABLED !== 'false',
    baseUrl: process.env.AI_BASE_URL || 'https://ai.shahnishant.com.np',
    allowedHost: process.env.AI_ALLOWED_HOST || 'ai.shahnishant.com.np',
    model: process.env.AI_MODEL || 'llama-3.2-3b',
    apiKey: process.env.AI_API_KEY || '',
    timeoutMs: numberWithin(process.env.AI_TIMEOUT_MS, 30000, 3000, 30000),
    maxProducts: numberWithin(process.env.AI_MAX_PRODUCTS, 6, 1, 8),
    maxTokens: numberWithin(process.env.AI_MAX_TOKENS, 700, 100, 1200),
  },
};

export function validateProductionConfig() {
  const problems = [];
  const required = ['MONGODB_URI', 'MONGODB_DATABASE'];
  if (!runningOnVercel) required.push('PUBLIC_SITE_URL', 'ALLOWED_ORIGINS');
  for (const name of required)
    if (!process.env[name]?.trim()) problems.push(`${name} must be set for production.`);
  if (runningOnVercel && !process.env.PUBLIC_SITE_URL && !inferredVercelPublicUrl)
    problems.push('Set PUBLIC_SITE_URL or expose Vercel project URL system environment variables.');
  if (!runningOnVercel && ['localhost', '127.0.0.1', '::1', '[::1]'].includes(config.host))
    problems.push('HOST must bind to a network interface so the production proxy can reach the API.');

  try {
    const url = new URL(config.publicSiteUrl);
    if (url.protocol !== 'https:' || url.origin !== config.publicSiteUrl || url.pathname !== '/')
      problems.push('PUBLIC_SITE_URL must be an HTTPS origin, without a path or trailing slash.');
  } catch {
    problems.push('PUBLIC_SITE_URL must be a valid HTTPS origin.');
  }

  if (new Set(config.origins).size < (runningOnVercel ? 1 : 2))
    problems.push(
      runningOnVercel
        ? 'Configure at least one trusted Vercel HTTPS origin.'
        : 'ALLOWED_ORIGINS must include the public site and CMS HTTPS origins.',
    );
  for (const origin of config.origins) {
    try {
      const url = new URL(origin);
      if (url.protocol !== 'https:' || url.origin !== origin || url.pathname !== '/')
        problems.push(`ALLOWED_ORIGINS entry must be an HTTPS origin: ${origin}`);
    } catch {
      problems.push(`ALLOWED_ORIGINS contains an invalid origin: ${origin}`);
    }
  }
  if (!config.origins.includes(config.publicSiteUrl))
    problems.push('ALLOWED_ORIGINS must include PUBLIC_SITE_URL.');

  try {
    const url = new URL(config.mongoUri);
    const localHost = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);
    if (!['mongodb:', 'mongodb+srv:'].includes(url.protocol) || localHost)
      problems.push('MONGODB_URI must use a remote MongoDB deployment, not localhost.');
    if (url.protocol === 'mongodb:' && url.searchParams.get('tls') !== 'true' && url.searchParams.get('ssl') !== 'true')
      problems.push('Remote mongodb:// connections must enable TLS with tls=true.');
    if (url.searchParams.get('tls') === 'false' || url.searchParams.get('ssl') === 'false')
      problems.push('MONGODB_URI cannot disable TLS in production.');
  } catch {
    problems.push('MONGODB_URI must be a valid MongoDB connection string.');
  }

  if (config.trustProxyHops < 1)
    problems.push('TRUST_PROXY_HOPS must be at least 1 behind the production reverse proxy.');
  if (problems.length)
    throw new Error(`Production configuration is incomplete:\n- ${problems.join('\n- ')}`);
}
