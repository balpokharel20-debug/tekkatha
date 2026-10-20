'use strict';
import { createAdDisplay } from './ads.js';
import { createFooterSeo } from './seo.js';
import { renderProductText } from '../shared/product-content.js';
import { formatNpr } from '../shared/currency.js';
import { DEFAULT_BRAND_SETTINGS } from '../shared/brand-settings.js';
import { productImageSources } from '../shared/product-image-delivery.js';
import { createAnalytics } from './analytics.js';
import { createPopupNotice } from './popup.js';
const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  moon: '<path d="M20.4 14.6A8.7 8.7 0 0 1 9.4 3.6a8.7 8.7 0 1 0 11 11Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/><path d="m20 2 .7 1.3L22 4l-1.3.7L20 6l-.7-1.3L18 4l1.3-.7Z"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
  compare: '<path d="M8 3v18M16 3v18M4 7h8m0 10h8M5 4 2 7l3 3m14 4 3 3-3 3"/>',
  tag: '<path d="M3 3h9l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1.5"/>',
  trend: '<path d="m3 17 6-6 4 4 8-10m-6 0h6v6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  laptop: '<rect x="4" y="3" width="16" height="13" rx="1.5"/><path d="m4 16-2 4h20l-2-4"/>',
  send: '<path d="m3 3 19 9-19 9 4-9-4-9Zm4 9h15"/>',
  book: '<path d="M12 5C7 2 3 4 3 4v16s5-2 9 1c4-3 9-1 9-1V4s-4-2-9 1Zm0 0v16"/>',
  cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3"/>',
  settings:
    '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="var(--paper)"/><circle cx="16" cy="12" r="2" fill="var(--paper)"/><circle cx="10" cy="18" r="2" fill="var(--paper)"/>',
  shield: '<path d="M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6Z"/><path d="m8 12 3 3 5-6"/>',
  edit: '<path d="m15 4 5 5M3 21l5-1L21 7l-5-5L3 15Z"/>',
  bookmark: '<path d="M6 3h12v19l-6-4-6 4Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
};
function icon(name, extra = '') {
  return `<svg class="icon ${extra}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
}
function photo(id, width = 900) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
}
const photos = {
  laptop: photo('photo-1517336714731-489689fd1ca8', 1400),
  phone: photo('photo-1511707171634-5f897ff02aa9'),
  desk: photo('photo-1496181133206-80ce9b88a853'),
  gaming: photo('photo-1593305841991-05c297ba4575'),
  pc: photo('photo-1587202372634-32705e3bf49c'),
  ai: photo('photo-1555066931-4365d14bab8c'),
  headphones: photo('photo-1505740420928-5e560c06d30e'),
};
let articles = [];
let products = [];
const productDetails = new Map();
let selected = [];
let siteSettings = { ...DEFAULT_BRAND_SETTINGS };
let catalogState = { query: '', type: 'All', brand: 'All', budget: 'all', sort: 'featured' };
let catalogVisibleLimit = 50;
let showDifferences = false;
let aiMessages = [];
let aiBusy = false;
let aiDraft = '';
let floatingChatOpen = false;
let newsFilter = 'All';
let searchOpen = false;
let searchReturnFocus = null;
let toastTimer;
const nav = [
  ['Home', '/'],
  ['News', '/news'],
  ['Smartphones', '/smartphones'],
  ['Laptops', '/laptops'],
  ['Tablets', '/tablets'],
  ['PC & Gaming', '/gaming'],
  ['Reviews', '/reviews'],
  ['Buying Guides', '/guides'],
  ['Compare', '/compare'],
];
const sitemapSections = [
  ['Explore', [
    ['Home', '/'],
    ['Technology News', '/news'],
    ['Gadget Reviews', '/reviews'],
    ['Buying Guides', '/guides'],
    ['PC & Gaming', '/gaming'],
  ]],
  ['Find your next gadget', [
    ['Smartphones', '/smartphones'],
    ['Laptops', '/laptops'],
    ['Tablets', '/tablets'],
    ['Products', '/products'],
    ['Prices in Nepal', '/prices'],
    ['Compare Products', '/compare'],
  ]],
  ['Tekkatha', [
    ['Tekkatha AI', '/ai'],
    ['About Us', '/about'],
    ['Contact', '/contact'],
    ['Advertise', '/contact?topic=advertise'],
    ['Editorial Policy', '/editorial-policy'],
    ['Privacy Policy', '/privacy'],
    ['Terms & Conditions', '/terms'],
    ['Sitemap', '/sitemap_index.xml'],
  ]],
];
function siteSitemapSections() {
  return sitemapSections.map(([heading, links]) => [
    heading === 'Tekkatha' ? siteSettings.siteName : heading,
    links.map(([label, url]) => [label === 'Tekkatha AI' ? siteSettings.aiName : label, url]),
  ]);
}
const money = (amount) => formatNpr(amount);
const vercelImageOptimization = import.meta.env.VITE_VERCEL_DEPLOY === 'true';
function productImageAttributes(image, widths, sizes) {
  const sources = productImageSources(image, widths, vercelImageOptimization);
  return `src="${esc(sources.src)}"${sources.srcSet ? ` srcset="${esc(sources.srcSet)}" sizes="${esc(sizes)}"` : ''}`;
}
function brand() {
  return `<a href="/" class="brand" aria-label="${esc(siteSettings.siteName)} home"><img src="${esc(siteSettings.logoImage || '/assets/mark.svg')}" alt="" width="37" height="37"><span class="brand-text">${esc(siteSettings.siteName)}<b>.</b></span></a>`;
}
function header() {
  const route = location.pathname;
  const dark = document.documentElement.dataset.theme === 'dark';
  return `<header><div class="topbar"><div class="container"><div class="top-meta"><span>${esc(siteSettings.tagline)}</span><span><span class="flag" aria-hidden="true">🇳🇵</span> Nepal & beyond</span></div><div class="top-links"><a href="/about">About ${esc(siteSettings.siteName)}</a><a href="/contact">Contact</a><a href="/contact?topic=advertise">Advertise</a></div></div></div><div class="container header-main"><div style="display:flex;align-items:center">${brand()}<span class="tagline">${esc(siteSettings.headerTagline)}</span></div><div class="header-actions"><button class="header-search" data-action="search" aria-label="Search ${esc(siteSettings.siteName)}">${icon('search')}<span>Search ${esc(siteSettings.siteName)}</span><kbd>/</kbd></button><button class="icon-btn" data-action="theme" aria-label="${dark ? 'Switch to light theme' : 'Switch to dark theme'}" title="${dark ? 'Light theme' : 'Dark theme'}">${icon(dark ? 'sun' : 'moon')}</button><a class="btn" href="/ai" aria-label="Ask ${esc(siteSettings.aiName)}">${icon('spark')}<span>Ask ${esc(siteSettings.aiName)}</span></a></div></div><div class="nav-wrap"><div class="container nav"><nav class="nav-links" aria-label="Main navigation">${nav.map(([name, url]) => `<a href="${url}" ${route === url ? 'class="active" aria-current="page"' : ''}>${name}</a>`).join('')}</nav><a href="/prices" class="nav-prices">${icon('tag')} Prices in Nepal</a></div></div></header>`;
}
function footer() {
  return `<footer class="footer"><div class="container"><div class="footer-main"><div class="footer-brand">${brand()}<p>${esc(siteSettings.footerDescription)}</p></div><nav class="footer-links" aria-label="Footer navigation">${siteSitemapSections().map(([heading, links]) => `<div><h4>${esc(heading)}</h4>${links.map(([label, url]) => `<a href="${esc(url)}">${esc(label)}</a>`).join('')}</div>`).join('')}</nav></div><div class="footer-bottom"><span>© ${esc(siteSettings.siteName)}. All rights reserved.</span><span>${icon('globe')} Built around better tech decisions.</span></div></div></footer>`;
}
function meta(a, full = false) {
  const publishedAt = !a.isSample && (a.publishedAt || a.createdAt);
  const publishedDate = publishedAt ? new Date(publishedAt) : null;
  const published = full && publishedDate && !Number.isNaN(publishedDate.getTime())
    ? `<span class="dot">·</span><time datetime="${esc(publishedDate.toISOString())}">${esc(publishedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))}</time>`
    : '';
  return `<div class="meta">${full ? '<span class="avatar" aria-hidden="true">TK</span>' : ''}<span>${esc(full ? a.author : a.isSample ? 'Editorial preview' : a.author)}</span><span class="dot">·</span><span>${a.read} min read</span>${published}</div>`;
}
function story(a) {
  return `<article class="story-card"><a href="/article/${a.id}"><div class="story-cover"><img src="${esc(a.image)}" alt="${esc(a.category)} editorial illustration" loading="lazy"></div><span class="eyebrow">${esc(a.category)}</span><h3>${esc(a.title)}</h3></a><p class="excerpt">${esc(a.excerpt)}</p>${meta(a)}</article>`;
}
function product(p) {
  const variantCount = 1 + (p.variants?.length || 0);
  const priceTag = p.priceStatus === 'verified'
    ? 'Source recorded'
    : p.priceStatus === 'sample'
      ? 'Sample price'
      : p.priceCheckedAt
        ? `Listing snapshot · ${new Date(p.priceCheckedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : 'Unverified price';
  return `<article class="product-card"><a href="/product/${p.id}" aria-label="View ${esc(p.brand)} ${esc(p.name)}"><div class="product-visual"><span class="product-tag">${priceTag}${variantCount > 1 ? ` · ${variantCount} variants` : ''}</span><img ${productImageAttributes(p.image, [320, 640], '(max-width: 700px) 45vw, 280px')} alt="Photo of ${esc(p.brand)} ${esc(p.name)}" loading="lazy" decoding="async"></div></a><div class="product-info"><p class="product-brand">${esc(p.brand)}</p><a href="/product/${p.id}"><h3>${esc(p.name)}</h3></a><p class="product-variant">${esc(p.variant)}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="compare-add ${selected.includes(p.id) ? 'selected' : ''}" data-compare="${p.id}" aria-label="${selected.includes(p.id) ? 'Remove' : 'Add'} ${esc(p.name)} ${selected.includes(p.id) ? 'from' : 'to'} comparison">${icon(selected.includes(p.id) ? 'check' : 'plus')} Compare</button></div></div></article>`;
}
function title(name, link, label = 'View all') {
  return `<div class="section-title"><h2>${name}</h2>${link ? `<a class="text-link" href="${link}">${label} ${icon('arrow')}</a>` : ''}</div>`;
}
function homepage() {
  if (!articles.length)
    return `<div class="container page-content">${pageHead(siteSettings.homepageTitle, siteSettings.homepageSubtitle)}<div class="empty-state"><h3>The next story is on its way.</h3><a class="btn" href="/products">Explore products</a></div></div>`;
  const recommendedArticles = articles.length > 6 ? articles.slice(6, 9) : articles.slice(1, 4);
  return `<div class="container"><div class="trending"><span class="trending-label">${icon('trend')} TRENDING</span><div class="trend-items">${articles
    .slice(0, 4)
    .map(
      (a) =>
        `<a href="/article/${a.id}">${esc(a.title.length > 38 ? a.title.slice(0, 35) + '…' : a.title)}</a>`,
    )
    .join(
      '',
    )}<a href="/prices">Gadget prices in Nepal</a></div></div><div class="intro"><h1>${esc(siteSettings.homepageTitle)}</h1><p>${esc(siteSettings.homepageSubtitle)}</p></div><section class="hero-grid" aria-label="Featured stories"><a href="/article/${articles[0].id}" class="hero-main"><img src="${esc(articles[0].image)}" alt="Featured technology story" fetchpriority="high"><div class="hero-shade"></div><div class="hero-content"><span class="badge">THE BIG READ</span><h2>${esc(articles[0].title)}</h2><p>${esc(articles[0].excerpt)}</p>${meta(articles[0], true)}</div></a><div class="hero-side">${articles
    .slice(1, 3)
    .map(
      (a) =>
        `<a href="/article/${a.id}" class="side-story"><img class="story-image" src="${esc(a.image)}" alt="${esc(a.category)} editorial illustration"><div class="side-copy"><span class="eyebrow">${esc(a.category)}</span><h2>${esc(a.title)}</h2>${meta(a)}</div></a>`,
    )
    .join(
      '',
    )}</div></section><section class="quick-links" aria-label="Find your next gadget"><a href="/prices" class="quick-link"><span class="quick-icon">${icon('tag')}</span><div><h3>Gadget prices in Nepal</h3><p>Your next upgrade starts here.</p></div>${icon('arrow')}</a><a href="/compare" class="quick-link"><span class="quick-icon">${icon('compare')}</span><div><h3>Compare side by side</h3><p>Small details. Better decisions.</p></div>${icon('arrow')}</a><a href="/guides" class="quick-link"><span class="quick-icon">${icon('book')}</span><div><h3>Find your perfect fit</h3><p>Practical guides for every budget.</p></div>${icon('arrow')}</a></section><section class="news-layout"><div>${title('On the radar', '/news', 'All stories')}<div class="news-filters" role="group" aria-label="Filter stories">${['All', 'Smartphones', 'Laptops', 'AI', 'Gaming'].map((x) => `<button class="filter ${newsFilter === x ? 'active' : ''}" data-news-filter="${esc(x)}">${x === 'All' ? 'All stories' : x}</button>`).join('')}</div><div class="story-grid" id="home-stories">${homeStories()}</div></div><aside class="news-sidebar"><div><h2 class="sidebar-title">Recommended reads</h2><div class="popular-list">${articles
    .filter((article) => recommendedArticles.includes(article))
    .map(
      (a) =>
        `<a href="/article/${a.id}" class="popular-item"><div><span class="eyebrow">${esc(a.category)}</span><h3>${esc(a.title)}</h3></div></a>`,
    )
    .join(
      '',
    )}</div></div><div class="ai-mini">${icon('spark', 'ai-symbol')}<h3>A little help. A smarter choice.</h3><p>Ask Tekkatha AI about specs, comparisons, and your next gadget.</p><a href="/ai" class="btn">Ask Tekkatha AI ${icon('arrow')}</a></div></aside></section></div><section class="price-section"><div class="container">${title('Meet your next upgrade', '/prices', 'Explore prices')}<p class="section-subtitle">Explore the product database. Check the verification label on every price.</p><div class="product-grid">${products.slice(0, 12).map(product).join('')}</div></div></section><section class="container guide-section">${title('Buy better. Know more.', '/guides', 'All buying guides')}<div class="guide-grid">${articles
    .filter((a) => a.kind === 'Guide')
    .slice(0, 3)
    .map(
      (a) =>
        `<a href="/article/${a.id}" class="guide-card"><img src="${esc(a.image)}" alt="${esc(a.category)} editorial illustration" loading="lazy"><div class="guide-copy"><span class="eyebrow">Buying Guide</span><h3>${esc(a.title)}</h3><span class="text-link">Read the guide ${icon('arrow')}</span></div></a>`,
    )
    .join('')}</div></section>`;
}
function homeStories() {
  const list =
    newsFilter === 'All' ? articles.slice(3, 6) : articles.filter((a) => a.category === newsFilter);
  return list.map(story).join('') || '<p>No stories in this category yet.</p>';
}
function tray() {
  return selected.length && !['/compare', '/hello'].includes(location.pathname)
    ? `<div class="compare-tray"><span>${selected.length} product${selected.length === 1 ? '' : 's'} selected</span><a class="btn" href="/compare">Compare ${icon('arrow')}</a><button class="clear" data-action="clear-compare" aria-label="Clear comparison">${icon('close')}</button></div>`
    : '';
}
function shell(content) {
  const html = (header() + `<main id="main" tabindex="-1">${content}</main>` + footer() + tray())
    .replaceAll('Product Database', 'Products')
    .replaceAll('product database', 'product catalog')
    .replaceAll('Product illustration', 'Device photo')
    .replaceAll('Illustration of ', 'Photo of ');
  const deliveredHtml = vercelImageOptimization
    ? html.replace(/<img\b([^>]*?)\bsrc="(https:\/\/[^"]+)"([^>]*)>/g, (tag, before, source, after) => {
        const { src, srcSet } = productImageSources(source, [320, 640, 960], true);
        if (!srcSet) return tag;
        return `<img${before}src="${esc(src)}" srcset="${esc(srcSet)}" sizes="(max-width: 700px) 45vw, 320px"${after}>`;
      })
    : html;
  $('#app').innerHTML = deliveredHtml;
  mountFloatingChat();
  adDisplay.mount();
}
function render() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  let content;
  let pageTitle = '';
  let pageDescription = siteSettings.description;
  let socialImage = '/assets/social-preview.png';
  let socialImageAlt = `${siteSettings.siteName} technology coverage`;
  let socialType = 'website';
  if (path === '/') content = homepage();
  else if (['/products', '/prices', '/smartphones', '/laptops', '/tablets'].includes(path)) {
    content = catalogPage(path);
    pageTitle =
      path === '/prices'
        ? 'Gadget Prices in Nepal'
        : path === '/smartphones'
          ? 'Smartphones'
          : path === '/laptops'
            ? 'Laptops'
            : path === '/tablets'
              ? 'Tablets'
            : 'Products';
  } else if (['/news', '/reviews', '/guides', '/gaming'].includes(path)) {
    content = editorialPage(path);
    pageTitle =
      path === '/news'
        ? 'News & Explainers'
        : path === '/reviews'
          ? 'Reviews'
          : path === '/guides'
            ? 'Buying Guides'
            : 'PC & Gaming';
  } else if (path.startsWith('/product/')) {
    const id = path.split('/')[2];
    const p = productDetails.get(id)?.product || products.find((p) => p.id === id);
    if (p) loadProductDetails(id);
    content = p ? productPage(p) : notFound();
    pageTitle = p ? `${p.brand} ${p.name}` : 'Page not found';
    if (p)
      pageDescription =
        p.note ||
        `${p.brand} ${p.name}: specifications, price records in Nepal, and product comparisons on ${siteSettings.siteName}.`;
    if (p) {
      socialImage = p.image;
      socialImageAlt = `${p.brand} ${p.name}`;
    }
  } else if (path.startsWith('/article/')) {
    const a = articles.find((a) => a.id === path.split('/')[2]);
    if (a) loadArticleProductDetails(a);
    content = a ? articlePage(a) : notFound();
    pageTitle = a?.title || 'Page not found';
    if (a?.excerpt) pageDescription = a.excerpt;
    if (a) {
      socialImage = a.image;
      socialImageAlt = `${a.category} editorial illustration`;
      socialType = 'article';
    }
  } else if (path === '/compare') {
    content = comparePage();
    pageTitle = 'Compare Products';
  } else if (path === '/ai') {
    content = aiPage();
    pageTitle = siteSettings.aiName;
  } else if (path === '/sitemap') {
    content = sitemapPage();
    pageTitle = 'Sitemap';
    pageDescription = 'Browse all Tekkatha sections, published articles, and products.';
  } else if (path === '/hello') {
    location.replace(
      import.meta.env.VITE_ADMIN_URL || 'http://' + location.hostname + ':5174/hello',
    );
    return;
  } else if (['/about', '/contact', '/editorial-policy', '/privacy', '/terms'].includes(path)) {
    content = infoPage(path);
    pageTitle =
      path === '/about'
        ? 'About Tekkatha'
        : path === '/contact'
          ? 'Contact Tekkatha'
          : path === '/privacy'
            ? 'Privacy Policy'
            : path === '/terms'
              ? 'Terms & Conditions'
              : 'Editorial Policy';
    pageDescription =
      path === '/privacy'
        ? `How ${siteSettings.siteName} handles analytics, browser storage, and visitor privacy.`
        : path === '/terms'
          ? `The terms that apply when using ${siteSettings.siteName}.`
          : pageDescription;
  } else {
    content = notFound();
    pageTitle = 'Page not found';
  }
  document.title = pageTitle
    ? (siteSettings.pageTitleSuffix ? `${pageTitle} — ${siteSettings.pageTitleSuffix}` : pageTitle)
    : `${siteSettings.siteName} — ${siteSettings.homepageMetaTitle}`;
  shell(content);
  analytics.setPage(path);
  if (path === '/ai') bindAi();
  if (['/products', '/prices', '/smartphones', '/laptops', '/tablets'].includes(path)) bindCatalog(path);
  if (path === '/compare') bindCompare();
  if (path.startsWith('/product/')) {
    $('#retry-product-details')?.addEventListener('click', () => {
      productDetails.delete(path.split('/')[2]);
      render();
    });
  }
  footerSeo.update({
    settings: siteSettings,
    url: location.href,
    title: document.title,
    description: pageDescription,
    image: socialImage,
    imageAlt: socialImageAlt,
    type: socialType,
    article: path.startsWith('/article/') ? articles.find((article) => article.id === path.split('/')[2]) : null,
    product: path.startsWith('/product/')
      ? productDetails.get(path.split('/')[2])?.product || products.find((item) => item.id === path.split('/')[2])
      : null,
  });
}
function navigate(path) {
  history.pushState({}, '', path);
  render();
  if (!scrollToCurrentHash()) window.scrollTo({ top: 0, behavior: 'instant' });
}
function scrollToCurrentHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return false;
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
  return true;
}
function toast(message) {
  const t = $('#toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}
function toggleCompare(id) {
  const p = products.find((p) => p.id === id);
  if (!p) return;
  if (selected.includes(id)) selected = selected.filter((x) => x !== id);
  else {
    if (selected.length === 3) {
      toast('Compare up to 3 products at a time.');
      return;
    }
    if (selected.length && products.find((p) => p.id === selected[0]).type !== p.type) {
      toast('Choose products from the same category to compare.');
      return;
    }
    selected.push(id);
  }
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
}
function setTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  if (dark) delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = 'dark';
  try {
    localStorage.setItem('tekkatha-theme', dark ? 'light' : 'dark');
  } catch {}
  const b = $('[data-action="theme"]');
  if (b) {
    b.innerHTML = icon(dark ? 'moon' : 'sun');
    b.setAttribute('aria-label', dark ? 'Switch to dark theme' : 'Switch to light theme');
    b.title = dark ? 'Dark theme' : 'Light theme';
  }
}
document.addEventListener('click', (e) => {
  const compare = e.target.closest('[data-compare]');
  if (compare) {
    toggleCompare(compare.dataset.compare);
    return;
  }
  const filter = e.target.closest('[data-news-filter]');
  if (filter) {
    newsFilter = filter.dataset.newsFilter;
    document
      .querySelectorAll('[data-news-filter]')
      .forEach((b) => b.classList.toggle('active', b.dataset.newsFilter === newsFilter));
    $('#home-stories').innerHTML = homeStories();
    return;
  }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'theme') {
    setTheme();
    return;
  }
  if (action === 'clear-compare') {
    selected = [];
    render();
    return;
  }
  if (action === 'search') {
    openSearch();
    return;
  }
  if (action === 'close-search') {
    closeSearch();
    return;
  }
  const a = e.target.closest('a');
  if (
    a &&
    a.getAttribute('href')?.startsWith('/') &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    e.button === 0
  ) {
    e.preventDefault();
    if (searchOpen) closeSearch();
    if (action === 'full-chat') setFloatingChat(false, false);
    navigate(a.getAttribute('href'));
  }
});
function openSearch() {
  if (searchOpen) return;
  if (floatingChatOpen) setFloatingChat(false);
  searchOpen = true;
  searchReturnFocus = document.activeElement;
  document.body.style.overflow = 'hidden';
  const div = document.createElement('div');
  div.className = 'search-panel';
  div.id = 'search-panel';
  div.innerHTML = `<div class="search-dialog" role="dialog" aria-modal="true" aria-label="Search Tekkatha"><div class="search-box">${icon('search')}<input id="global-search" type="search" placeholder="Search stories, products, guides..." aria-label="Search stories and products"><button data-action="close-search" aria-label="Close search">Esc</button></div><div class="search-results" id="search-results"></div><div class="search-hint">Find a story, explore a product, or compare your options.</div></div>`;
  document.body.append(div);
  div.addEventListener('click', (e) => {
    if (e.target === div) closeSearch();
  });
  $('#global-search').addEventListener('input', (e) => searchResults(e.target.value));
  searchResults('');
  $('#global-search').focus();
}
function searchResults(query) {
  const q = query.trim().toLowerCase();
  const ps = products.filter((p) =>
    `${esc(p.brand)} ${esc(p.name)} ${esc(p.type)} ${esc(p.variant)} ${(p.variants || []).map((variant) => esc(variant.label)).join(' ')}`.toLowerCase().includes(q),
  );
  const as = articles.filter((a) =>
    `${esc(a.title)} ${esc(a.category)} ${esc(a.excerpt)}`.toLowerCase().includes(q),
  );
  $('#search-results').innerHTML =
    ps
      .map(
        (p) =>
          `<a href="/product/${p.id}" class="search-result"><img src="${esc(p.image)}" alt=""><div><h3>${esc(p.brand)} ${esc(p.name)}</h3><p>Product · ${esc(p.type)}</p></div></a>`,
      )
      .join('') +
      as
        .slice(0, 5)
        .map(
          (a) =>
            `<a href="/article/${a.id}" class="search-result"><img src="${esc(a.image)}" alt=""><div><h3>${esc(a.title)}</h3><p>${esc(a.category)} · ${a.read} min read</p></div></a>`,
        )
        .join('') ||
    '<div class="empty-state"><h3>No matches found</h3><p>Try a brand, product name or topic.</p></div>';
}
function closeSearch() {
  searchOpen = false;
  $('#search-panel')?.remove();
  document.body.style.overflow = '';
  searchReturnFocus?.focus();
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (searchOpen) closeSearch();
    else if (floatingChatOpen) setFloatingChat(false);
  }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Tab' && searchOpen) {
    const focusables = [...$('#search-panel').querySelectorAll('button,input,a[href]')];
    const first = focusables[0],
      last = focusables.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
