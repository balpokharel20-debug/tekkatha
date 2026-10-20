import { buildSeoData, serializeSeoData } from '../../shared/seo.js';
import { formatNpr } from '../../shared/currency.js';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

function dateValue(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function setMeta(html, attribute, name, content) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${escapedName}["'])[^>]*>`, 'i');
  const tag = `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(content)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', '  ' + tag + String.fromCharCode(10) + '</head>');
}

function setBrandIcon(html, settings) {
  const href = escapeHtml(settings.logoImage || '/assets/mark.svg');
  const tag = `<link rel="icon" href="${href}" />`;
  const pattern = /<link\b(?=[^>]*\brel=["'][^"']*\bicon\b[^"']*["'])[^>]*>/i;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `  ${tag}\n</head>`);
}

function articleMarkup(article, url, siteName) {
  const sections = article.body.map(({ heading }, index) =>
    `<a href="#section-${index}">${escapeHtml(heading)}</a>`,
  ).join('');
  const body = article.body.map(({ heading, text }, index) =>
    `<section id="section-${index}"><h2>${escapeHtml(heading)}</h2>${String(text)
      .split(/\n\s*\n/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
      .join('')}</section>`,
  ).join('');
  const date = dateValue(article.publishedAt || article.createdAt);
  const dateMarkup = !article.isSample && date
    ? `<span class="dot">·</span><time datetime="${date.toISOString()}">${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kathmandu' })}</time>`
    : '';
  const categoryRoutes = {
    'Buying Guides': '/guides',
    Reviews: '/reviews',
    Smartphones: '/smartphones',
    Laptops: '/laptops',
    Gaming: '/gaming',
    'PC Components': '/gaming',
    'PC Builds': '/gaming',
  };
  const categoryPath = categoryRoutes[article.category] || '/news';
  const sampleLabel = article.isSample ? '<span class="pill">Editorial preview</span>' : '';
  const sampleNote = article.isSample
    ? '<div class="article-note">Sample editorial article. Product prices and availability require verification before publication.</div>'
    : '';
  const image = new URL(article.image, url).href;
  const name = siteName;
  return `<header class="header"><div class="container header-main"><a class="brand" href="/" aria-label="Tekkatha home"><img src="/assets/mark.svg" alt="" width="37" height="37"><span class="brand-text">${name}<b>.</b></span></a><nav class="nav-links" aria-label="Main navigation"><a href="/news">News</a><a href="/reviews">Reviews</a><a href="/guides">Buying Guides</a></nav></div></header><main id="main" tabindex="-1"><div class="container article-container"><div class="breadcrumb article-crumb"><a href="/">Home</a><span>/</span><a href="${categoryPath}">${escapeHtml(article.category)}</a></div><header class="article-head"><span class="eyebrow">${escapeHtml(article.category)} ${sampleLabel}</span><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.excerpt)}</p><div class="meta"><span class="avatar" aria-hidden="true">TK</span><span>${escapeHtml(article.author)}</span><span class="dot">·</span><span>${Number(article.read) || 1} min read</span>${dateMarkup}</div></header><img class="article-hero" src="${escapeHtml(image)}" alt="${escapeHtml(article.category)} editorial illustration"><div class="article-layout"><aside class="article-toc"><h2>In this article</h2>${sections}<a class="text-link" href="/ai">Ask Tekkatha AI</a></aside><div class="article-body">${body}${sampleNote}</div></div></div></main><footer class="footer"><div class="container footer-bottom"><a href="/">${name}</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms &amp; Conditions</a></div></footer>`;
}

function productDescription(product) {
  return product.note || [
    `${product.brand} ${product.name}${product.variant ? ` (${product.variant})` : ''}`,
    product.processor && `Processor: ${product.processor}`,
    product.display && `Display: ${product.display}`,
    product.memory && `Memory: ${product.memory}`,
    product.storage && `Storage: ${product.storage}`,
  ].filter(Boolean).join('. ');
}

function productImageUrl(value, siteUrl) {
  if (typeof value !== 'string' || value.startsWith('data:')) return null;
  try {
    const image = new URL(value, `${siteUrl}/`);
    return ['http:', 'https:'].includes(image.protocol) ? image.href : null;
  } catch {
    return null;
  }
}

function reviewBlocksMarkup(blocks, siteUrl) {
  return (blocks || []).map((block) => {
    if (block?.type === 'image') {
      const image = productImageUrl(block.image, siteUrl);
      if (!image) return '';
      return `<figure class="product-review-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(block.alt)}" loading="lazy">${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}</figure>`;
    }
    const paragraphs = String(block?.text || '').split(/\r?\n[ \t]*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\r\n?|\n/g, '<br>')}</p>`).join('');
    return paragraphs ? `<div class="product-review-text">${block.heading ? `<h3>${escapeHtml(block.heading)}</h3>` : ''}${paragraphs}</div>` : '';
  }).join('');
}

function productMarkup(product, siteUrl) {
  const image = productImageUrl(product.image, siteUrl);
  const name = `${product.brand} ${product.name}`;
  const summary = productDescription(product);
  const availability = {
    unverified: 'Availability unverified',
    'in-stock': 'Listed as in stock',
    'out-of-stock': 'Listed as out of stock',
  }[product.availability] || 'Availability unverified';
  const specs = [
    ['Display', product.display], ['Processor', product.processor], ['Memory', product.memory],
    ['Storage', product.storage], ['Battery', product.battery], ['Camera', product.camera],
  ];
  const priceLabel = product.priceStatus === 'verified' ? 'Source recorded'
    : product.priceStatus === 'sample' ? 'Sample price' : 'Unverified price';
  const disclaimer = product.priceStatus === 'sample'
    ? 'This is a sample price, not a current retailer quote.'
    : 'Confirm the current price and exact configuration with the seller.';
  const longDescription = String(product.description || '').split(/\r?\n[ \t]*\r?\n/)
    .map((paragraph) => paragraph.trim()).filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\r\n?|\n/g, '<br>')}</p>`).join('');
  const review = (product.reviewBlocks || []).length
    ? reviewBlocksMarkup(product.reviewBlocks, siteUrl)
    : String(product.review || '').split(/\r?\n[ \t]*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\r\n?|\n/g, '<br>')}</p>`).join('');
  const source = /^https?:\/\//i.test(product.source || '') ? product.source : '';
  const retailer = /^https?:\/\//i.test(product.priceSource || '') ? product.priceSource : '';
  const reviewedDate = dateValue(product.priceCheckedAt);
  const checkedLabel = reviewedDate
    ? ` Checked ${reviewedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kathmandu' })}.`
    : '';
  const buyLink = retailer
    ? `<a class="btn buy-now-btn" href="${escapeHtml(retailer)}" target="_blank" rel="sponsored noopener noreferrer">Buy now</a>` : '';
  return `<div class="container"><div class="page-head"><div class="breadcrumb"><a href="/">Home</a><span>/</span><a href="/products">Products</a><span>/</span><span>${escapeHtml(name)}</span></div><h1>${escapeHtml(name)}</h1><p>${escapeHtml(summary)}</p></div><div class="page-content"><section class="product-detail"><div class="product-detail-image"><span class="pill">${escapeHtml(product.type)}</span>${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}">` : ''}</div><div class="product-detail-copy"><span class="eyebrow">${escapeHtml(product.type)}</span><h2>${escapeHtml(product.name)}</h2><p class="variant">${escapeHtml(product.variant || '')}</p><div class="detail-price">${escapeHtml(formatNpr(product.price || 0))}<span>${escapeHtml(priceLabel)}</span></div><p class="price-disclaimer">${escapeHtml(disclaimer)} ${escapeHtml(availability)}.${checkedLabel}</p><div class="detail-actions">${buyLink}<a class="btn btn-outline" href="/compare">Compare products</a></div>${source ? `<a class="manufacturer-link" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">Manufacturer specifications</a>` : ''}</div></section><section class="spec-section"><div class="section-title"><h2>The details that matter</h2></div><div class="spec-grid">${specs.map(([label, value]) => `<div class="spec-item"><div><span>${label}</span><strong>${escapeHtml(value || 'Not listed')}</strong></div></div>`).join('')}</div></section>${longDescription ? `<section id="product-description" class="product-long-content"><span class="eyebrow">A closer look</span><h2>Full description</h2>${longDescription}</section>` : ''}${review ? `<section id="product-review" class="product-long-content product-review-section"><span class="eyebrow">Beyond the specifications</span><h2>Detailed review</h2>${review}</section>` : ''}</div></div>`;
}

export function renderArticleDocument({ template, article, settings, siteUrl }) {
  const canonical = new URL(`/article/${encodeURIComponent(article.id)}`, `${siteUrl}/`).href;
  const titleSuffix = settings.pageTitleSuffix ?? settings.siteName;
  const title = titleSuffix
    ? `${article.title} — ${titleSuffix}`
    : article.title;
  const description = article.excerpt || settings.description;
  const image = new URL(article.image, `${siteUrl}/`).href;
  const seoData = buildSeoData({ settings, url: canonical, title, description, article });
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setBrandIcon(html, settings);
  if (settings.primaryColor) html = setMeta(html, 'name', 'theme-color', settings.primaryColor);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:site_name', settings.siteName);
  html = setMeta(html, 'property', 'og:type', 'article');
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:url', canonical);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:image:alt', `${article.category} editorial illustration`);
  html = setMeta(html, 'property', 'og:locale', 'en_US');
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', image);
  html = setMeta(html, 'name', 'twitter:image:alt', `${article.category} editorial illustration`);
  const datePublished = dateValue(article.publishedAt || article.createdAt);
  const dateModified = dateValue(article.updatedAt || article.publishedAt || article.createdAt);
  if (datePublished) html = setMeta(html, 'property', 'article:published_time', datePublished.toISOString());
  if (dateModified) html = setMeta(html, 'property', 'article:modified_time', dateModified.toISOString());
  html = setMeta(html, 'property', 'article:author', article.author);
  html = setMeta(html, 'property', 'article:section', article.category);
  if (/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i.test(html))
    html = html.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  else html = html.replace('</head>', `  <link rel="canonical" href="${escapeHtml(canonical)}" />\n</head>`);
  html = html.replace(
    /(<script\b(?=[^>]*\bid=["']tekkatha-structured-data["'])[^>]*>)[\s\S]*?(<\/script>)/i,
    (_match, open, close) => `${open}${serializeSeoData(seoData)}${close}`,
  );
  return html.replace(/<div\s+id=["']app["']\s*><\/div>/i, `<div id="app">${articleMarkup(article, canonical, settings.siteName)}</div>`);
}

export function renderProductDocument({ template, product, settings, siteUrl }) {
  const canonical = new URL(`/product/${encodeURIComponent(product.id)}`, `${siteUrl}/`).href;
  const titleSuffix = settings.pageTitleSuffix ?? settings.siteName;
  const title = titleSuffix
    ? `${product.brand} ${product.name} — ${titleSuffix}`
    : `${product.brand} ${product.name}`;
  const description = productDescription(product) || settings.description;
  const image = productImageUrl(product.image, siteUrl);
  const seoData = buildSeoData({ settings, url: canonical, title, description, product });
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setBrandIcon(html, settings);
  if (settings.primaryColor) html = setMeta(html, 'name', 'theme-color', settings.primaryColor);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:site_name', settings.siteName);
  html = setMeta(html, 'property', 'og:type', 'website');
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:url', canonical);
  if (image) {
    html = setMeta(html, 'property', 'og:image', image);
    html = setMeta(html, 'property', 'og:image:alt', `${product.brand} ${product.name}`);
    html = setMeta(html, 'name', 'twitter:image', image);
    html = setMeta(html, 'name', 'twitter:image:alt', `${product.brand} ${product.name}`);
  }
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  if (/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i.test(html))
    html = html.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  else html = html.replace('</head>', `  <link rel="canonical" href="${escapeHtml(canonical)}" />\n</head>`);
  html = html.replace(
    /(<script\b(?=[^>]*\bid=["']tekkatha-structured-data["'])[^>]*>)[\s\S]*?(<\/script>)/i,
    (_match, open, close) => `${open}${serializeSeoData(seoData)}${close}`,
  );
  return html.replace(/<div\s+id=["']app["']\s*><\/div>/i, `<div id="app">${productMarkup(product, siteUrl)}</div>`);
}
