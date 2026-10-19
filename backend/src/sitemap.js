const namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9';

export const sitemapPages = [
  '/',
  '/news',
  '/reviews',
  '/guides',
  '/gaming',
  '/smartphones',
  '/laptops',
  '/products',
  '/prices',
  '/compare',
  '/ai',
  '/about',
  '/contact',
  '/editorial-policy',
  '/privacy',
  '/terms',
  '/sitemap',
];

const escapeXml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
})[character]);

const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n';

export function siteOrigin(siteUrl) {
  return new URL(siteUrl).origin;
}

export function xmlDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function buildSitemapIndex(siteUrl, { articleUpdatedAt, productUpdatedAt } = {}) {
  const origin = siteOrigin(siteUrl);
  const maps = [
    { path: '/page-sitemap.xml' },
    { path: '/post-sitemap.xml', lastmod: articleUpdatedAt },
    { path: '/product-sitemap.xml', lastmod: productUpdatedAt },
  ];
  return xmlHeader + `<sitemapindex xmlns="${namespace}">\n` + maps.map(({ path, lastmod }) => {
    const date = xmlDate(lastmod);
    return `  <sitemap><loc>${escapeXml(origin + path)}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</sitemap>`;
  }).join('\n') + '\n</sitemapindex>';
}

export function buildUrlSet(siteUrl, entries) {
  const origin = siteOrigin(siteUrl);
  return xmlHeader + `<urlset xmlns="${namespace}">\n` + entries.map(({ path, lastmod }) => {
    const date = xmlDate(lastmod);
    return `  <url><loc>${escapeXml(new URL(path, origin).href)}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`;
  }).join('\n') + '\n</urlset>';
}

export function recordEntries(records, type) {
  return records.filter((record) => record?.id).map((record) => ({
    path: `/${type}/${encodeURIComponent(record.id)}`,
    lastmod: record.updatedAt || record.createdAt,
  }));
}

export function buildRobots(siteUrl) {
  return `User-agent: *\nAllow: /\nSitemap: ${siteOrigin(siteUrl)}/sitemap_index.xml\n`;
}
