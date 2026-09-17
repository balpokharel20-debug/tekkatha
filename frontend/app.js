'use strict';
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
let selected = [];
let siteSettings = {
  siteName: 'Tekkatha',
  tagline: 'Technology, Explained.',
  aiName: 'Tekkatha AI',
  description: '',
  contactEmail: 'contact@tekkatha.com',
  editorialEmail: 'editorial@tekkatha.com',
  advertiseEmail: 'advertise@tekkatha.com',
  supportEmail: 'support@tekkatha.com',
};
let catalogState = { query: '', type: 'All', brand: 'All', budget: 'all', sort: 'featured' };
let showDifferences = false;
let aiMessages = [];
let newsFilter = 'All';
let searchOpen = false;
let searchReturnFocus = null;
let toastTimer;
const nav = [
  ['Home', '/'],
  ['News', '/news'],
  ['Smartphones', '/smartphones'],
  ['Laptops', '/laptops'],
  ['PC & Gaming', '/gaming'],
  ['Reviews', '/reviews'],
  ['Buying Guides', '/guides'],
  ['Compare', '/compare'],
];
const money = (n) => `Rs. ${n.toLocaleString('en-IN')}`;
function brand() {
  return `<a href="/" class="brand" aria-label="Tekkatha home"><img src="/assets/mark.svg" alt="" width="37" height="37"><span class="brand-text">${esc(siteSettings.siteName)}<b>.</b></span></a>`;
}
function header() {
  const route = location.pathname;
  const dark = document.documentElement.dataset.theme === 'dark';
  return `<header><div class="topbar"><div class="container"><div class="top-meta"><span>${esc(siteSettings.tagline)}</span><span><span class="flag" aria-hidden="true">🇳🇵</span> Nepal & beyond</span></div><div class="top-links"><a href="/about">About Tekkatha</a><a href="/contact">Contact</a><a href="/contact?topic=advertise">Advertise</a></div></div></div><div class="container header-main"><div style="display:flex;align-items:center">${brand()}<span class="tagline">Know tech. Make better choices.</span></div><div class="header-actions"><button class="header-search" data-action="search" aria-label="Search Tekkatha">${icon('search')}<span>Search Tekkatha</span><kbd>/</kbd></button><button class="icon-btn" data-action="theme" aria-label="${dark ? 'Switch to light theme' : 'Switch to dark theme'}" title="${dark ? 'Light theme' : 'Dark theme'}">${icon(dark ? 'sun' : 'moon')}</button><a class="btn" href="/ai" aria-label="Ask Tekkatha AI">${icon('spark')}<span>Ask Tekkatha AI</span></a></div></div><div class="nav-wrap"><div class="container nav"><nav class="nav-links" aria-label="Main navigation">${nav.map(([name, url]) => `<a href="${url}" ${route === url ? 'class="active" aria-current="page"' : ''}>${name}</a>`).join('')}</nav><a href="/prices" class="nav-prices">${icon('tag')} Prices in Nepal</a></div></div></header>`;
}
function footer() {
  return `<footer class="footer"><div class="container"><div class="footer-main"><div class="footer-brand">${brand()}<p>Making technology easier to understand, compare, and buy. From Nepal, for everyone.</p></div><div class="footer-links"><div><h4>Explore</h4><a href="/news">Technology News</a><a href="/reviews">Gadget Reviews</a><a href="/guides">Buying Guides</a><a href="/gaming">PC & Gaming</a></div><div><h4>Find your next gadget</h4><a href="/products">Product Database</a><a href="/prices">Prices in Nepal</a><a href="/compare">Compare Products</a><a href="/ai">Tekkatha AI</a></div><div><h4>Tekkatha</h4><a href="/about">About Us</a><a href="/contact">Contact</a><a href="/contact?topic=advertise">Advertise</a><a href="/editorial-policy">Editorial Policy</a></div></div></div><div class="footer-bottom"><span>© Tekkatha. All rights reserved.</span><span>${icon('globe')} Built around better tech decisions.</span></div></div></footer>`;
}
function meta(a, full = false) {
  return `<div class="meta">${full ? '<span class="avatar" aria-hidden="true">TK</span>' : ''}<span>${esc(full ? a.author : a.isSample ? 'Editorial preview' : a.author)}</span><span class="dot">·</span><span>${a.read} min read</span></div>`;
}
function story(a) {
  return `<article class="story-card"><a href="/article/${a.id}"><div class="story-cover"><img src="${esc(a.image)}" alt="${esc(a.category)} editorial illustration" loading="lazy"></div><span class="eyebrow">${esc(a.category)}</span><h3>${esc(a.title)}</h3></a><p class="excerpt">${esc(a.excerpt)}</p>${meta(a)}</article>`;
}
function product(p) {
  return `<article class="product-card"><a href="/product/${p.id}" aria-label="View ${esc(p.brand)} ${esc(p.name)}"><div class="product-visual"><span class="product-tag">${p.priceStatus === 'verified' ? 'Source recorded' : p.priceStatus === 'sample' ? 'Sample price' : 'Unverified price'}</span><img src="${esc(p.image)}" alt="Illustration of ${esc(p.brand)} ${esc(p.name)}" loading="lazy"></div></a><div class="product-info"><p class="product-brand">${esc(p.brand)}</p><a href="/product/${p.id}"><h3>${esc(p.name)}</h3></a><p class="product-variant">${esc(p.variant)}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="compare-add ${selected.includes(p.id) ? 'selected' : ''}" data-compare="${p.id}" aria-label="${selected.includes(p.id) ? 'Remove' : 'Add'} ${esc(p.name)} ${selected.includes(p.id) ? 'from' : 'to'} comparison">${icon(selected.includes(p.id) ? 'check' : 'plus')} Compare</button></div></div></article>`;
}
function title(name, link, label = 'View all') {
  return `<div class="section-title"><h2>${name}</h2>${link ? `<a class="text-link" href="${link}">${label} ${icon('arrow')}</a>` : ''}</div>`;
}
function homepage() {
  if (!articles.length)
    return `<div class="container page-content">${pageHead('Technology, Explained.', 'The latest stories will appear here as the editorial team publishes them.')}<div class="empty-state"><h3>The next story is on its way.</h3><a class="btn" href="/products">Explore products</a></div></div>`;
  return `<div class="container"><div class="trending"><span class="trending-label">${icon('trend')} TRENDING</span><div class="trend-items">${articles
    .slice(0, 4)
    .map(
      (a) =>
        `<a href="/article/${a.id}">${esc(a.title.length > 38 ? a.title.slice(0, 35) + '…' : a.title)}</a>`,
    )
    .join(
      '',
    )}<a href="/prices">Gadget prices in Nepal</a></div></div><div class="intro"><div><h1>Your daily dose of tech.</h1><p>The stories that matter. The details that help you decide.</p></div><span class="date-label">${icon('calendar')} Technology, Explained.</span></div><section class="hero-grid" aria-label="Featured stories"><a href="/article/${articles[0].id}" class="hero-main"><img src="${esc(articles[0].image)}" alt="Featured technology story" fetchpriority="high"><div class="hero-shade"></div><div class="hero-content"><span class="badge">THE BIG READ</span><h2>${esc(articles[0].title)}</h2><p>${esc(articles[0].excerpt)}</p>${meta(articles[0], true)}</div></a><div class="hero-side">${articles
    .slice(1, 3)
    .map(
      (a) =>
        `<a href="/article/${a.id}" class="side-story"><img class="story-image" src="${esc(a.image)}" alt="${esc(a.category)} editorial illustration"><div class="side-copy"><span class="eyebrow">${esc(a.category)}</span><h2>${esc(a.title)}</h2>${meta(a)}</div></a>`,
    )
    .join(
      '',
    )}</div></section><section class="quick-links" aria-label="Find your next gadget"><a href="/prices" class="quick-link"><span class="quick-icon">${icon('tag')}</span><div><h3>Gadget prices in Nepal</h3><p>Your next upgrade starts here.</p></div>${icon('arrow')}</a><a href="/compare" class="quick-link"><span class="quick-icon">${icon('compare')}</span><div><h3>Compare side by side</h3><p>Small details. Better decisions.</p></div>${icon('arrow')}</a><a href="/guides" class="quick-link"><span class="quick-icon">${icon('book')}</span><div><h3>Find your perfect fit</h3><p>Practical guides for every budget.</p></div>${icon('arrow')}</a></section><section class="news-layout"><div>${title('On the radar', '/news', 'All stories')}<div class="news-filters" role="group" aria-label="Filter stories">${['All', 'Smartphones', 'Laptops', 'AI', 'Gaming'].map((x) => `<button class="filter ${newsFilter === x ? 'active' : ''}" data-news-filter="${esc(x)}">${x === 'All' ? 'All stories' : x}</button>`).join('')}</div><div class="story-grid" id="home-stories">${homeStories()}</div></div><aside class="news-sidebar"><div><h2 class="sidebar-title">Recommended reads</h2><div class="popular-list">${articles
    .slice(1, 4)
    .map(
      (a) =>
        `<a href="/article/${a.id}" class="popular-item"><div><span class="eyebrow">${esc(a.category)}</span><h3>${esc(a.title)}</h3></div></a>`,
    )
    .join(
      '',
    )}</div></div><div class="ai-mini">${icon('spark', 'ai-symbol')}<h3>A little help. A smarter choice.</h3><p>Ask Tekkatha AI about specs, comparisons, and your next gadget.</p><a href="/ai" class="btn">Ask Tekkatha AI ${icon('arrow')}</a></div></aside></section></div><section class="price-section"><div class="container">${title('Meet your next upgrade', '/prices', 'Explore prices')}<p class="section-subtitle">Explore the product database. Check the verification label on every price.</p><div class="product-grid">${products.map(product).join('')}</div></div></section><section class="container guide-section">${title('Buy better. Know more.', '/guides', 'All buying guides')}<div class="guide-grid">${articles
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
  $('#app').innerHTML =
    header() + `<main id="main" tabindex="-1">${content}</main>` + footer() + tray();
}
function render() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  let content;
  let pageTitle = '';
  if (path === '/') content = homepage();
  else if (['/products', '/prices', '/smartphones', '/laptops'].includes(path)) {
    content = catalogPage(path);
    pageTitle =
      path === '/prices'
        ? 'Gadget Prices in Nepal'
        : path === '/smartphones'
          ? 'Smartphones'
          : path === '/laptops'
            ? 'Laptops'
            : 'Product Database';
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
    const p = products.find((p) => p.id === path.split('/')[2]);
    content = p ? productPage(p) : notFound();
    pageTitle = p ? `${esc(p.brand)} ${esc(p.name)}` : 'Page not found';
  } else if (path.startsWith('/article/')) {
    const a = articles.find((a) => a.id === path.split('/')[2]);
    content = a ? articlePage(a) : notFound();
    pageTitle = a?.title || 'Page not found';
  } else if (path === '/compare') {
    content = comparePage();
    pageTitle = 'Compare Products';
  } else if (path === '/ai') {
    content = aiPage();
    pageTitle = 'Tekkatha AI';
  } else if (path === '/hello') {
    location.replace(
      import.meta.env.VITE_ADMIN_URL || 'http://' + location.hostname + ':5174/hello',
    );
    return;
  } else if (['/about', '/contact', '/editorial-policy'].includes(path)) {
    content = infoPage(path);
    pageTitle =
      path === '/about'
        ? 'About Tekkatha'
        : path === '/contact'
          ? 'Contact Tekkatha'
          : 'Editorial Policy';
  } else {
    content = notFound();
    pageTitle = 'Page not found';
  }
  document.title = pageTitle
    ? `${pageTitle} — ${siteSettings.siteName}`
    : siteSettings.siteName + ' — Tech News, Reviews, Prices & Buying Guides';
  shell(content);
  if (path === '/ai') bindAi();
  if (['/products', '/prices', '/smartphones', '/laptops'].includes(path)) bindCatalog(path);
  if (path === '/compare') bindCompare();
}
function navigate(path) {
  history.pushState({}, '', path);
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
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
    navigate(a.getAttribute('href'));
  }
});
function openSearch() {
  if (searchOpen) return;
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
    `${esc(p.brand)} ${esc(p.name)} ${esc(p.type)}`.toLowerCase().includes(q),
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
  if (e.key === 'Escape' && searchOpen) closeSearch();
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
});
function pageHead(name, description, crumb = '') {
  name = esc(name);
  description = esc(description);
  crumb = esc(crumb);
  return `<div class="page-head"><div class="breadcrumb"><a href="/">Home</a><span>/</span><span>${crumb || name}</span></div><h1>${name}</h1><p>${description}</p></div>`;
}
function catalogType(path) {
  return path === '/smartphones'
    ? 'Smartphones'
    : path === '/laptops'
      ? 'Laptops'
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
          : 'The product database';
  const type = catalogType(path);
  const results = filteredProducts(path);
  return `<div class="container">${pageHead(name, 'Less searching. More understanding. Explore specifications and find the right fit for your budget.')}<div class="catalog-banner">${icon('shield')}<p><strong>Know the price context.</strong> Every record has a price label. Confirm current retailer pricing, availability and warranty before buying.</p></div><div class="catalog-toolbar"><label class="catalog-search">${icon('search')}<input type="search" id="catalog-query" placeholder="Search a product or specification" aria-label="Search products" value="${esc(catalogState.query)}"></label>${!['/smartphones', '/laptops'].includes(path) ? `<label class="select-label"><span>Category</span><select id="catalog-type"><option value="All">All categories</option>${[...new Set(products.map((p) => p.type))].map((x) => `<option ${type === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>` : ''}<label class="select-label"><span>Brand</span><select id="catalog-brand"><option value="All">All brands</option>${[...new Set(products.map((p) => p.brand))].map((x) => `<option ${catalogState.brand === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label><label class="select-label"><span>Budget</span><select id="catalog-budget">${[
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
    )}</select></label></div><div class="results-bar"><p id="result-count">${results.length} product${results.length === 1 ? '' : 's'}</p><label>Sort by <select id="catalog-sort" aria-label="Sort products">${[
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
    )}</select></label></div><div class="page-content"><div class="product-grid catalog-grid" id="catalog-results">${results.map(product).join('') || catalogEmpty()}</div>${
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
}
function refreshCatalog(path) {
  const results = filteredProducts(path);
  $('#catalog-results').innerHTML = results.map(product).join('') || catalogEmpty();
  $('#result-count').textContent = `${results.length} product${results.length === 1 ? '' : 's'}`;
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
      : 'Unverified Nepal price';
}
function productPage(p) {
  const same = products.filter((x) => x.type === p.type && x.id !== p.id);
  const available = {
    unverified: 'Availability unverified',
    'in-stock': 'Listed as in stock',
    'out-of-stock': 'Listed as out of stock',
  };
  return `<div class="container">${pageHead(p.brand + ' ' + p.name, p.note, 'Product Database / ' + p.name)}<div class="page-content"><section class="product-detail"><div class="product-detail-image"><span class="pill">Product illustration</span><img src="${esc(p.image)}" alt="${esc(p.brand + ' ' + p.name)}"></div><div class="product-detail-copy"><span class="eyebrow">${esc(p.type)}</span><h2>${esc(p.name)}</h2><p class="variant">${esc(p.variant)}</p><div class="detail-price">${money(p.price)}<span>${priceLabel(p)}</span></div><p class="price-disclaimer">${p.priceStatus === 'sample' ? 'This is a sample price, not a current retailer quote.' : 'Confirm the current price and exact configuration with the seller.'} ${available[p.availability] || available.unverified}.${p.priceCheckedAt ? ' Checked ' + esc(new Date(p.priceCheckedAt).toLocaleDateString('en-GB')) + '.' : ''}</p>${p.priceSource ? '<a class="manufacturer-link" href="' + esc(p.priceSource) + '" target="_blank" rel="noopener noreferrer">Retailer price source ' + icon('arrow') + '</a>' : ''}<div class="detail-actions"><button class="btn" data-compare="${p.id}">${icon('compare')} ${selected.includes(p.id) ? 'Remove from comparison' : 'Add to comparison'}</button><a class="btn btn-outline" href="/ai?q=${encodeURIComponent('Tell me about ' + p.brand + ' ' + p.name)}">${icon('spark')} Ask Tekkatha AI</a></div>${p.source ? '<a class="manufacturer-link" href="' + esc(p.source) + '" target="_blank" rel="noopener noreferrer">Manufacturer specifications ' + icon('arrow') + '</a>' : ''}</div></section><section class="spec-section">${title('The details that matter')}<div class="spec-grid">${[
    ['Display', p.display, 'phone'],
    ['Processor', p.processor, 'cpu'],
    ['Memory', p.memory, 'cpu'],
    ['Storage', p.storage, 'settings'],
    ['Battery', p.battery, 'settings'],
    ['Camera', p.camera, 'phone'],
  ]
    .map(
      ([name, value, i]) =>
        '<div class="spec-item">' +
        icon(i) +
        '<div><span>' +
        name +
        '</span><strong>' +
        esc(value || 'Not listed') +
        '</strong></div></div>',
    )
    .join(
      '',
    )}</div></section><section class="product-related">${title('Explore similar products', '/products', 'View database')}<div class="product-grid">${same.map(product).join('')}</div>${!same.length ? '<p class="muted">More products will appear as the catalog expands.</p>' : ''}</section></div></div>`;
}
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
  const allRows = [
    ['Brand', 'brand'],
    ['Category', 'type'],
    ['Display', 'display'],
    ['Processor', 'processor'],
    ['Memory', 'memory'],
    ['Storage', 'storage'],
    ['Battery', 'battery'],
    ['Camera', 'camera'],
    ['Nepal price', 'price'],
    ['Price label', 'priceStatus'],
    ['Availability', 'availability'],
  ];
  const rows = showDifferences
    ? allRows.filter(([label, key]) => new Set(ps.map((p) => p[key])).size > 1)
    : allRows;
  return `<div class="container">${pageHead('Compare. Understand. Decide.', 'Put up to three products side by side. Look beyond the headline specifications.', 'Compare Products')}<div class="compare-top"><div class="compare-category"><button class="filter ${type === 'Smartphones' ? 'active' : ''}" data-compare-category="Smartphones">${icon('phone')} Smartphones</button><button class="filter ${type === 'Laptops' ? 'active' : ''}" data-compare-category="Laptops">${icon('laptop')} Laptops</button></div><label class="difference-control"><input type="checkbox" id="differences-only" ${showDifferences ? 'checked' : ''}> Show differences only</label></div><div class="compare-pickers">${[0, 1, 2].map((i) => `<div class="compare-picker"><label for="compare-${i}">Product ${i + 1}${i === 2 ? ' (optional)' : ''}</label><select id="compare-${i}" data-compare-slot="${i}"><option value="">Choose a product</option>${eligible.map((p) => `<option value="${p.id}" ${ps[i]?.id === p.id ? 'selected' : ''} ${ps.some((x, n) => n !== i && x.id === p.id) ? 'disabled' : ''}>${esc(p.brand)} ${esc(p.name)}</option>`).join('')}</select>${ps[i] ? `<img src="${esc(ps[i].image)}" alt="Illustration of ${esc(ps[i].name)}"><h2>${esc(ps[i].name)}</h2><span class="price">${money(ps[i].price)}</span><p>${priceLabel(ps[i])}</p>` : `<div class="picker-empty">${icon('plus')}<span>Add another perspective</span></div>`}</div>`).join('')}</div><div class="catalog-banner compare-notice">${icon('shield')}<p>Check the verification label for each price. Confirm current pricing, stock and local warranty before deciding.</p></div><div class="table-scroll page-content"><table class="compare-table"><caption class="sr-only">Product specification comparison</caption><thead><tr><th scope="col">Specifications</th>${ps.map((p) => `<th scope="col">${esc(p.brand)} ${esc(p.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label, key]) => `<tr><th scope="row">${label}</th>${ps.map((p) => `<td>${key === 'price' ? money(p[key]) : key === 'priceStatus' ? priceLabel(p) : esc(p[key])}</td>`).join('')}</tr>`).join('')}${!rows.length ? `<tr><td colspan="${ps.length + 1}">No differences to show. Add another product or display all specifications.</td></tr>` : ''}<tr><th scope="row">Manufacturer source</th>${ps.map((p) => `<td><a class="text-link" href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">Official specifications ${icon('arrow')}</a></td>`).join('')}</tr></tbody></table></div></div>`;
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
  const related = articles
    .filter((x) => x.id !== a.id && (x.category === a.category || x.kind === a.kind))
    .slice(0, 3);
  return `<div class="container article-container"><div class="breadcrumb article-crumb"><a href="/">Home</a><span>/</span><a href="${a.kind === 'Guide' ? '/guides' : '/news'}">${esc(a.category)}</a></div><header class="article-head"><span class="eyebrow">${esc(a.category)} ${a.isSample ? '<span class="pill">Editorial preview</span>' : ''}</span><h1>${esc(a.title)}</h1><p>${esc(a.excerpt)}</p>${meta(a, true)}</header><img class="article-hero" src="${esc(a.image)}" alt="${esc(a.category)} editorial illustration"><div class="article-layout"><aside class="article-toc"><h2>In this article</h2>${articleBody[a.id].map(([h], i) => `<a href="#section-${i}">${esc(h)}</a>`).join('')}<a class="text-link" href="/ai">Ask Tekkatha AI ${icon('spark')}</a></aside><div class="article-body">${articleBody[a.id].map(([h, p], i) => `<section id="section-${i}"><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('')}${a.id === 'macbook-air-overview' ? `<div class="article-source">Specifications: <a href="https://support.apple.com/en-ie/122209" target="_blank" rel="noopener noreferrer">Apple’s official MacBook Air M4 technical specifications</a>.</div>` : ''}${a.isSample ? '<div class="article-note">Sample editorial article. Product prices and availability require verification before publication.</div>' : ''}</div></div><section class="guide-section">${title('Keep exploring', '/news', 'More stories')}<div class="story-grid full-grid">${(related.length ? related : articles.slice(0, 3)).map(story).join('')}</div></section></div>`;
}
function aiPage() {
  return `<div class="container ai-container">${pageHead('Your next tech decision starts here.', 'Ask Tekkatha AI about products, specifications, prices, comparisons, reviews, and buying recommendations.', 'Tekkatha AI')}<section class="ai-workspace"><div class="ai-workspace-head"><span class="ai-name">${icon('spark')} ${esc(siteSettings.aiName)}</span><span class="pill">Catalog mode</span><button class="text-link" data-action="new-chat">New conversation ${icon('plus')}</button></div><div class="ai-chat" id="ai-chat" aria-live="polite">${aiMessages.length ? renderMessages() : `<div class="ai-welcome"><div class="ai-welcome-icon">${icon('spark')}</div><h2>A little clarity goes a long way.</h2><p>Compare the details. Understand the specs.<br>Find a better starting point.</p><div class="ai-suggestions">${['Best phones under Rs. 50,000?', 'Compare Galaxy A56 and Nothing Phone (3a)', 'Show me phones with 120Hz AMOLED displays', 'What is the latest price of this product?'].map((q) => `<button data-question="${esc(q)}">${esc(q)} ${icon('arrow')}</button>`).join('')}</div></div>`}</div><form id="ai-form" class="ai-input-form"><label class="sr-only" for="ai-input">Ask Tekkatha AI</label><input id="ai-input" placeholder="Ask anything about gadgets..." autocomplete="off" maxlength="1000" required><button class="btn" aria-label="Send question">${icon('send')}</button></form><p class="ai-disclaimer">Catalog mode uses Tekkatha’s MongoDB records. Live AI and retailer lookup are not connected.</p></section><div class="ai-bottom"><span>${icon('shield')} Specifications linked to manufacturer sources</span><span>${icon('tag')} Sample Nepal prices are clearly marked</span></div></div>`;
}
function renderMessages() {
  return aiMessages
    .map((m) =>
      m.role === 'user'
        ? `<div class="chat-user"><span class="chat-avatar">You</span><p>${esc(m.text)}</p></div>`
        : `<div class="chat-assistant"><span class="chat-avatar">${icon('spark')}</span><div>${m.html}</div></div>`,
    )
    .join('');
}
async function askAi(q) {
  const question = q.trim().slice(0, 1000);
  if (!question || $('#ai-form button').disabled) return;
  aiMessages.push({ role: 'user', text: question });
  $('#ai-chat').innerHTML = renderMessages();
  $('#ai-input').value = '';
  $('#ai-form button').disabled = true;
  try {
    const result = await api('/assistant', { method: 'POST', body: JSON.stringify({ question }) });
    let html = '<p>' + esc(result.message) + '</p>';
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
              '" alt=""><div><strong>' +
              esc(p.brand) +
              ' ' +
              esc(p.name) +
              '</strong><span>' +
              esc(p.display) +
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
    aiMessages.push({ role: 'assistant', html });
  } catch (error) {
    aiMessages.push({ role: 'assistant', html: '<p>' + esc(error.message) + '</p>' });
  } finally {
    if ($('#ai-chat')) {
      $('#ai-chat').innerHTML = renderMessages();
      $('#ai-chat').scrollTop = $('#ai-chat').scrollHeight;
      $('#ai-form button').disabled = false;
      $('#ai-input').focus();
    }
  }
}
function bindAi() {
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
      ['Support', siteSettings.supportEmail, 'Website, product database and assistant support.'],
    ]
      .map(
        ([h, email, p]) =>
          `<div class="contact-card">${icon('mail')}<h2>${esc(h)}</h2><p>${esc(p)}</p><strong>${esc(email)}</strong><span class="pill">Mailbox not configured</span></div>`,
      )
      .join('')}</div></div>`;
  return `<div class="container narrow-page">${pageHead('Clear information. Transparent decisions.', 'The editorial principles behind Tekkatha.', 'Editorial Policy')}<div class="prose page-content"><h2>Accuracy and sourcing</h2><p>Technical specifications should link to manufacturer documentation. News should identify its source and publication date. Corrections should explain what changed and why.</p><h2>Reviews and product overviews</h2><p>A hands-on review should state how the device was obtained and tested. Product overviews should be labeled clearly and should not imply testing that did not take place. The current preview contains sample editorial articles.</p><h2>Nepal prices and availability</h2><p>Published prices should identify the configuration, source, warranty terms and date checked. The prices in this preview are illustrative. They are not verified quotes or statements of local availability.</p><h2>Commercial relationships</h2><p>Advertising, sponsorships and affiliate links should be identified clearly. A commercial relationship should never be presented as an independent editorial judgment.</p><h2>AI assistance</h2><p>AI answers should identify their sources and limitations. The preview assistant currently searches the included catalog and does not verify live retailer information or make claims about unlisted devices.</p></div></div>`;
}
function notFound() {
  return `<div class="container page-content">${pageHead('This page is off the map.', 'The link may have changed, or the page is not here yet.', 'Page not found')}<div class="empty-state">${icon('search')}<h3>Let’s get you back to the tech.</h3><a class="btn" href="/">Go to the homepage ${icon('arrow')}</a></div></div>`;
}
document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'reset-catalog') {
    catalogState = { query: '', type: 'All', brand: 'All', budget: 'all', sort: 'featured' };
    render();
  }
  if (action === 'new-chat') {
    aiMessages = [];
    render();
  }
  const question = e.target.closest('[data-question]');
  if (question) askAi(question.dataset.question);
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
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.content = settings.description;
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
boot();