window.addEventListener('popstate', () => {
  closeSearch();
  render();
  scrollToCurrentHash();
});
function pageHead(name, description, crumb = '') {
  name = esc(name);
  description = esc(description);
  crumb = esc(crumb);
  return `<div class="page-head"><div class="breadcrumb"><a href="/">Home</a><span>/</span><span>${crumb || name}</span></div><h1>${name}</h1><p>${description}</p></div>`;
}
function sitemapPage() {
  const articleLinks = articles
    .map((article) => [article.title, `/article/${encodeURIComponent(article.id)}`])
    .sort(([a], [b]) => a.localeCompare(b));
  const productLinks = products
    .map((product) => [
      `${product.brand} ${product.name}${product.variant ? ` — ${product.variant}` : ''}`,
      `/product/${encodeURIComponent(product.id)}`,
    ])
    .sort(([a], [b]) => a.localeCompare(b));
  const sections = [...siteSitemapSections(), ['Articles', articleLinks], ['Products', productLinks]];
  return `<div class="container sitemap-page">${pageHead('Sitemap', 'Browse every section, published article, and product on Tekkatha.')}<p class="sitemap-xml-link">Looking for the search engine version? <a href="/sitemap_index.xml">View the XML sitemap index</a>.</p><nav class="sitemap-grid" aria-label="All site pages">${sections.filter(([, links]) => links.length).map(([heading, links]) => `<section class="sitemap-group"><h2>${esc(heading)}</h2><ul>${links.map(([label, url]) => `<li><a href="${esc(url)}">${esc(label)}</a></li>`).join('')}</ul></section>`).join('')}</nav></div>`;
}
function catalogType(path) {
  return path === '/smartphones'
    ? 'Smartphones'
    : path === '/laptops'
      ? 'Laptops'
      : path === '/tablets'
        ? 'Tablets'
      : catalogState.type;
}
function filteredProducts(path) {
  const type = catalogType(path);
  let list = products.filter(
    (p) =>
      (type === 'All' || p.type === type) &&
      (catalogState.brand === 'All' || p.brand === catalogState.brand) &&
      `${esc(p.brand)} ${esc(p.name)} ${esc(p.processor)} ${esc(p.display)}`
        .toLowerCase()
        .includes(catalogState.query.toLowerCase()) &&
      (catalogState.budget === 'all' || p.price <= Number(catalogState.budget)),
  );
  if (catalogState.sort === 'low') list.sort((a, b) => a.price - b.price);
  if (catalogState.sort === 'high') list.sort((a, b) => b.price - a.price);
  if (catalogState.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}
function catalogPage(path) {
  const name =
    path === '/prices'
      ? 'Gadget prices in Nepal'
      : path === '/smartphones'
        ? 'Smartphones'
        : path === '/laptops'
          ? 'Laptops'
          : path === '/tablets'
            ? 'Tablets'
        : 'The product catalog';
  const type = catalogType(path);
  const results = filteredProducts(path);
  return `<div class="container">${pageHead(name, 'Less searching. More understanding. Explore specifications and find the right fit for your budget.')}<div class="catalog-banner">${icon('shield')}<p><strong>Know the price context.</strong> Every record has a price label. Confirm current retailer pricing, availability and warranty before buying.</p></div><div class="catalog-toolbar"><label class="catalog-search">${icon('search')}<input type="search" id="catalog-query" placeholder="Search a product or specification" aria-label="Search products" value="${esc(catalogState.query)}"></label>${!['/smartphones', '/laptops', '/tablets'].includes(path) ? `<label class="select-label"><span>Category</span><select id="catalog-type"><option value="All">All categories</option>${[...new Set(products.map((p) => p.type))].map((x) => `<option ${type === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>` : ''}<label class="select-label"><span>Brand</span><select id="catalog-brand"><option value="All">All brands</option>${[...new Set(products.map((p) => p.brand))].map((x) => `<option ${catalogState.brand === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label><label class="select-label"><span>Budget</span><select id="catalog-budget">${[
    ['all', 'Any budget'],
    ['50000', 'Under Rs. 50,000'],
    ['100000', 'Under Rs. 1,00,000'],
    ['150000', 'Under Rs. 1,50,000'],
  ]
    .map(
      ([v, t]) =>
        `<option value="${v}" ${catalogState.budget === v ? 'selected' : ''}>${t}</option>`,
    )
    .join(
      '',
    )}</select></label></div><div class="results-bar"><p id="result-count">${Math.min(results.length, catalogVisibleLimit)} of ${results.length} products</p><label>Sort by <select id="catalog-sort" aria-label="Sort products">${[
    ['featured', 'Featured'],
    ['low', 'Price: low to high'],
    ['high', 'Price: high to low'],
    ['name', 'Name'],
  ]
    .map(
      ([v, t]) => `<option value="${v}" ${catalogState.sort === v ? 'selected' : ''}>${t}</option>`,
    )
    .join(
      '',
    )}</select></label></div><div class="page-content"><div class="product-grid catalog-grid" id="catalog-results">${results.slice(0, catalogVisibleLimit).map(product).join('') || catalogEmpty()}</div><div class="catalog-pagination"><button class="btn btn-outline" id="catalog-load-more" type="button" ${results.length <= catalogVisibleLimit ? 'hidden' : ''}>Load next 50</button></div>${
    type !== 'All'
      ? `<section class="category-stories">${title(`Know your ${type.toLowerCase()}`)}<div class="story-grid full-grid">${articles
          .filter((a) => a.category === type)
          .map(story)
          .join('')}</div></section>`
      : ''
  }</div></div>`;
}
function catalogEmpty() {
  return `<div class="empty-state span-all">${icon('search')}<h3>No products match these filters</h3><p>Try a different brand, a higher budget, or a broader search.</p><button class="btn btn-outline" data-action="reset-catalog">Reset filters</button></div>`;
}
function bindCatalog(path) {
  $('#catalog-query').addEventListener('input', (e) => {
    catalogState.query = e.target.value;
    refreshCatalog(path);
  });
  for (const key of ['type', 'brand', 'budget', 'sort'])
    $('#catalog-' + key)?.addEventListener('change', (e) => {
      catalogState[key] = e.target.value;
      refreshCatalog(path);
    });
  $('#catalog-load-more')?.addEventListener('click', () => {
    catalogVisibleLimit += 50;
    refreshCatalog(path, true);
  });
}
function refreshCatalog(path, keepLimit = false) {
  if (!keepLimit) catalogVisibleLimit = 50;
  const results = filteredProducts(path);
  $('#catalog-results').innerHTML = results.slice(0, catalogVisibleLimit).map(product).join('') || catalogEmpty();
  $('#result-count').textContent = `${Math.min(results.length, catalogVisibleLimit)} of ${results.length} products`;
  $('#catalog-load-more').hidden = results.length <= catalogVisibleLimit;
}
function editorialPage(path) {
  const config = {
    '/news': [
      'News & explainers',
      'A clearer view of technology, from the hardware in your hands to the ideas shaping what comes next.',
      articles,
    ],
    '/reviews': [
      'Gadget reviews',
      'The details behind the decision. Explore our review checklists and product overviews.',
      articles.filter((a) => ['Reviews', 'Laptops', 'Smartphones'].includes(a.category)),
    ],
    '/guides': [
      'Buying guides',
      'Know what matters before you buy. Practical advice for your next phone, laptop, monitor or PC.',
      articles.filter((a) => a.kind === 'Guide'),
    ],
    '/gaming': [
      'PC & gaming',
      'Build with confidence. Understand your hardware, your display and the details that make a difference.',
      articles.filter((a) => ['PC Components', 'Gaming', 'PC Builds'].includes(a.category)),
    ],
  };
  const [name, description, list] = config[path];
  return `<div class="container">${pageHead(name, description)}${list.some((a) => a.isSample) ? '<div class="editorial-notice"><span class="pill">Editorial samples</span><span>Sample articles are labeled individually.</span></div>' : ''}<div class="page-content"><div class="story-grid editorial-grid">${list.map(story).join('')}</div>${path === '/gaming' ? `<div class="build-callout"><span class="quick-icon">${icon('cpu')}</span><div><h2>Your first PC build, explained.</h2><p>Start with your use case. Check compatibility. Leave room in your budget for the essentials.</p></div><a class="btn" href="/guides">Plan your build ${icon('arrow')}</a></div>` : ''}</div></div>`;
}
function priceLabel(p) {
  return p.priceStatus === 'sample'
    ? 'Illustrative price in Nepal'
    : p.priceStatus === 'verified'
      ? 'Retailer source recorded'
      : p.priceCheckedAt
        ? `Listing snapshot checked ${new Date(p.priceCheckedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : 'Unverified Nepal price';
}
async function loadProductDetails(id) {
  if (productDetails.has(id)) return;
  productDetails.set(id, { status: 'loading' });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const product = await api('/products/' + encodeURIComponent(id), { signal: controller.signal });
    productDetails.set(id, { status: 'ready', product });
  } catch {
    productDetails.set(id, { status: 'error' });
  } finally {
    clearTimeout(timeout);
  }
  // A response for another device must not replace the page the reader opened.
  if (location.pathname.replace(/\/$/, '') === '/product/' + id) {
    render();
    scrollToCurrentHash();
  }
}

function guideProductEntries(article) {
  if (Array.isArray(article.guideProducts) && article.guideProducts.length)
    return article.guideProducts;
  return (article.productIds || []).map((productId) => ({ productId, description: '' }));
}

async function loadArticleProductDetails(article) {
  const ids = guideProductEntries(article)
    .map((entry) => entry.productId)
    .filter((id) => !productDetails.has(id));
  if (!ids.length) return;
  await Promise.all(ids.map((id) => loadProductDetails(id)));
  if (location.pathname.replace(/\/$/, '') !== '/article/' + article.id) return;
  const y = window.scrollY;
  render();
  if (!scrollToCurrentHash()) window.scrollTo(0, y);
}

function hasProductReview(product) {
  return !!((product.reviewBlocks || []).length || product.review?.trim());
}

function detailedReviewMarkup(product) {
  if (!(product.reviewBlocks || []).length) return renderProductText(product.review || '');
  return `<div class="product-review-blocks">${product.reviewBlocks
    .map((block) => {
      if (block.type === 'image')
        return `<figure class="product-review-image"><img src="${esc(block.image)}" alt="${esc(block.alt)}" loading="lazy">${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ''}</figure>`;
      const copy = renderProductText(block.text || '');
      if (!copy) return '';
      return `<div class="product-review-text">${block.heading ? `<h3>${esc(block.heading)}</h3>` : ''}${copy}</div>`;
    })
    .join('')}</div>`;
}

function productLongContent(p) {
  const state = productDetails.get(p.id)?.status;
  if (state === 'loading')
    return '<div class="product-reading-status" role="status">Loading the full description and review…</div>';
  if (state === 'error')
    return '<div class="product-reading-status" role="status"><p>The full device details could not be loaded.</p><button id="retry-product-details" class="btn btn-outline" type="button">Try again</button></div>';
  const description = renderProductText(p.description || '');
  const review = detailedReviewMarkup(p);
  if (!description && !review) return '';
  return `<div class="product-reading"><nav class="product-reading-nav" aria-label="Device reading sections">${description ? '<a href="#product-description">Full description ' + icon('arrow') + '</a>' : ''}${review ? '<a href="#product-review">Read the detailed review ' + icon('arrow') + '</a>' : ''}</nav>${description ? '<section id="product-description" class="product-long-content"><span class="eyebrow">A closer look</span><h2>Full description</h2>' + description + '</section>' : ''}${review ? '<section id="product-review" class="product-long-content product-review-section"><span class="eyebrow">Beyond the specifications</span><h2>Detailed review</h2>' + review + '</section>' : ''}</div>`;
}

function productSpecRows(p) {
  const fields = {
    Smartphones: [
      ['Display', 'display', 'phone'], ['Processor', 'processor', 'cpu'],
      ['Memory', 'memory', 'cpu'], ['Storage', 'storage', 'settings'],
      ['Battery', 'battery', 'settings'], ['Camera', 'camera', 'phone'],
    ],
    Laptops: [
      ['Display', 'display', 'laptop'], ['Processor', 'processor', 'cpu'],
      ['Memory', 'memory', 'cpu'], ['Storage', 'storage', 'settings'],
      ['Graphics', 'camera', 'cpu'], ['Battery', 'battery', 'settings'],
    ],
    'PC Components': [
      ['Platform', 'display', 'cpu'], ['Component', 'processor', 'cpu'],
      ['Capacity', 'memory', 'settings'], ['Interface', 'storage', 'settings'],
      ['Details', 'battery', 'settings'], ['Form factor', 'camera', 'settings'],
    ],
    Gaming: [
      ['Display', 'display', 'laptop'], ['Refresh / response', 'processor', 'cpu'],
      ['Coverage / warranty', 'memory', 'settings'], ['Ports', 'storage', 'settings'],
    ],
    Accessories: [
      ['Product type', 'display', 'settings'], ['Key features', 'processor', 'cpu'],
      ['Size / output', 'memory', 'settings'], ['Connectivity', 'storage', 'settings'],
      ['Battery', 'battery', 'settings'],
    ],
  };
  return (fields[p.type] || fields.Smartphones)
    .filter(([, key]) => String(p[key] || '').trim())
    .map(([label, key, glyph]) => [label, key, p[key], glyph]);
}
function productPage(p) {
  const same = products.filter((x) => x.type === p.type && x.id !== p.id);
  const available = {
    unverified: 'Availability unverified',
    'in-stock': 'Listed as in stock',
    'out-of-stock': 'Listed as out of stock',
  };
  return `<div class="container">${pageHead(p.brand + ' ' + p.name, p.note, 'Product Database / ' + p.name)}<div class="page-content"><section class="product-detail"><div class="product-detail-image"><span class="pill">Device photo</span><img src="${esc(p.image)}" alt="Photo of ${esc(p.brand + ' ' + p.name)}" loading="lazy" decoding="async"></div><div class="product-detail-copy"><span class="eyebrow">${esc(p.type)}</span><h2>${esc(p.name)}</h2><p class="variant">${esc(p.variant)}</p><div class="detail-price">${money(p.price)}<span>${priceLabel(p)}</span></div><p class="price-disclaimer">${p.priceStatus === 'sample' ? 'This is a sample price, not a current retailer quote.' : 'Confirm the current price and exact configuration with the seller.'} ${available[p.availability] || available.unverified}.${p.priceCheckedAt ? ' Checked ' + esc(new Date(p.priceCheckedAt).toLocaleDateString('en-GB')) + '.' : ''}</p><div class="detail-actions">${p.priceSource ? '<a class="btn buy-now-btn" href="' + esc(p.priceSource) + '" target="_blank" rel="sponsored noopener noreferrer">Buy now ' + icon('arrow') + '</a>' : ''}<button class="btn" data-compare="${p.id}">${icon('compare')} ${selected.includes(p.id) ? 'Remove from comparison' : 'Add to comparison'}</button><a class="btn btn-outline" href="/ai?q=${encodeURIComponent('Tell me about ' + p.brand + ' ' + p.name)}">${icon('spark')} Ask Tekkatha AI</a></div>${p.source ? '<a class="manufacturer-link" href="' + esc(p.source) + '" target="_blank" rel="noopener noreferrer">Manufacturer specifications ' + icon('arrow') + '</a>' : ''}</div></section><section class="spec-section">${title('The details that matter')}<div class="spec-grid">${productSpecRows(p).map(([name, , value, glyph]) => '<div class="spec-item">' + icon(glyph) + '<div><span>' + name + '</span><strong>' + esc(value) + '</strong></div></div>').join('') || '<p class="muted">Product specifications will be added soon.</p>'}</div></section>${productLongContent(p)}<section class="product-related">${title('Explore similar products', '/products', 'View database')}<div class="product-grid">${same.map(product).join('')}</div>${!same.length ? '<p class="muted">More products will appear as the catalog expands.</p>' : ''}</section></div></div>`;
}
function productVariantMarkup(product) {
  const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const variants = products.filter(
    (item) =>
      item.id !== product.id &&
      item.type === product.type &&
      normalize(item.brand) === normalize(product.brand) &&
      normalize(item.name) === normalize(product.name),
  );
  if (!variants.length) return '';
  const options = [product, ...variants];
  return `<section class="product-variants"><div class="section-title"><h2>Available configurations</h2><span class="muted">${options.length} variants</span></div><p class="section-subtitle">Choose the exact memory, storage, or configuration before checking the price.</p><div class="variant-list">${options.map((item) => `<a class="variant-option ${item.id === product.id ? 'active' : ''}" href="/product/${encodeURIComponent(item.id)}" ${item.id === product.id ? 'aria-current="page"' : ''}><span><strong>${esc(item.variant || 'Base configuration')}</strong><small>${esc(item.brand)} ${esc(item.name)}</small></span><span class="variant-option-price">${money(item.price)}<small>${priceLabel(item)}</small></span></a>`).join('')}</div></section>`;
}
const productPageWithVariants = productPage;
function embeddedVariantOptions(product) {
  const options = [
    {
      key: 'base',
      label: product.variant || 'Base configuration',
      price: product.price,
      priceStatus: product.priceStatus,
      availability: product.availability,
      priceSource: product.priceSource,
      priceCheckedAt: product.priceCheckedAt,
    },
    ...(product.variants || []).map((variant, index) => ({ ...variant, key: String(index + 1) })),
  ];
  if (options.length < 2) return '';
  const selected = new URLSearchParams(location.search).get('variant') || 'base';
  return `<section class="embedded-variants"><div class="section-title"><h2>Choose a variant</h2><span class="muted">${options.length} options</span></div><div class="variant-list">${options.map((option) => `<a class="variant-option ${option.key === selected ? 'active' : ''}" href="/product/${encodeURIComponent(product.id)}?variant=${encodeURIComponent(option.key)}" ${option.key === selected ? 'aria-current="page"' : ''}><span><strong>${esc(option.label)}</strong><small>${option.key === 'base' ? 'Default configuration' : 'Additional configuration'}</small></span><span class="variant-option-price">${money(option.price)}<small>${priceLabel(option)}</small></span></a>`).join('')}</div></section>`;
}
productPage = (product) => {
  const options = [
    {
      key: 'base',
      variant: product.variant,
      price: product.price,
      priceStatus: product.priceStatus,
      availability: product.availability,
      priceSource: product.priceSource,
      priceCheckedAt: product.priceCheckedAt,
    },
    ...(product.variants || []).map((variant, index) => ({ ...variant, variant: variant.label, key: String(index + 1) })),
  ];
  const selected = new URLSearchParams(location.search).get('variant') || 'base';
  const chosen = options.find((option) => option.key === selected) || options[0];
  const display = { ...product, ...chosen };
  return productPageWithVariants(display).replace(
    '<section class="spec-section">',
    productVariantMarkup(product) + embeddedVariantOptions(product) + '<section class="spec-section">',
  );
};
function compareProducts() {
  return (
    selected.length
      ? selected
      : products
          .filter((p) => p.type === products[0]?.type)
          .slice(0, 2)
          .map((p) => p.id)
  )
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);
}
function comparePage() {
  if (!products.length)
    return `<div class="container page-content">${pageHead('Compare products', 'Published catalog products will appear here.')}<div class="empty-state"><h3>No products to compare yet.</h3></div></div>`;
  const ps = compareProducts();
  const type = ps[0]?.type || 'Smartphones';
  const eligible = products.filter((p) => p.type === type);
  const categories = [
    ['Smartphones', 'phone'],
    ['Laptops', 'laptop'],
    ['PC Components', 'cpu'],
    ['Gaming', 'compare'],
    ['Accessories', 'settings'],
  ];
  const allRows = [
    ['Brand', 'brand'],
    ['Category', 'type'],
    ...productSpecRows(ps[0]).map(([label, key]) => [label, key]),
    ['Nepal price', 'price'],
    ['Price label', 'priceStatus'],
    ['Availability', 'availability'],
  ];
  const rows = showDifferences
    ? allRows.filter(([label, key]) => new Set(ps.map((p) => p[key])).size > 1)
    : allRows;
  return `<div class="container">${pageHead('Compare. Understand. Decide.', 'Put up to three products side by side. Look beyond the headline specifications.', 'Compare Products')}<div class="compare-top"><div class="compare-category">${categories.map(([category, categoryIcon]) => `<button class="filter ${type === category ? 'active' : ''}" data-compare-category="${category}">${icon(categoryIcon)} ${category}</button>`).join('')}</div><label class="difference-control"><input type="checkbox" id="differences-only" ${showDifferences ? 'checked' : ''}> Show differences only</label></div><div class="compare-pickers">${[0, 1, 2].map((i) => `<div class="compare-picker"><label for="compare-${i}">Product ${i + 1}${i === 2 ? ' (optional)' : ''}</label><select id="compare-${i}" data-compare-slot="${i}"><option value="">Choose a product</option>${eligible.map((p) => `<option value="${p.id}" ${ps[i]?.id === p.id ? 'selected' : ''} ${ps.some((x, n) => n !== i && x.id === p.id) ? 'disabled' : ''}>${esc(p.brand)} ${esc(p.name)}</option>`).join('')}</select>${ps[i] ? `<img src="${esc(ps[i].image)}" alt="Illustration of ${esc(ps[i].name)}"><h2>${esc(ps[i].name)}</h2><span class="price">${money(ps[i].price)}</span><p>${priceLabel(ps[i])}</p>` : `<div class="picker-empty">${icon('plus')}<span>Add another perspective</span></div>`}</div>`).join('')}</div><div class="catalog-banner compare-notice">${icon('shield')}<p>Prices are dated research snapshots. Confirm current pricing, stock and local warranty before deciding.</p></div><div class="table-scroll page-content"><table class="compare-table"><caption class="sr-only">Product specification comparison</caption><thead><tr><th scope="col">Specifications</th>${ps.map((p) => `<th scope="col">${esc(p.brand)} ${esc(p.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label, key]) => `<tr><th scope="row">${label}</th>${ps.map((p) => `<td>${key === 'price' ? money(p[key]) : key === 'priceStatus' ? priceLabel(p) : esc(p[key])}</td>`).join('')}</tr>`).join('')}${!rows.length ? `<tr><td colspan="${ps.length + 1}">No differences to show. Add another product or display all specifications.</td></tr>` : ''}<tr><th scope="row">Manufacturer source</th>${ps.map((p) => `<td>${p.source ? `<a class="text-link" href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">Official specifications ${icon('arrow')}</a>` : 'Not listed'}</td>`).join('')}</tr></tbody></table></div></div>`;
}
function bindCompare() {
  if (!$('#differences-only')) return;
  $('#differences-only').addEventListener('change', (e) => {
    showDifferences = e.target.checked;
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  });
  document.querySelectorAll('[data-compare-slot]').forEach((el) =>
    el.addEventListener('change', (e) => {
      const current = compareProducts();
      const ids = current.map((p) => p.id);
      ids[Number(el.dataset.compareSlot)] = e.target.value;
      selected = ids.filter(Boolean);
      if (!selected.length)
        selected = products
          .filter((p) => p.type === current[0]?.type)
          .slice(0, 1)
          .map((p) => p.id);
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    }),
  );
}
let articleBody = {};
function articlePage(a) {
  const words = (value) => new Set(
    String(value || '').toLowerCase().match(/[a-z0-9]{4,}/g)?.filter((word) => ![
      'about', 'after', 'before', 'from', 'have', 'into', 'more', 'their', 'there', 'these', 'this', 'those', 'what', 'when', 'which', 'with', 'your',
    ].includes(word)) || [],
  );
  const currentTerms = words(`${a.title} ${a.excerpt} ${a.category}`);
  const categoryPath = {
    'Buying Guides': '/guides',
    Reviews: '/reviews',
    Smartphones: '/smartphones',
    Laptops: '/laptops',
    Tablets: '/tablets',
    Gaming: '/gaming',
    'PC Components': '/gaming',
    'PC Builds': '/gaming',
  }[a.category] || '/news';
  const related = articles
    .filter((candidate) => candidate.id !== a.id && !candidate.isSample)
    .map((candidate) => {
      const candidateTerms = words(`${candidate.title} ${candidate.excerpt} ${candidate.category}`);
      const overlap = [...currentTerms].filter((term) => candidateTerms.has(term)).length;
      return {
        article: candidate,
        score: overlap * 3 + (candidate.category === a.category ? 4 : 0) + (candidate.kind === a.kind ? 1 : 0),
      };
    })
    .filter(({ score }) => score > 1)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ article }) => article);
  const relatedArticles = related.length
    ? related
    : articles.filter((candidate) => candidate.id !== a.id && !candidate.isSample).slice(0, 3);
  return `<div class="container article-container"><div class="breadcrumb article-crumb"><a href="/">Home</a><span>/</span><a href="${categoryPath}">${esc(a.category)}</a></div><header class="article-head"><span class="eyebrow">${esc(a.category)} ${a.isSample ? '<span class="pill">Editorial preview</span>' : ''}</span><h1>${esc(a.title)}</h1><p>${esc(a.excerpt)}</p>${meta(a, true)}</header><img class="article-hero" src="${esc(a.image)}" alt="${esc(a.category)} editorial illustration"><div class="article-layout"><aside class="article-toc"><h2>In this article</h2>${articleBody[a.id].map(([h], i) => `<a href="#section-${i}">${esc(h)}</a>`).join('')}<a class="text-link" href="/ai">Ask Tekkatha AI ${icon('spark')}</a></aside><div class="article-body">${articleBody[a.id].map(([h, p], i) => `<section id="section-${i}"><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('')}${a.id === 'macbook-air-overview' ? `<div class="article-source">Specifications: <a href="https://support.apple.com/en-ie/122209" target="_blank" rel="noopener noreferrer">Apple’s official MacBook Air M4 technical specifications</a>.</div>` : ''}${a.isSample ? '<div class="article-note">Sample editorial article. Product prices and availability require verification before publication.</div>' : ''}</div></div><section class="guide-section">${title('Keep exploring', categoryPath, 'More stories')}<div class="story-grid full-grid">${relatedArticles.map(story).join('')}</div></section></div>`;
}
function articleProductsMarkup(article) {
  const selectedProducts = guideProductEntries(article)
    .map((entry, index) => {
      const summary = products.find((product) => product.id === entry.productId);
      const product = productDetails.get(entry.productId)?.product || summary;
      return product ? { entry, product, index } : null;
    })
    .filter(Boolean);
  if (!selectedProducts.length) return '';
  const reviewHref = (product) =>
    `/product/${encodeURIComponent(product.id)}${hasProductReview(product) ? '#product-review' : ''}`;
  const reviewLabel = (product) =>
    hasProductReview(product) ? 'Read our review' : 'View product details';
  const buyLink = (product, small = false) =>
    product.priceSource
      ? `<a class="guide-buy-link ${small ? 'small' : ''}" href="${esc(product.priceSource)}" target="_blank" rel="sponsored noopener noreferrer">Buy now ${icon('arrow')}</a>`
      : '';
  const deviceSections = selectedProducts
    .map(({ entry, product, index }) => {
      const description = renderProductText(entry.description || product.note || product.description || '');
      const specs = productSpecRows(product);
      const specsMarkup = specs.length
        ? specs.map(([label, , value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')
        : '<div><dt>Specifications</dt><dd>Confirm the exact local configuration.</dd></div>';
      return `<article class="buying-guide-device" id="guide-device-${esc(product.id)}"><header class="guide-device-head"><span class="guide-pick-number">${String(index + 1).padStart(2, '0')}</span><div><span class="eyebrow">${esc(product.type)}</span><h2><a href="${reviewHref(product)}">${esc(product.brand)} ${esc(product.name)}</a></h2><p>${esc(product.variant || 'Base configuration')}</p></div></header><div class="guide-device-layout"><a class="guide-device-image" href="${reviewHref(product)}"><img src="${esc(product.image)}" alt="${esc(product.brand + ' ' + product.name)}" loading="lazy"></a><div class="guide-device-content"><div class="guide-device-description">${description || '<p>See the product page for complete device details.</p>'}</div><dl class="guide-device-specs">${specsMarkup}</dl><div class="guide-device-footer"><div class="guide-device-price"><span>Price in Nepal</span><strong>${money(product.price)}</strong><small>${priceLabel(product)}</small></div><div class="guide-device-actions"><a class="guide-review-link" href="${reviewHref(product)}">${reviewLabel(product)} ${icon('arrow')}</a>${buyLink(product)}</div></div></div></div></article>`;
    })
    .join('');
  const specLabels = [...new Set(selectedProducts.flatMap(({ product }) => productSpecRows(product).map(([label]) => label)))];
  const tableRows = [
    ['Price in Nepal', (product) => `<strong class="guide-table-price">${money(product.price)}</strong><small>${priceLabel(product)}</small>`],
    ...specLabels.map((label) => [
      label,
      (product) => esc(productSpecRows(product).find(([rowLabel]) => rowLabel === label)?.[2] || 'Not listed'),
    ]),
  ];
  const comparison = `<section class="guide-device-comparison" id="guide-device-comparison"><div class="guide-comparison-head"><span class="eyebrow">Quick comparison</span><h2>Every device at a glance</h2><p>Open a device name for its specifications and editorial assessment. Prices are dated listing snapshots.</p></div><div class="guide-table-scroll"><table class="guide-comparison-table"><caption class="sr-only">Specifications and Nepal prices for every device in this buying guide</caption><thead><tr><th scope="col">Specification</th>${selectedProducts.map(({ product }) => `<th scope="col"><a href="${reviewHref(product)}">${esc(product.brand)} ${esc(product.name)}</a><small>${esc(product.variant || 'Base configuration')}</small></th>`).join('')}</tr></thead><tbody>${tableRows.map(([label, output]) => `<tr><th scope="row">${label}</th>${selectedProducts.map(({ product }) => `<td>${output(product)}</td>`).join('')}</tr>`).join('')}<tr class="guide-action-row"><th scope="row">Product details</th>${selectedProducts.map(({ product }) => `<td><div class="guide-table-actions"><a href="${reviewHref(product)}">${reviewLabel(product)}</a></div></td>`).join('')}</tr></tbody></table></div></section>`;
  return `<section class="article-products"><div class="section-title"><div><span class="eyebrow">The shortlist</span><h2>Devices in this buying guide</h2></div><span class="muted">${selectedProducts.length} included</span></div><div class="article-product-list">${deviceSections}</div>${comparison}</section>`;
}
const articlePageWithProducts = articlePage;
articlePage = (article) =>
  articlePageWithProducts(article).replace(
    '</div></div><section class="guide-section">',
    articleProductsMarkup(article) + '</div></div><section class="guide-section">',
  );
function aiPage() {
  return `<div class="container ai-container">${pageHead('Your next tech decision starts here.', 'Ask Tekkatha AI about products, specifications, prices, comparisons, reviews, and buying recommendations.', 'Tekkatha AI')}<section class="ai-workspace"><div class="ai-workspace-head"><span class="ai-name">${icon('spark')} ${esc(siteSettings.aiName)}</span><span class="pill">Secure AI</span><button class="text-link" data-action="new-chat">New conversation ${icon('plus')}</button></div><div class="ai-chat" id="ai-chat" aria-live="polite">${aiMessages.length ? renderMessages() : `<div class="ai-welcome"><div class="ai-welcome-icon">${icon('spark')}</div><h2>A little clarity goes a long way.</h2><p>Compare the details. Understand the specs.<br>Find a better starting point.</p><div class="ai-suggestions">${['Best phones under Rs. 50,000?', 'Compare Galaxy A56 and Nothing Phone (3a)', 'Show me phones with 120Hz AMOLED displays', 'What is the latest price of this product?'].map((q) => `<button data-question="${esc(q)}">${esc(q)} ${icon('arrow')}</button>`).join('')}</div></div>`}</div><form id="ai-form" class="ai-input-form"><label class="sr-only" for="ai-input">Ask Tekkatha AI</label><input id="ai-input" placeholder="Ask anything about gadgets..." autocomplete="off" maxlength="1000" required><button class="btn" aria-label="Send question">${icon('send')}</button></form></section><div class="ai-bottom"><span>${icon('shield')} Limited, protected product context</span><span>${icon('tag')} Nepal prices keep their verification labels</span></div></div>`;
}
function chatWelcome(compact = false) {
  const questions = compact
    ? [
        'Best phones under Rs. 50,000?',
        'Compare Galaxy A56 and Nothing Phone (3a)',
        'Show me phones with 120Hz AMOLED displays',
      ]
    : [
        'Best phones under Rs. 50,000?',
        'Compare Galaxy A56 and Nothing Phone (3a)',
        'Show me phones with 120Hz AMOLED displays',
        'What is the latest price of this product?',
      ];
  return `<div class="ai-welcome"><div class="ai-welcome-icon">${icon('spark')}</div><h2>${compact ? 'What can we help you find?' : 'A little clarity goes a long way.'}</h2><p>${compact ? 'Ask about products, specs, prices, and comparisons.' : 'Compare the details. Understand the specs.<br>Find a better starting point.'}</p><div class="ai-suggestions">${questions.map((q) => `<button type="button" data-question="${esc(q)}">${esc(q)} ${icon('arrow')}</button>`).join('')}</div></div>`;
}
function mountFloatingChat() {
  const root = $('#floating-chat-root');
  const isFullChatPage = (location.pathname.replace(/\/$/, '') || '/') === '/ai';
  root.classList.toggle('is-disabled', isFullChatPage);
  if (isFullChatPage && floatingChatOpen) setFloatingChat(false, false);
  if (!root.firstElementChild) {
    root.innerHTML = `<section id="floating-chat-panel" class="floating-chat-panel" role="dialog" aria-modal="false" aria-labelledby="floating-chat-title" hidden><div class="floating-chat-head"><span class="floating-chat-symbol">${icon('spark')}</span><div><h2 id="floating-chat-title">${esc(siteSettings.aiName)}</h2><span>Product assistant</span></div><button type="button" class="icon-btn" data-action="close-floating-chat" aria-label="Close chat">${icon('close')}</button></div><div class="floating-chat-tools"><a href="/ai" data-action="full-chat">Open full chat ${icon('arrow')}</a><button type="button" data-action="new-chat">New chat ${icon('plus')}</button></div><div id="floating-ai-chat" class="ai-chat" role="log" aria-live="polite" aria-label="Chat conversation"></div><form id="floating-ai-form" class="ai-input-form"><label class="sr-only" for="floating-ai-input">Ask Tekkatha AI</label><input id="floating-ai-input" placeholder="Ask about a product..." autocomplete="off" maxlength="1000" required><button class="btn" type="submit" aria-label="Send question">${icon('send')}</button></form></section><button id="floating-chat-launcher" class="floating-chat-launcher" type="button" data-action="toggle-floating-chat" aria-expanded="false" aria-controls="floating-chat-panel" aria-label="${esc(siteSettings.aiName)}" title="${esc(siteSettings.aiName)}">${icon('spark')}<span>${esc(siteSettings.aiName)}</span></button>`;
    $('#floating-ai-form').addEventListener('submit', (e) => {
      e.preventDefault();
      askAi($('#floating-ai-input').value, 'floating-ai-input');
    });
    updateAiChats();
  }
  $('#floating-chat-title').textContent = siteSettings.aiName;
  $('#floating-chat-launcher span').textContent = siteSettings.aiName;
  $('#floating-chat-launcher').setAttribute('aria-label', siteSettings.aiName);
  $('#floating-chat-launcher').setAttribute('title', siteSettings.aiName);
  root.classList.toggle('has-comparison', !!$('.compare-tray'));
}
function setFloatingChat(open, returnFocus = true) {
  floatingChatOpen = open;
  $('#floating-chat-panel').hidden = !open;
  $('#floating-chat-launcher').setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('chat-is-open', open);
  if (open) {
    updateAiChats(true);
    $('#floating-ai-input').focus({ preventScroll: true });
  } else if (returnFocus) $('#floating-chat-launcher').focus({ preventScroll: true });
}
function updateAiChats(forceScroll = false) {
  for (const id of ['ai-chat', 'floating-ai-chat']) {
    const chat = $('#' + id);
    if (!chat) continue;
    const atBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 80;
    chat.innerHTML =
      (aiMessages.length ? renderMessages() : chatWelcome(id === 'floating-ai-chat')) +
      (aiBusy
        ? `<div class="chat-pending" role="status">${icon('spark')} Thinking with the catalog…</div>`
        : '');
    if (!aiMessages.length) chat.scrollTop = 0;
    else if (forceScroll || atBottom) chat.scrollTop = chat.scrollHeight;
  }
  document
    .querySelectorAll(
      '#ai-form button, #floating-ai-form button, [data-action="new-chat"], [data-question]',
    )
    .forEach((button) => {
      button.disabled = aiBusy;
    });
  for (const id of ['ai-input', 'floating-ai-input']) {
    const input = $('#' + id);
    if (input) input.value = aiDraft;
  }
}
document.addEventListener('input', (e) => {
  if (!['ai-input', 'floating-ai-input'].includes(e.target.id)) return;
  aiDraft = e.target.value;
  const other = $('#' + (e.target.id === 'ai-input' ? 'floating-ai-input' : 'ai-input'));
  if (other) other.value = aiDraft;
});
function renderMessages() {
  return aiMessages
    .map((m) =>
      m.role === 'user'
        ? `<div class="chat-user"><span class="chat-avatar">You</span><p>${esc(m.text)}</p></div>`
        : `<div class="chat-assistant"><span class="chat-avatar">${icon('spark')}</span><div>${m.html}</div></div>`,
    )
    .join('');
}
async function askAi(q, inputId = 'ai-input') {
  const question = q.trim().slice(0, 1000);
  if (!question || aiBusy) return;
  const history = aiMessages
    .filter((message) => message.text)
    .slice(-8)
    .map((message) => ({ role: message.role, content: message.text.slice(0, 2000) }));
  const contextProductIds = [...new Set(
    aiMessages.slice(-6).flatMap((message) => message.productIds || []),
  )].slice(-8);
  aiMessages.push({ role: 'user', text: question });
  aiBusy = true;
  aiDraft = '';
  updateAiChats(true);
  $('#' + inputId)?.focus({ preventScroll: true });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);
  try {
    const result = await api('/assistant', {
      method: 'POST',
      body: JSON.stringify({ question, history, contextProductIds }),
      signal: controller.signal,
    });
    let html = '<p>' + esc(result.message) + '</p>';
    if (result.keywords?.length)
      html += '<p class="ai-keywords">Matched: ' + result.keywords.map((keyword) => esc(keyword)).join(' · ') + '</p>';
    if (result.comparison) {
      html +=
        '<div class="table-scroll"><table class="ai-mini-table"><thead><tr><th>Specification</th>' +
        result.comparison.map((p) => '<th>' + esc(p.name) + '</th>').join('') +
        '</tr></thead><tbody>' +
        [
          ['Display', 'display'],
          ['Processor', 'processor'],
          ['Battery', 'battery'],
          ['Camera', 'camera'],
        ]
          .map(
            ([n, k]) =>
              '<tr><th>' +
              n +
              '</th>' +
              result.comparison.map((p) => '<td>' + esc(p[k]) + '</td>').join('') +
              '</tr>',
          )
          .join('') +
        '</tbody></table></div><button class="btn btn-soft" data-ai-compare="' +
        result.comparison.map((p) => esc(p.id)).join(',') +
        '">Open comparison</button>';
    }
    if (result.products?.length)
      html +=
        '<div class="ai-result-cards">' +
        result.products
          .map(
            (p) =>
              '<a href="/product/' +
              encodeURIComponent(p.id) +
              '"><img src="' +
              esc(p.image) +
              '" alt="' +
              esc(p.brand + ' ' + p.name) +
              '"><div><strong>' +
              esc(p.brand) +
              ' ' +
              esc(p.name) +
              '</strong><span>' +
              esc(p.variant || p.display) +
              '</span><span>' +
              money(p.price) +
              ' · ' +
              esc(p.priceStatus) +
              ' price</span></div>' +
              icon('arrow') +
              '</a>',
          )
          .join('') +
        '</div>';
    if (result.guides?.length)
      html +=
        '<div class="ai-guide-links">' +
        result.guides
          .map(
            (a) =>
              '<a href="/article/' +
              encodeURIComponent(a.id) +
              '">' +
              esc(a.title) +
              icon('arrow') +
              '</a>',
          )
          .join('') +
        '</div>';
    const productIds = [...new Set([
      ...(result.products || []).map((product) => product.id),
      ...(result.comparison || []).map((product) => product.id),
    ])].slice(0, 8);
    aiMessages.push({ role: 'assistant', text: result.message, html, productIds });
  } catch (error) {
    const message =
      error.name === 'AbortError'
        ? 'The assistant took too long to respond. Please try again.'
        : error.message;
    aiMessages.push({
      role: 'assistant',
      text: message,
      html:
        '<p>' +
        esc(message) +
        '</p><button type="button" class="chat-retry" data-question="' +
        esc(question) +
        '">Try again</button>',
    });
  } finally {
    clearTimeout(timeout);
    aiBusy = false;
    updateAiChats();
  }
}
function bindAi() {
  updateAiChats();
  $('#ai-form').addEventListener('submit', (e) => {
    e.preventDefault();
    askAi($('#ai-input').value);
  });
  const initial = new URLSearchParams(location.search).get('q');
  if (initial && !aiMessages.length) {
    askAi(initial);
    history.replaceState({}, '', '/ai');
  }
}
function infoPage(path) {
  if (path === '/about')
    return `<div class="container narrow-page">${pageHead('Technology, Explained.', 'Tekkatha makes technology easier to understand, compare, and buy.', 'About Tekkatha')}<div class="prose page-content"><h2>From Nepal. For everyone.</h2><p>We’re building a modern technology publication around a practical idea: good information makes better decisions possible. Our focus is Nepal, with an English-language perspective that reaches beyond borders.</p><h2>The stories, and the details behind them.</h2><p>Tekkatha covers technology news, smartphones, laptops, PC components, gaming, AI, gadget reviews, product comparisons, buying guides and PC builds. The product database puts useful specifications beside the information that matters to buyers.</p><h2>A clear approach to technology.</h2><p>Useful explanations. Transparent sources. Prices with context. Reviews that distinguish hands-on testing from a product overview. That is the direction behind Tekkatha.</p><a class="btn" href="/guides">Explore buying guides ${icon('arrow')}</a></div></div>`;
  if (path === '/contact')
    return `<div class="container narrow-page">${pageHead('Let’s talk tech.', 'For editorial questions, partnerships, advertising and support.', 'Contact')}<div class="catalog-banner">${icon('mail')}<p>These addresses are naming placeholders. Mailboxes are not configured, and messages cannot be sent through this preview.</p></div><div class="contact-grid page-content">${[
      [
        'General inquiries',
        siteSettings.contactEmail,
        'Questions about Tekkatha and the publication.',
      ],
      [
        'Editorial',
        siteSettings.editorialEmail,
        'Story ideas, corrections and editorial questions.',
      ],
      ['Advertising', siteSettings.advertiseEmail, 'Advertising and potential brand partnerships.'],
      ['Support', siteSettings.supportEmail, 'Website, product catalog and assistant support.'],
    ]
      .map(
        ([h, email, p]) =>
          `<div class="contact-card">${icon('mail')}<h2>${esc(h)}</h2><p>${esc(p)}</p><strong>${esc(email)}</strong><span class="pill">Mailbox not configured</span></div>`,
      )
      .join('')}</div></div>`;
  if (path === '/privacy')
    return `<div class="container narrow-page">${pageHead('Privacy, in plain language.', 'How Tekkatha handles visitor information and browser storage.', 'Privacy Policy')}<div class="prose page-content legal-page"><p class="legal-updated">Last updated: 9 October 2026</p><h2>Information we collect</h2><p>You can read Tekkatha without creating a public account. If you allow anonymous analytics, we record a random browser identifier, a random session identifier, the page visited, time spent, device category, browser, operating system, language and time zone. Our analytics records do not include your name or IP address.</p><h2>AI chat</h2><p>When you use Tekkatha AI, your question, up to eight recent chat messages, and no more than eight relevant product records are sent securely to our configured AI service at ai.shahnishant.com.np. Product records are limited to names, categories, variants, specifications, Nepal prices, price verification dates and availability labels. We do not send administrator data, analytics identifiers, session tokens, email addresses, product reviews, retailer links or raw database records. Do not include passwords, payment details or other sensitive personal information in a chat question.</p><h2>Your analytics choice</h2><p>Analytics starts only after you select “Allow anonymous analytics.” If you decline, no analytics events are sent. You can reset this choice by clearing Tekkatha’s site data in your browser.</p><h2>Browser storage and cookies</h2><p>The public website uses browser storage for your theme, comparison list, analytics choice and identifiers, and popup display frequency. The separate administrator area uses a secure, HTTP-only session cookie after an administrator signs in.</p><h2>External services and links</h2><p>Some pages load fonts or editorial images from third-party providers. Product sources, advertisements, popup banners and “Buy now” links can take you to other websites. Those services apply their own privacy practices when your browser connects to them.</p><h2>Data security and retention</h2><p>Administrative access is restricted, passwords are stored as one-way hashes, and session tokens are hashed in the database. Operational and analytics records are kept only while they remain useful for running and improving the publication.</p><h2>Your choices and questions</h2><p>You can decline analytics, clear browser storage, block third-party resources through your browser, and avoid following external links. Privacy questions can be directed to <strong>${esc(siteSettings.contactEmail)}</strong>.</p></div></div>`;
  if (path === '/terms')
    return `<div class="container narrow-page">${pageHead('Terms for using Tekkatha.', 'The conditions that apply when you browse and use this website.', 'Terms & Conditions')}<div class="prose page-content legal-page"><p class="legal-updated">Last updated: 9 October 2026</p><h2>Informational content</h2><p>Tekkatha provides technology news, explanations, specifications, comparisons, prices and buying guidance for general information. Content does not replace professional advice, and you remain responsible for your purchase decisions.</p><h2>Prices and availability</h2><p>Prices, configurations, stock and warranty terms can change. Check the verification label shown with a price and confirm the final details with the seller before purchasing.</p><h2>Reviews, AI and accuracy</h2><p>We aim to distinguish hands-on reviews from product overviews. Tekkatha AI generates conversational answers from a limited selection of catalog data. Its answer can be incomplete or mistaken and does not verify live retailer information, complete purchases or change website data. Confirm important details on the product page and with the seller.</p><h2>External links and purchases</h2><p>Links to manufacturers, retailers, advertisers and other websites are provided for convenience. A purchase takes place with the external seller under that seller’s terms. Sponsored and affiliate destinations should be identified where applicable.</p><h2>Acceptable use</h2><p>Do not misuse the website, attempt unauthorized access, interfere with its operation, scrape it in a way that harms availability, or submit unlawful or malicious material.</p><h2>Ownership and changes</h2><p>The website design, branding and original editorial material belong to their respective rights holders. These terms and website features may be updated as the service develops. Questions can be directed to <strong>${esc(siteSettings.contactEmail)}</strong>.</p></div></div>`;
  return `<div class="container narrow-page">${pageHead('Clear information. Transparent decisions.', 'The editorial principles behind Tekkatha.', 'Editorial Policy')}<div class="prose page-content"><h2>Accuracy and sourcing</h2><p>Technical specifications should link to manufacturer documentation. News should identify its source and publication date. Corrections should explain what changed and why.</p><h2>Reviews and product overviews</h2><p>A hands-on review should state how the device was obtained and tested. Product overviews should be labeled clearly and should not imply testing that did not take place. The current preview contains sample editorial articles.</p><h2>Nepal prices and availability</h2><p>Published prices should identify the configuration, source, warranty terms and date checked. The prices in this preview are illustrative. They are not verified quotes or statements of local availability.</p><h2>Commercial relationships</h2><p>Advertising, sponsorships and affiliate links should be identified clearly. A commercial relationship should never be presented as an independent editorial judgment.</p><h2>AI assistance</h2><p>Tekkatha AI receives a limited set of locally selected product fields. Web search and tools are disabled. Product links and comparison data shown beside an answer are rebuilt from our catalog after the AI response, and important purchase details should still be confirmed with the seller.</p></div></div>`;
}
function notFound() {
  return `<div class="container page-content">${pageHead('This page is off the map.', 'The link may have changed, or the page is not here yet.', 'Page not found')}<div class="empty-state">${icon('search')}<h3>Let’s get you back to the tech.</h3><a class="btn" href="/">Go to the homepage ${icon('arrow')}</a></div></div>`;
}
document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'reset-catalog') {
    catalogState = { query: '', type: 'All', brand: 'All', budget: 'all', sort: 'featured' };
    catalogVisibleLimit = 50;
    render();
  }
  if (action === 'new-chat') {
    if (aiBusy) return;
    aiMessages = [];
    aiDraft = '';
    updateAiChats(true);
    (floatingChatOpen ? $('#floating-ai-input') : $('#ai-input'))?.focus();
  }
  if (action === 'toggle-floating-chat') setFloatingChat(!floatingChatOpen);
  if (action === 'close-floating-chat') setFloatingChat(false);
  const question = e.target.closest('[data-question]');
  if (question)
    askAi(
      question.dataset.question,
      question.closest('#floating-chat-panel') ? 'floating-ai-input' : 'ai-input',
    );
  const aiCompare = e.target.closest('[data-ai-compare]');
  if (aiCompare) {
    selected = aiCompare.dataset.aiCompare.split(',');
    navigate('/compare');
  }
  const cat = e.target.closest('[data-compare-category]');
  if (cat) {
    selected = products
      .filter((p) => p.type === cat.dataset.compareCategory)
      .slice(0, 2)
      .map((p) => p.id);
    showDifferences = false;
    render();
  }
});
function registerTools() {
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const tool = {
      name: 'show_product_comparison',
      title: 'Compare Tekkatha products',
      description:
        'Show a specification comparison for two or three products from the Tekkatha MongoDB catalog. Check each price verification label.',
      inputSchema: {
        type: 'object',
        properties: {
          productIds: {
            type: 'array',
            items: { type: 'string', enum: products.map((p) => p.id) },
            minItems: 2,
            maxItems: 3,
            uniqueItems: true,
          },
        },
        required: ['productIds'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (
          !input ||
          Object.keys(input).some((k) => k !== 'productIds') ||
          !Array.isArray(input.productIds) ||
          input.productIds.length < 2 ||
          input.productIds.length > 3 ||
          new Set(input.productIds).size !== input.productIds.length
        )
          throw new Error('Provide two or three unique productIds.');
        const ps = input.productIds.map((id) => products.find((p) => p.id === id));
        if (ps.some((p) => !p) || new Set(ps.map((p) => p.type)).size !== 1)
          throw new Error('Choose known products from the same category.');
        selected = ps.map((p) => p.id);
        navigate('/compare');
        return {
          shown: ps.map((p) => ({ id: p.id, name: p.name })),
          priceLabels: ps.map((p) => ({ id: p.id, status: p.priceStatus })),
        };
      },
    };
    try {
      Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(
        () => {},
      );
      window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
    } catch {}
  }
}

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'The backend is unavailable.');
  return data;
}
async function allRecords(name) {
  const first = await api('/' + name + '?limit=100');
  let items = first.items;
  for (let page = 2; items.length < first.total; page++) {
    const next = await api('/' + name + '?limit=100&page=' + page);
    if (!next.items.length) break;
    items.push(...next.items);
  }
  return items;
}
async function boot() {
  shell(
    `<div class="container page-content">${pageHead('Technology, Explained.', 'Loading Tekkatha…')}<p class="muted">Connecting to the publication.</p></div>`,
  );
  try {
    const [loadedArticles, loadedProducts, settings] = await Promise.all([
      allRecords('articles'),
      allRecords('products'),
      api('/settings'),
    ]);
    articles = loadedArticles.sort(
      (a, b) =>
        Number(a.isSample) - Number(b.isSample) ||
        (a.isSample ? 0 : new Date(b.updatedAt) - new Date(a.updatedAt)),
    );
    products = loadedProducts;
    articleBody = Object.fromEntries(
      articles.map((a) => [a.id, (a.body || []).map((s) => [s.heading, s.text])]),
    );
    if (settings) {
      siteSettings = { ...siteSettings, ...settings };
      document.documentElement.style.setProperty('--brand-light', settings.primaryColor);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.primaryColor);
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.content = settings.description;
      const favicon = document.querySelector('link[rel~="icon"]');
      if (favicon && settings.logoImage) {
        favicon.href = settings.logoImage;
        if (/\.svg(?:$|\?)/i.test(settings.logoImage)) favicon.type = 'image/svg+xml';
        else favicon.removeAttribute('type');
      }
    }
    render();
    registerTools();
  } catch (error) {
    shell(
      `<div class="container page-content">${pageHead('The publication is taking a moment.', 'Check that the backend and MongoDB are running.')}<div class="empty-state"><h3>Could not load Tekkatha</h3><p>${esc(error.message)}</p><button class="btn" id="retry-content">Try again</button></div></div>`,
    );
    $('#retry-content').addEventListener('click', boot);
  }
}
const adDisplay = createAdDisplay({ api, apiBase: API_BASE });
const footerSeo = createFooterSeo();
const analytics = createAnalytics({ apiBase: API_BASE });
const popupNotice = createPopupNotice({ apiBase: API_BASE });
adDisplay.start();
analytics.start();
popupNotice.start();
boot();
