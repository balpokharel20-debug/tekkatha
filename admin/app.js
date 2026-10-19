import { compressProductImage } from './product-image.js';
import { createAdsManager } from './ads.js';
import { createPopupNoticesManager } from './popup.js';
import { prepareAdImage, isGifUpload } from './ad-image.js';
import { buildSeoMarkup, MAX_FOOTER_SEO_CODE } from '../shared/seo.js';
import { MAX_PRODUCT_CONTENT_TEXT } from '../shared/product-content.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  book: '<path d="M12 5C7 2 3 4 3 4v16s5-2 9 1c4-3 9-1 9-1V4s-4-2-9 1Zm0 0v16"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
  settings:
    '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  edit: '<path d="m15 4 5 5M3 21l5-1L21 7l-5-5L3 15Z"/>',
  archive: '<rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v13h14V8M10 12h4"/>',
  restore: '<path d="M4 10a8 8 0 1 1 0 6M4 3v7h7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  logout: '<path d="M9 5H4v14h5m5-14 7 7-7 7M8 12h13"/>',
  moon: '<path d="M20.4 14.6A8.7 8.7 0 0 1 9.4 3.6a8.7 8.7 0 1 0 11 11Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  external: '<path d="M14 3h7v7M21 3l-11 11M11 3H3v18h18v-8"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7a4 4 0 0 1 0 7m4 10v-2a4 4 0 0 0-3-3.87"/>',
  chart: '<path d="M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8m4 8V4"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
};
const icon = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[n] || paths.arrow}</svg>`;
const API = import.meta.env.VITE_API_BASE || '/api';
const ADMIN_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const ADMIN_HOME = `${ADMIN_BASE}/hello`;
const ASSET_BASE = import.meta.env.BASE_URL;
const WEBSITE = import.meta.env.VITE_WEBSITE_URL || location.origin;
let admin = null,
  view = 'overview',
  records = [],
  settings = null,
  stats = {},
  page = 1,
  total = 0,
  query = '',
  archived = false,
  status = 'all',
  editing = null,
  productOptions = [],
  noticeTimer,
  searchTimer;
const categories = [
  'Technology News',
  'Smartphones',
  'Laptops',
  'PC Components',
  'Gaming',
  'AI',
  'Reviews',
  'Buying Guides',
  'PC Builds',
];
const types = ['Smartphones', 'Laptops', 'PC Components', 'Gaming', 'Accessories'];
const logo = () =>
  `<a class="logo" href="${ADMIN_HOME}"><img src="${ASSET_BASE}assets/mark.svg" alt=""><span>Tekkatha<b>.</b></span></a>`;
const date = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
const money = (n) => 'Rs. ' + Number(n).toLocaleString('en-IN');
async function api(path, options = {}) {
  if (import.meta.env.VITE_VERCEL_DEPLOY === 'true' && typeof options.body === 'string') {
    const size = new TextEncoder().encode(options.body).byteLength;
    if (size > 3.75 * 1024 * 1024)
      throw new Error(
        'This save is too large for the hosting limit. Reduce the number of embedded review images or use image URLs.',
      );
  }
  let res;
  try {
    res = await fetch(API + path, {
      credentials: 'include',
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error(
      'The backend is unavailable. Start the backend and check the MongoDB connection.',
    );
  }
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || 'The request could not be completed.');
    error.status = res.status;
    throw error;
  }
  return data;
}
function notice(message) {
  const n = $('#notice');
  n.textContent = message;
  n.classList.add('visible');
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => n.classList.remove('visible'), 4000);
}
function toggleTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  if (dark) delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = 'dark';
  try {
    localStorage.setItem('tekkatha-admin-theme', dark ? 'light' : 'dark');
  } catch {}
  const b = $('[data-action="theme"]');
  if (b) {
    b.innerHTML = icon(dark ? 'moon' : 'sun');
    b.setAttribute('aria-label', dark ? 'Switch to dark theme' : 'Switch to light theme');
  }
}
function themeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  return `<button class="icon-btn" data-action="theme" aria-label="${dark ? 'Switch to light theme' : 'Switch to dark theme'}">${icon(dark ? 'sun' : 'moon')}</button>`;
}
function showLogin(message = '') {
  admin = null;
  $('#admin-app').innerHTML =
    `<main class="login-page"><section class="login-brand">${logo()}<div><h1>Good stories.<br>Useful details.<br><span>Better decisions.</span></h1><p>The workspace behind Tekkatha. Bring your stories, reviews, and product knowledge together.</p></div><small>Technology, Explained. · Tekkatha CMS</small><div class="login-lines"></div></section><section class="login-form-side">${themeButton()}<form id="login-form" class="login-form"><p class="eyebrow">TEKKATHA CMS</p><h2>Welcome to your workspace.</h2><p>Sign in to manage articles, products and prices.</p><div id="login-error">${message ? '<div class="form-error" role="alert">' + esc(message) + '</div>' : ''}</div><label class="form-label">Email<input name="email" type="email" autocomplete="username" placeholder="Your admin email" required></label><label class="form-label">Password<input name="password" type="password" autocomplete="current-password" placeholder="Your password" required></label><button class="btn" type="submit">${icon('lock')} Sign in to Tekkatha CMS</button>${import.meta.env.DEV ? '<div class="login-help">For the initial local account, open<br><code>D:/tekkatha/.local/admin-credentials.txt</code><br>Credentials are never committed to GitHub.</div>' : ''}</form></section></main>`;
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = e.target.querySelector('button[type="submit"]');
    b.disabled = true;
    $('#login-error').innerHTML = '';
    try {
      const data = new FormData(e.target);
      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: String(data.get('email')).trim(),
          password: String(data.get('password')),
        }),
      });
      admin = result.admin;
      view = 'overview';
      await loadView();
    } catch (error) {
      $('#login-error').innerHTML =
        `<div class="form-error" role="alert">${esc(error.message)}</div>`;
      b.disabled = false;
    }
  });
}
function layout(content) {
  const nav = [
    ['overview', 'Overview', 'grid'],
    ['articles', 'Articles', 'book'],
    ['products', 'Products & prices', 'phone'],
    ['ads', 'Ads & placements', 'external'],
    ['popup', 'Popup notices', 'spark'],
    ['analytics', 'Viewer analytics', 'chart'],
    ['settings', 'Brand settings', 'settings'],
    ...(admin?.role === 'super_admin' ? [['admins', 'Administrators', 'users']] : []),
    ['assistant', 'Tekkatha AI', 'spark'],
  ];
  $('#admin-app').innerHTML =
    `<div class="layout"><aside class="sidebar">${logo()}<span class="workspace-label">${esc(settings?.adminName || 'Tekkatha CMS')} · Editorial workspace</span><nav aria-label="Admin navigation">${nav.map(([id, name, i]) => `<button data-nav="${id}" class="${view === id || view === id + '-editor' ? 'active' : ''}">${icon(i)} ${name}</button>`).join('')}</nav><div class="sidebar-footer"><p class="connection">MongoDB connected</p><a href="${WEBSITE}" target="_blank" rel="noopener noreferrer">View Tekkatha ${icon('external')}</a></div></aside><div class="workspace"><header class="admin-topbar"><span class="top-label">Your editorial workspace</span><div class="top-actions"><a class="btn secondary small" href="${WEBSITE}" target="_blank" rel="noopener noreferrer">View website ${icon('external')}</a>${themeButton()}<div class="admin-user"><span class="admin-avatar">TA</span><span>${esc(admin.name)}<small>${admin.role === 'super_admin' ? 'Super administrator' : 'Administrator'}</small></span></div><button class="icon-btn" data-action="logout" aria-label="Sign out">${icon('logout')}</button></div></header><main class="main-content" id="admin-main">${content}</main></div></div>`;
}
function heading(title, description, action = '') {
  return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
}
async function loadView() {
  if (!admin) return;
  layout('<div class="loading">Loading your workspace…</div>');
  history.replaceState({}, '', ADMIN_HOME + (view === 'overview' ? '' : '#' + view));
  try {
    if (!settings) settings = await api('/settings');
    document.title = settings?.adminName || 'Tekkatha CMS';
    if (view === 'overview') {
      const [s, entries] = await Promise.all([api('/admin/stats'), api('/admin/articles?limit=5')]);
      stats = s;
      records = entries.items;
      layout(dashboard());
    } else if (['articles', 'products'].includes(view)) {
      await loadList();
      layout(listPage());
      bindList();
    } else if (view === 'ads') {
      await adsManager.show();
    } else if (view === 'popup') {
      await popupNoticesManager.show();
    } else if (view === 'analytics') {
      layout(analyticsPage(await api('/admin/analytics?days=30')));
    } else if (view === 'settings') {
      settings = await api('/settings');
      layout(settingsPage());
      bindSettings();
    } else if (view === 'admins' && admin?.role === 'super_admin') {
      const result = await api('/admin/admins');
      layout(adminsPage(result.admins));
      bindAdmins();
    } else if (view === 'assistant') layout(assistantPage());
  } catch (error) {
    if (error.status === 401) return showLogin('Your session has expired. Sign in again.');
    layout(
      heading('The workspace is taking a moment.', 'Check the backend and MongoDB.') +
        `<div class="form-error" role="alert">${esc(error.message)}</div><button class="btn" data-action="retry">Try again</button>`,
    );
  }
}
function dashboard() {
  return (
    heading(
      'Your publication, at a glance.',
      'The stories and product details behind better tech decisions.',
      `<button class="btn" data-create="articles">${icon('plus')} Write a story</button>`,
    ) +
    `<section class="stats">${[
      ['Published stories', stats.published, 'book', 'Visible on Tekkatha'],
      ['Drafts in progress', stats.drafts, 'edit', 'Ready when you are'],
      ['Catalog products', stats.products, 'phone', 'Stored in MongoDB'],
      [
        'Archived entries',
        stats.archivedArticles + stats.archivedProducts,
        'archive',
        'Recoverable from the lists',
      ],
    ]
      .map(
        ([n, v, i, description]) =>
          `<div class="stat"><span class="stat-label">${n}${icon(i)}</span><strong>${v}</strong><small>${description}</small></div>`,
      )
      .join(
        '',
      )}</section><div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>Recently updated</h2><button class="btn secondary small" data-nav="articles">All articles ${icon('arrow')}</button></div>${records.length ? records.map((a) => `<div class="recent-row"><div><strong>${esc(a.title)}</strong><small>${esc(a.category)} · ${date(a.updatedAt)}</small></div><span class="pill ${a.status}">${a.status}</span></div>`).join('') : '<div class="empty"><h2>The next story starts with you.</h2><p>Create an article to begin.</p></div>'}</section><section class="panel"><div class="panel-head"><h2>Ready for the next decision</h2></div><div class="panel-content"><div class="checklist"><div>${icon('check')}<span>Articles and products are saved in the shared MongoDB database.</span></div><div>${icon('check')}<span>Draft articles stay private until you publish them.</span></div><div>${icon('check')}<span>Every price has a verification label and optional retailer source.</span></div><div>${icon('check')}<span>Archived content can be restored without losing its details.</span></div></div></div></section></div>`
  );
}
async function loadList() {
  const params = new URLSearchParams({
    page: String(page),
    limit: '20',
    q: query,
    archived: String(archived),
  });
  if (view === 'articles' && status !== 'all') params.set('status', status);
  const data = await api('/admin/' + view + '?' + params);
  records = data.items;
  total = data.total;
}
function listPage() {
  const article = view === 'articles';
  return (
    heading(
      article ? 'Make every story useful.' : 'The details behind the decision.',
      article
        ? 'Create, edit and publish articles. Drafts are visible only in the CMS.'
        : 'Manage specifications, price records and local availability.',
      `<button class="btn" data-create="${view}">${icon('plus')} ${article ? 'New article' : 'Add product'}</button>`,
    ) +
    `<div class="list-toolbar"><label class="search-input">${icon('search')}<input type="search" id="list-query" aria-label="Search ${view}" placeholder="Search ${article ? 'headlines or categories' : 'products or brands'}…" value="${esc(query)}"></label><div class="list-filters">${
      article
        ? `<select id="list-status" aria-label="Article status">${[
            ['all', 'All statuses'],
            ['published', 'Published'],
            ['draft', 'Drafts'],
          ]
            .map(([v, t]) => `<option value="${v}" ${status === v ? 'selected' : ''}>${t}</option>`)
            .join('')}</select>`
        : ''
    }<label class="check-label"><input id="list-archived" type="checkbox" ${archived ? 'checked' : ''}> Show archive</label></div></div><section class="panel"><div id="list-results">${listResults()}</div></section>`
  );
}
function listResults() {
  const article = view === 'articles';
  return `${records.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>${article ? 'ARTICLE' : 'PRODUCT'}</th><th>${article ? 'CATEGORY' : 'PRICE'}</th><th>${article ? 'STATUS' : 'VERIFICATION'}</th><th>UPDATED</th><th style="text-align:right">ACTIONS</th></tr></thead><tbody>${records.map((r) => `<tr><td>${article ? `<strong>${esc(r.title)}</strong><small>${esc(r.author)}</small>` : `<div class="product-cell"><img src="${esc(r.image)}" alt=""><div><strong>${esc(r.brand)} ${esc(r.name)}</strong><small>${esc(r.variant)}</small></div></div>`}</td><td>${article ? esc(r.category) : money(r.price)}</td><td><span class="pill ${archived ? 'archived' : article ? r.status : r.priceStatus}">${archived ? 'Archived' : article ? r.status : esc(r.priceStatus)}</span></td><td><span class="muted">${date(r.updatedAt)}</span></td><td><div class="row-actions">${archived ? `<button class="icon-btn" data-restore="${esc(r.id)}" aria-label="Restore ${esc(article ? r.title : r.name)}">${icon('restore')}</button>` : `<button class="icon-btn" data-edit="${esc(r.id)}" aria-label="Edit ${esc(article ? r.title : r.name)}">${icon('edit')}</button><button class="icon-btn" data-archive="${esc(r.id)}" aria-label="Archive ${esc(article ? r.title : r.name)}">${icon('archive')}</button>`}</div></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty"><h2>${archived ? 'Nothing in the archive.' : 'No matching entries.'}</h2><p>${archived ? 'Archived content will appear here and can be restored.' : 'Try another search or create a new entry.'}</p></div>`}<div class="pagination"><span>${total} entries · Page ${page} of ${Math.max(1, Math.ceil(total / 20))}</span><div><button class="btn secondary small" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Previous</button><button class="btn secondary small" data-page="${page + 1}" ${page * 20 >= total ? 'disabled' : ''}>Next</button></div></div>`;
}
function bindList() {
  $('#list-query').addEventListener('input', (e) => {
    query = e.target.value;
    page = 1;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(refreshList, 250);
  });
  $('#list-status')?.addEventListener('change', (e) => {
    status = e.target.value;
    page = 1;
    refreshList();
  });
  $('#list-archived').addEventListener('change', (e) => {
    archived = e.target.checked;
    page = 1;
    refreshList();
  });
}
async function refreshList() {
  try {
    await loadList();
    if ($('#list-results')) $('#list-results').innerHTML = listResults();
  } catch (error) {
    notice(error.message);
  }
}
function field(label, name, value = '', options = {}) {
  const {
    type = 'text',
    required = false,
    wide = false,
    disabled = false,
    hint = '',
    list = null,
    rows = 3,
    min,
    max,
    step = type === 'number' ? '1' : undefined,
  } = options;
  return `<label class="form-label ${wide ? 'wide' : ''}">${label}${
    list
      ? `<select name="${name}" ${disabled ? 'disabled' : ''}>${list
          .map((x) => {
            const [v, t] = Array.isArray(x) ? x : [x, x];
            return `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(t)}</option>`;
          })
          .join('')}</select>`
      : type === 'textarea'
        ? `<textarea name="${name}" rows="${rows}" ${required ? 'required' : ''} ${disabled ? 'disabled' : ''} ${max ? 'maxlength="' + max + '"' : ''}>${esc(value)}</textarea>`
        : `<input name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''} ${disabled ? 'disabled' : ''} ${min !== undefined ? 'min="' + min + '"' : ''} ${type === 'number' && max ? 'max="' + max + '"' : ''} ${type !== 'number' && max ? 'maxlength="' + max + '"' : ''} ${step ? 'step="' + step + '"' : ''}>`
  }${hint ? `<small>${hint}</small>` : ''}</label>`;
}
async function openEditor(collection, id) {
  view = collection + '-editor';
  editing = id ? records.find((r) => r.id === id) : null;
  if (collection === 'products' && id) {
    try {
      editing = await api('/products/' + encodeURIComponent(id));
    } catch (error) {
      notice(error.message);
      view = 'products';
      return loadView();
    }
  }
  if (collection === 'articles') {
    try {
      productOptions = (await api('/admin/products?limit=100')).items;
    } catch {
      productOptions = [];
    }
  }
  layout(collection === 'articles' ? articleEditor() : productEditor());
  bindEditor(collection);
  window.scrollTo(0, 0);
  history.replaceState({}, '', ADMIN_HOME + '#' + view);
}
function productImageField(
  image,
  { label = 'Device image', previewAlt = 'Current device image', allowGif = false } = {},
) {
  const uploaded = image.startsWith('data:image/');
  return `<div class="device-image-field wide"><span class="form-label">${esc(label)}</span><div class="device-image-upload"><div class="device-image-preview"><img id="device-image-preview" ${image ? 'src="' + esc(image) + '"' : 'hidden'} alt="${esc(previewAlt)}"></div><div><label class="form-label" for="device-image-file">Upload from your computer<input id="device-image-file" type="file" accept="image/jpeg,image/png,image/webp${allowGif ? ',image/gif,.gif,.gof' : ''}" data-image-control aria-describedby="device-image-help device-image-status"></label><p id="device-image-help">JPEG, PNG, or WebP · up to 12 MB. Automatically resized and compressed to 350 KB or less.${allowGif ? ' GIF (.gif or .gof): up to 2 MB; animation is preserved.' : ''}</p><p id="device-image-status" role="status">${uploaded ? 'Uploaded image saved with this record.' : image ? 'Current image shown in the preview.' : 'Upload an image or enter its URL.'}</p><p id="device-image-error" role="alert" hidden></p></div></div><input type="hidden" name="image" value="${esc(image)}">${field('Or use an image URL / asset path', 'imageUrl', uploaded ? '' : image, { max: 2000, hint: 'A new upload replaces this URL. Save your changes to apply the selected image.' })}</div>`;
}

function bindProductImage(form, { allowGif = false } = {}) {
  const fileInput = $('#device-image-file', form);
  const urlInput = form.elements.imageUrl;
  const imageInput = form.elements.image;
  const preview = $('#device-image-preview', form);
  const status = $('#device-image-status', form);
  const error = $('#device-image-error', form);
  urlInput.dataset.imageControl = '';

  preview.addEventListener('error', () => {
    preview.hidden = true;
  });
  const showPreview = (image) => {
    preview.hidden = !image;
    if (image) preview.src = image;
    else preview.removeAttribute('src');
  };
  urlInput.addEventListener('input', () => {
    imageInput.value = urlInput.value.trim();
    fileInput.value = '';
    error.hidden = true;
    const valid = /^(https?:\/\/|\/assets\/)/i.test(imageInput.value);
    showPreview(valid ? imageInput.value : '');
    status.textContent = valid
      ? 'Image URL selected. Save your changes to apply it.'
      : 'Enter an image URL or upload a device image.';
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file || form.dataset.saving === 'true' || form.dataset.imageProcessing === 'true') return;
    form.dataset.imageProcessing = 'true';
    const controls = [...form.querySelectorAll('[data-image-control], button[type="submit"]')];
    controls.forEach((control) => (control.disabled = true));
    error.hidden = true;
    status.textContent =
      allowGif && isGifUpload(file) ? 'Reading animated GIF…' : 'Compressing image…';
    try {
      const compressed = await (allowGif ? prepareAdImage(file) : compressProductImage(file));
      if (!form.isConnected) return;
      imageInput.value = compressed.text;
      urlInput.value = '';
      showPreview(compressed.text);
      status.textContent = `${file.name}: ${compressed.animated ? Math.ceil(compressed.bytes / 1024) + ' KB · GIF animation preserved' : Math.ceil(file.size / 1024) + ' KB → ' + Math.ceil(compressed.bytes / 1024) + ' KB'} · ${compressed.width} × ${compressed.height}. Save your changes to apply this image.`;
    } catch (uploadError) {
      if (!form.isConnected) return;
      error.textContent = uploadError.message;
      error.hidden = false;
      status.textContent = 'The current image has been kept.';
    } finally {
      form.dataset.imageProcessing = 'false';
      fileInput.value = '';
      if (form.dataset.saving !== 'true') controls.forEach((control) => (control.disabled = false));
    }
  });
}
function articleGuideProductPicker(article) {
  const guideById = new Map(
    (article.guideProducts || []).map((item) => [item.productId, item.description || '']),
  );
  for (const productId of article.productIds || []) {
    if (!guideById.has(productId)) guideById.set(productId, '');
  }
  if (!productOptions.length)
    return '<p class="muted">No products are available yet. Create products first, then return to this post.</p>';
  return productOptions
    .map((product, index) => {
      const selected = guideById.has(product.id);
      const description = guideById.get(product.id) || '';
      return `<div class="article-product-option ${selected ? 'selected' : ''}" data-guide-product><label class="article-product-choice" for="guide-product-${index}"><input id="guide-product-${index}" type="checkbox" name="productIds" value="${esc(product.id)}" ${selected ? 'checked' : ''}><span><strong>${esc(product.brand)} ${esc(product.name)}</strong><small>${esc(product.variant || 'Base configuration')} · ${money(product.price)}</small></span></label><div class="article-product-description"><label for="guide-description-${index}">Description in this guide</label><textarea id="guide-description-${index}" data-guide-description rows="4" maxlength="8000" ${selected ? '' : 'disabled'} placeholder="Explain why this device is included and who it suits.">${esc(description)}</textarea><small>Optional. If left blank, the product overview or long description is used.</small></div></div>`;
    })
    .join('');
}
function articleEditor() {
  const a = editing || {
    title: '',
    category: 'Technology News',
    excerpt: '',
    image:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85',
    read: 5,
    author: admin.name,
    kind: 'Article',
    status: 'draft',
    isSample: false,
    body: [],
    productIds: [],
    guideProducts: [],
  };
  return (
    heading(
      editing ? 'Shape the next story.' : 'Start with a useful story.',
      'Save a private draft, or publish it to Tekkatha.',
      `<button class="btn secondary" data-nav="articles">Back to articles</button>`,
    ) +
    `<form id="editor-form"><div id="editor-error"></div><div class="editor-grid"><div><section class="form-panel"><h2>The story essentials</h2>${field('Headline', 'title', a.title, { required: true, max: 180 })}${field('Summary', 'excerpt', a.excerpt, { type: 'textarea', max: 400 })}<div class="form-grid">${field('Category', 'category', a.category, { list: categories })}${field('Content type', 'kind', a.kind, { list: ['Article', 'Guide', 'Explainer', 'Review', 'Product overview', 'Review checklist'] })}${field('Author', 'author', a.author, { required: true, max: 100 })}${field('Reading time (minutes)', 'read', a.read, { type: 'number', required: true, min: 1 })}</div>${field('Cover image URL', 'image', a.image, { required: true, hint: 'Use an HTTP(S) image URL or a /assets/ path.' })}</section><section class="form-panel"><h2>The article</h2>${field('Story', 'bodyText', a.body.map((s) => '## ' + s.heading + '\n' + s.text).join('\n\n'), { type: 'textarea', required: true, rows: 15, hint: 'Begin each section with ## Heading, followed by its text. Plain text without a heading becomes an Overview section.' })}</section><section class="form-panel"><h2>Devices in this buying guide</h2><p class="muted">Select every device included in the guide and add the description readers should see. The public post will build a detailed device section and final comparison box from these records.</p><div class="article-product-picker">${articleGuideProductPicker(a)}</div></section></div><aside class="editor-sidebar"><section class="form-panel"><h2>Publication</h2><p>Published stories appear on the public website. Drafts are accessible only to signed-in administrators.</p>${field(
      'Status',
      'status',
      a.status,
      {
        list: [
          ['draft', 'Draft'],
          ['published', 'Published'],
        ],
      },
    )}<label class="check-label"><input name="isSample" type="checkbox" ${a.isSample ? 'checked' : ''}> Label this as sample editorial content</label><button class="btn secondary" type="button" data-save-status="draft">${icon('edit')} Save draft</button><button class="btn" type="submit">${icon('check')} ${editing ? 'Save changes' : 'Save article'}</button><p>Changes are saved to MongoDB. Refresh the public website to see newly published content.</p></section></aside></div></form>`
  );
}
let reviewBlockCounter = 0;
function reviewBlocksForEditor(product) {
  if (Array.isArray(product.reviewBlocks) && product.reviewBlocks.length)
    return product.reviewBlocks;
  if (product.review?.trim())
    return [{ type: 'text', heading: '', text: product.review }];
  return [];
}
function reviewBlockEditor(block = { type: 'text', heading: '', text: '' }) {
  const index = reviewBlockCounter++;
  const controls = `<div class="review-block-controls"><button type="button" class="icon-btn" data-review-move="up" aria-label="Move this review block up">↑</button><button type="button" class="icon-btn" data-review-move="down" aria-label="Move this review block down">↓</button><button type="button" class="icon-btn danger" data-remove-review-block aria-label="Remove this review block">${icon('close')}</button></div>`;
  if (block.type === 'image') {
    const image = block.image || '';
    const uploaded = image.startsWith('data:image/');
    const url = uploaded ? '' : image;
    return `<article class="review-editor-block review-image-editor" data-review-block="image"><div class="review-block-head"><div><span>Review image</span><small>Positioned here in the published review</small></div>${controls}</div><div class="review-image-editor-grid"><div class="review-image-editor-preview"><img data-review-image-preview ${image ? 'src="' + esc(image) + '"' : 'hidden'} alt="Review image preview"></div><div><label class="form-label">Upload from your computer<input type="file" accept="image/jpeg,image/png,image/webp" data-review-image-file></label><p class="review-image-status" data-review-image-status role="status">${uploaded ? 'Uploaded image saved with this review.' : image ? 'Current image URL shown in the preview.' : 'Upload an image or enter its URL.'}</p><p class="review-image-error" data-review-image-error role="alert" hidden></p></div></div><input type="hidden" data-review-image-value value="${esc(image)}"><div class="form-grid review-image-fields"><label class="form-label wide">Image URL or asset path<input type="text" data-review-image-url value="${esc(url)}" maxlength="2000" ${uploaded ? '' : 'required'} placeholder="https://… or /assets/…"><small>A new upload replaces this URL.</small></label><label class="form-label wide">Alternative text<input type="text" data-review-image-alt value="${esc(block.alt || '')}" maxlength="200" required placeholder="Describe what the image shows"><small>Required for accessibility and image search.</small></label><label class="form-label wide">Caption<input type="text" data-review-image-caption value="${esc(block.caption || '')}" maxlength="400" placeholder="Optional context shown below the image"></label></div></article>`;
  }
  return `<article class="review-editor-block review-text-editor" data-review-block="text"><div class="review-block-head"><div><span>Text section</span><small>Detailed review copy</small></div>${controls}</div><label class="form-label">Section heading<input type="text" data-review-heading value="${esc(block.heading || '')}" maxlength="200" placeholder="Example: Camera performance"></label><label class="form-label">Review text<textarea data-review-text rows="9" maxlength="30000" required placeholder="Write the detailed review for this section…">${esc(block.text || '')}</textarea><small>Blank lines create separate paragraphs.</small></label></article>`;
}
function productReviewEditor(product) {
  const blocks = reviewBlocksForEditor(product);
  return `<section class="form-panel product-review-editor"><div class="review-editor-title"><div><h2>Detailed product review</h2><p>Build the review in order. Add text sections and place uploaded images between them wherever they belong.</p></div><div class="review-editor-add"><button type="button" class="btn secondary small" data-add-review-text>${icon('plus')} Add text</button><button type="button" class="btn secondary small" data-add-review-image>${icon('plus')} Add image</button></div></div><div id="product-review-blocks" class="review-editor-list">${blocks.map(reviewBlockEditor).join('')}</div><div class="review-editor-empty" ${blocks.length ? 'hidden' : ''}>Add a text section to begin the detailed review.</div></section>`;
}
function productEditor() {
  const p = editing || {
    brand: '',
    name: '',
    type: 'Smartphones',
    price: 0,
    priceStatus: 'unverified',
    priceSource: '',
    priceCheckedAt: '',
    availability: 'unverified',
    variant: '',
    image: '/assets/phone.svg',
    display: '',
    processor: '',
    battery: '',
    memory: '',
    storage: '',
    camera: '',
    source: '',
    note: '',
    variants: [],
    description: '',
    review: '',
    reviewBlocks: [],
  };
  const checked = p.priceCheckedAt
    ? new Date(
        new Date(p.priceCheckedAt).getTime() -
          new Date(p.priceCheckedAt).getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : '';
  return (
    heading(
      editing ? 'Keep the details accurate.' : 'Add the next product.',
      'Specifications, price context and availability in one record.',
      `<button class="btn secondary" data-nav="products">Back to products</button>`,
    ) +
    `<form id="editor-form"><div id="editor-error"></div><div class="editor-grid"><div><section class="form-panel"><h2>Product essentials</h2><div class="form-grid">${field('Brand', 'brand', p.brand, { required: true, max: 80 })}${field('Product name', 'name', p.name, { required: true, max: 120 })}${field('Category', 'type', p.type, { list: types })}${field('Configuration / variant', 'variant', p.variant, { max: 150, hint: 'Keep Brand and Product name identical for each configuration. Tekkatha groups matching variants together on the product page.' })}${productImageField(p.image)}${field('Short overview', 'note', p.note, { type: 'textarea', wide: true, max: 600 })}</div></section><section class="form-panel"><h2>Specifications</h2><div class="form-grid">${[
      ['Display', 'display'],
      ['Processor', 'processor'],
      ['RAM / memory', 'memory'],
      ['Storage', 'storage'],
      ['Battery', 'battery'],
      ['Camera', 'camera'],
    ]
      .map(([n, k]) => field(n, k, p[k], { max: 200 }))
      .join(
        '',
      )}${field('Manufacturer specification URL', 'source', p.source, { type: 'url', wide: true })}</div></section><section class="form-panel"><h2>Long product description</h2>${field('Device details', 'description', p.description || '', { type: 'textarea', rows: 12, max: MAX_PRODUCT_CONTENT_TEXT, hint: 'Explain the design, features, specifications, and other device details. Up to 100,000 characters. Use a blank line between paragraphs; line breaks are preserved.' })}</section>${productReviewEditor(p)}</div><aside class="editor-sidebar"><section class="form-panel"><h2>Nepal price record</h2>${field('Price (NPR)', 'price', p.price, { type: 'number', required: true, min: 0 })}${field(
      'Price verification',
      'priceStatus',
      p.priceStatus,
      {
        list: [
          ['unverified', 'Unverified'],
          ['sample', 'Illustrative / sample'],
          ['verified', 'Retailer source recorded'],
        ],
      },
    )}${field('Buy now / retailer URL', 'priceSource', p.priceSource, { type: 'url', hint: 'Visitors use this link to open the seller’s website. It is also required for a verified price.' })}${field('Date and time checked (local time)', 'priceCheckedAt', checked, { type: 'datetime-local' })}${field(
      'Local availability',
      'availability',
      p.availability,
      {
        list: [
          ['unverified', 'Unverified'],
          ['in-stock', 'In stock'],
          ['out-of-stock', 'Out of stock'],
        ],
      },
    )}<p>Record the exact configuration, retailer source and time checked. This label does not replace independent price verification.</p><button class="btn" type="submit">${icon('check')} Save product</button></section></aside></div></form>`
  );
}
function productVariantDate(value) {
  if (!value) return '';
  const dateValue = new Date(value);
  return new Date(dateValue.getTime() - dateValue.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function productVariantEditorSection() {
  const variants = editing?.variants || [];
  const row = (variant = {}) => `<div class="product-variant-row" data-variant-row><div class="variant-row-head"><strong>Additional variant</strong><button type="button" class="icon-btn" data-remove-variant aria-label="Remove variant">${icon('close')}</button></div><div class="form-grid">${field('Variant name', 'variantLabel', variant.label || '', { required: true, max: 150, hint: 'Example: 12GB RAM · 256GB storage' })}${field('Price (NPR)', 'variantPrice', variant.price ?? 0, { type: 'number', required: true, min: 0 })}${field('Price verification', 'variantPriceStatus', variant.priceStatus || 'unverified', { list: [['unverified', 'Unverified'], ['sample', 'Illustrative / sample'], ['verified', 'Retailer source recorded']] })}${field('Buy now / retailer URL', 'variantPriceSource', variant.priceSource || '', { type: 'url' })}${field('Date checked', 'variantPriceCheckedAt', productVariantDate(variant.priceCheckedAt), { type: 'datetime-local' })}${field('Availability', 'variantAvailability', variant.availability || 'unverified', { list: [['unverified', 'Unverified'], ['in-stock', 'In stock'], ['out-of-stock', 'Out of stock']] })}</div></div>`;
  return `<section class="form-panel product-variants-editor"><div class="panel-head"><h2>Variants and prices</h2><button type="button" class="btn secondary small" data-add-variant>${icon('plus')} Add variant</button></div><p class="muted">Keep the primary configuration above as the default. Add each other memory or storage option here; visitors will see every option on the same product page.</p><div id="product-variant-list">${variants.map(row).join('')}</div><p class="muted">Each variant needs its own price. Verified prices also need a retailer URL and date checked.</p></section>`;
}
const productEditorBase = productEditor;
productEditor = () => productEditorBase().replace(
  '</section><section class="form-panel"><h2>Specifications</h2>',
  '</section>' + productVariantEditorSection() + '<section class="form-panel"><h2>Specifications</h2>',
);
function bindProductVariants(form) {
  const list = form.querySelector('#product-variant-list');
  if (!list) return;
  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-add-variant]')) {
      const html = `<div class="product-variant-row" data-variant-row><div class="variant-row-head"><strong>Additional variant</strong><button type="button" class="icon-btn" data-remove-variant aria-label="Remove variant">${icon('close')}</button></div><div class="form-grid">${field('Variant name', 'variantLabel', '', { required: true, max: 150, hint: 'Example: 12GB RAM · 256GB storage' })}${field('Price (NPR)', 'variantPrice', 0, { type: 'number', required: true, min: 0 })}${field('Price verification', 'variantPriceStatus', 'unverified', { list: [['unverified', 'Unverified'], ['sample', 'Illustrative / sample'], ['verified', 'Retailer source recorded']] })}${field('Buy now / retailer URL', 'variantPriceSource', '', { type: 'url' })}${field('Date checked', 'variantPriceCheckedAt', '', { type: 'datetime-local' })}${field('Availability', 'variantAvailability', 'unverified', { list: [['unverified', 'Unverified'], ['in-stock', 'In stock'], ['out-of-stock', 'Out of stock']] })}</div></div>`;
      list.insertAdjacentHTML('beforeend', html);
    }
    if (event.target.closest('[data-remove-variant]')) event.target.closest('[data-variant-row]')?.remove();
  });
}
function bindProductReview(form) {
  const list = form.querySelector('#product-review-blocks');
  if (!list) return;
  const empty = form.querySelector('.review-editor-empty');
  const updateEmpty = () => (empty.hidden = !!list.children.length);
  const appendBlock = (block) => {
    list.insertAdjacentHTML('beforeend', reviewBlockEditor(block));
    updateEmpty();
    list.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-add-review-text]')) {
      appendBlock({ type: 'text', heading: '', text: '' });
      return;
    }
    if (event.target.closest('[data-add-review-image]')) {
      appendBlock({ type: 'image', image: '', alt: '', caption: '' });
      return;
    }
    const block = event.target.closest('[data-review-block]');
    if (!block) return;
    if (event.target.closest('[data-remove-review-block]')) {
      block.remove();
      updateEmpty();
      return;
    }
    const move = event.target.closest('[data-review-move]')?.dataset.reviewMove;
    if (move === 'up' && block.previousElementSibling)
      list.insertBefore(block, block.previousElementSibling);
    if (move === 'down' && block.nextElementSibling)
      list.insertBefore(block.nextElementSibling, block);
  });
  form.addEventListener('input', (event) => {
    if (!event.target.matches('[data-review-image-url]')) return;
    const block = event.target.closest('[data-review-block="image"]');
    const value = event.target.value.trim();
    block.querySelector('[data-review-image-value]').value = value;
    block.querySelector('[data-review-image-file]').value = '';
    event.target.required = true;
    const preview = block.querySelector('[data-review-image-preview]');
    const valid = /^(https?:\/\/|\/assets\/)/i.test(value);
    preview.hidden = !valid;
    if (valid) preview.src = value;
    else preview.removeAttribute('src');
    block.querySelector('[data-review-image-status]').textContent = valid
      ? 'Image URL selected. Save the product to apply it.'
      : 'Upload an image or enter its URL.';
  });
  form.addEventListener('error', (event) => {
    if (event.target.matches('[data-review-image-preview]')) event.target.hidden = true;
  }, true);
  form.addEventListener('change', async (event) => {
    if (!event.target.matches('[data-review-image-file]')) return;
    const fileInput = event.target;
    const file = fileInput.files[0];
    if (!file || form.dataset.saving === 'true') return;
    const block = fileInput.closest('[data-review-block="image"]');
    const status = block.querySelector('[data-review-image-status]');
    const error = block.querySelector('[data-review-image-error]');
    const controls = [...form.querySelectorAll('[data-review-image-file], button[type="submit"]')];
    form.dataset.reviewImagesProcessing = String(
      Number(form.dataset.reviewImagesProcessing || 0) + 1,
    );
    controls.forEach((control) => (control.disabled = true));
    error.hidden = true;
    status.textContent = 'Compressing review image…';
    try {
      const compressed = await compressProductImage(file);
      if (!block.isConnected) return;
      block.querySelector('[data-review-image-value]').value = compressed.text;
      const urlInput = block.querySelector('[data-review-image-url]');
      urlInput.value = '';
      urlInput.required = false;
      const preview = block.querySelector('[data-review-image-preview]');
      preview.src = compressed.text;
      preview.hidden = false;
      status.textContent = `${file.name}: ${Math.ceil(file.size / 1024)} KB → ${Math.ceil(compressed.bytes / 1024)} KB · ${compressed.width} × ${compressed.height}. Save the product to apply this image.`;
    } catch (uploadError) {
      if (!block.isConnected) return;
      error.textContent = uploadError.message;
      error.hidden = false;
      status.textContent = 'The current review image has been kept.';
    } finally {
      form.dataset.reviewImagesProcessing = String(
        Math.max(0, Number(form.dataset.reviewImagesProcessing || 1) - 1),
      );
      fileInput.value = '';
      if (form.dataset.reviewImagesProcessing === '0' && form.dataset.saving !== 'true')
        controls.forEach((control) => (control.disabled = false));
    }
  });
}
function parseBody(text) {
  const sections = [];
  let heading = 'Overview',
    lines = [];
  const flush = () => {
    const body = lines.join('\n').trim();
    if (body) sections.push({ heading, text: body });
  };
  for (const line of text.split('\n')) {
    if (/^##\s+/.test(line)) {
      flush();
      heading = line.replace(/^##\s+/, '').trim() || 'Overview';
      lines = [];
    } else lines.push(line);
  }
  flush();
  return sections;
}
function bindGuideProducts(form) {
  form.querySelectorAll('[data-guide-product]').forEach((card) => {
    const checkbox = card.querySelector('input[name="productIds"]');
    const description = card.querySelector('[data-guide-description]');
    const update = () => {
      card.classList.toggle('selected', checkbox.checked);
      description.disabled = !checkbox.checked;
    };
    checkbox.addEventListener('change', update);
    update();
  });
}
function bindEditor(collection) {
  if (collection === 'products') bindProductImage($('#editor-form'));
  if (collection === 'products') bindProductVariants($('#editor-form'));
  if (collection === 'products') bindProductReview($('#editor-form'));
  if (collection === 'articles') bindGuideProducts($('#editor-form'));
  $('#editor-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveEditor(collection);
  });
  document.querySelectorAll('[data-save-status]').forEach((b) =>
    b.addEventListener('click', () => {
      const form = $('#editor-form');
      form.elements.status.value = b.dataset.saveStatus;
      if (form.reportValidity()) saveEditor(collection);
    }),
  );
}
async function saveEditor(collection) {
  const form = $('#editor-form');
  if (form.dataset.saving === 'true') return;
  if (form.dataset.imageProcessing === 'true') {
    notice('Please wait for the image to finish compressing.');
    return;
  }
  if (Number(form.dataset.reviewImagesProcessing || 0) > 0) {
    notice('Please wait for the review image to finish compressing.');
    return;
  }
  if (!form.reportValidity()) return;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  let value;
  if (collection === 'articles') {
    const guideProducts = [...form.querySelectorAll('[data-guide-product]')]
      .filter((card) => card.querySelector('input[name="productIds"]')?.checked)
      .map((card) => ({
        productId: card.querySelector('input[name="productIds"]').value,
        description: card.querySelector('[data-guide-description]').value.trim(),
      }));
    value = {
      title: data.title.trim(),
      category: data.category,
      excerpt: data.excerpt.trim(),
      image: data.image.trim(),
      read: Number(data.read),
      author: data.author.trim(),
      kind: data.kind,
      status: data.status,
      isSample: form.elements.isSample.checked,
      body: parseBody(data.bodyText),
      productIds: guideProducts.map((item) => item.productId),
      guideProducts,
    };
  } else {
    value = {};
    for (const key of [
      'brand',
      'name',
      'type',
      'priceStatus',
      'availability',
      'variant',
      'image',
      'display',
      'processor',
      'battery',
      'memory',
      'storage',
      'camera',
      'source',
      'note',
      'priceSource',
    ])
      value[key] = String(data[key] || '').trim();
    value.price = Number(data.price);
    value.description = String(data.description || '');
    value.reviewBlocks = [...form.querySelectorAll('[data-review-block]')]
      .map((block) => {
        if (block.dataset.reviewBlock === 'image')
          return {
            type: 'image',
            image: block.querySelector('[data-review-image-value]').value.trim(),
            alt: block.querySelector('[data-review-image-alt]').value.trim(),
            caption: block.querySelector('[data-review-image-caption]').value.trim(),
          };
        return {
          type: 'text',
          heading: block.querySelector('[data-review-heading]').value.trim(),
          text: block.querySelector('[data-review-text]').value.trim(),
        };
      })
      .filter((block) =>
        block.type === 'image' ? block.image : block.heading || block.text,
      );
    value.review = value.reviewBlocks
      .filter((block) => block.type === 'text')
      .map((block) => `${block.heading ? block.heading + '\n' : ''}${block.text}`)
      .join('\n\n')
      .slice(0, MAX_PRODUCT_CONTENT_TEXT);
    value.priceCheckedAt = data.priceCheckedAt ? new Date(data.priceCheckedAt).toISOString() : '';
    value.variants = [...form.querySelectorAll('[data-variant-row]')]
      .map((row) => {
        const read = (name) => row.querySelector(`[name="${name}"]`)?.value?.trim() || '';
        const checkedAt = read('variantPriceCheckedAt');
        return {
          label: read('variantLabel'),
          price: Number(read('variantPrice')),
          priceStatus: read('variantPriceStatus'),
          priceSource: read('variantPriceSource'),
          priceCheckedAt: checkedAt ? new Date(checkedAt).toISOString() : '',
          availability: read('variantAvailability'),
        };
      })
      .filter((variant) => variant.label);
  }
  const buttons = [...form.querySelectorAll('button')];
  const imageControls = [...form.querySelectorAll('[data-image-control]')];
  form.dataset.saving = 'true';
  buttons.forEach((b) => (b.disabled = true));
  imageControls.forEach((control) => (control.disabled = true));
  $('#editor-error').innerHTML = '';
  try {
    const result = await api(
      '/admin/' + collection + (editing ? '/' + encodeURIComponent(editing.id) : ''),
      { method: editing ? 'PUT' : 'POST', body: JSON.stringify(value) },
    );
    view = collection;
    query = '';
    page = 1;
    archived = false;
    await loadView();
    notice(
      collection === 'articles'
        ? result.status === 'published'
          ? 'Article saved and published.'
          : 'Draft saved to MongoDB.'
        : 'Product saved to MongoDB.',
    );
  } catch (error) {
    const errorBox = $('#editor-error', form);
    errorBox.innerHTML = `<div class="form-error" role="alert">${esc(error.message)}</div>`;
    if (form.isConnected) errorBox.scrollIntoView({ block: 'center' });
  } finally {
    form.dataset.saving = 'false';
    buttons.forEach((b) => (b.disabled = false));
    imageControls.forEach((control) => (control.disabled = false));
  }
}
function settingsPage() {
  const s = settings;
  const markup = (
    heading('A consistent Tekkatha.', 'The shared identity behind your publication.') +
    `<div class="settings-notice">Brand settings are saved in MongoDB. Email addresses remain naming placeholders until actual mailboxes are configured.</div><form id="settings-form" class="settings-form"><div id="settings-error"></div><section class="form-panel"><h2>Publication identity</h2><div class="form-grid">${field('Website name', 'siteName', s.siteName, { required: true, max: 60 })}${field('Default tagline', 'tagline', s.tagline, { required: true, max: 120 })}${field('SEO description', 'description', s.description, { required: true, type: 'textarea', wide: true, max: 400 })}${field('Primary brand color', 'primaryColor', s.primaryColor, { type: 'color', required: true })}${field('Admin workspace name', 'adminName', s.adminName, { required: true, max: 60 })}${field('Assistant name', 'aiName', s.aiName, { required: true, max: 60 })}</div></section><section class="form-panel"><h2>Contact naming</h2><div class="form-grid">${[
      ['General contact', 'contactEmail'],
      ['Editorial', 'editorialEmail'],
      ['Advertising', 'advertiseEmail'],
      ['Support', 'supportEmail'],
    ]
      .map(([n, k]) => field(n, k, s[k], { type: 'email', required: true }))
      .join(
        '',
    )}</div></section><section class="form-panel seo-panel"><h2>Footer SEO code</h2><p class="seo-help">Tekkatha automatically adds Organization, WebSite, and WebPage structured data below the footer. Page titles, descriptions, and canonical URLs update as readers navigate.</p><details class="seo-preview"><summary>View the automatic SEO HTML</summary><pre><code>${esc(buildSeoMarkup({ settings: s, url: WEBSITE, title: s.siteName + ' — Tech News, Reviews, Prices & Buying Guides' }))}</code></pre></details>${field('Additional SEO HTML & scripts', 'footerSeoCode', s.footerSeoCode || '', { type: 'textarea', rows: 12, max: MAX_FOOTER_SEO_CODE, disabled: admin?.role !== 'super_admin', hint: admin?.role === 'super_admin' ? 'Super administrator access only. This code is inserted into the public website and can run scripts for every visitor. Up to 50,000 characters.' : 'Only a super administrator can change public site scripts.' })}</section><button class="btn" type="submit">${icon('check')} Save brand settings</button></form>`
  );
  return markup;
}
function bindSettings() {
  $('#settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = e.target.querySelector('button[type="submit"]');
    b.disabled = true;
    $('#settings-error').innerHTML = '';
    try {
      const value = Object.fromEntries(new FormData(e.target));
      if (admin?.role !== 'super_admin') value.footerSeoCode = settings.footerSeoCode || '';
      settings = await api('/admin/settings', { method: 'PUT', body: JSON.stringify(value) });
      notice('Brand settings saved. Refresh the website to see the changes.');
    } catch (error) {
      $('#settings-error').innerHTML =
        `<div class="form-error" role="alert">${esc(error.message)}</div>`;
    } finally {
      b.disabled = false;
    }
  });
}
function formatDuration(seconds) {
  const value = Number(seconds) || 0;
  return value < 60 ? `${value}s` : `${Math.floor(value / 60)}m ${value % 60}s`;
}
function analyticsTable(title, rows, empty = 'No visits recorded yet.') {
  return `<section class="panel analytics-table"><div class="panel-head"><h2>${title}</h2></div>${rows.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>ITEM</th><th style="text-align:right">VIEWS</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${esc(row.label)}</td><td style="text-align:right"><strong>${row.count}</strong></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty"><p>${empty}</p></div>`}</section>`;
}
function analyticsPage(data) {
  return heading('Viewer analytics', 'Anonymous visit statistics for the last 30 days.') +
    `<section class="stats"><div class="stat"><span class="stat-label">Page views ${icon('chart')}</span><strong>${data.pageViews}</strong><small>Recorded page visits</small></div><div class="stat"><span class="stat-label">Unique viewers ${icon('users')}</span><strong>${data.uniqueVisitors}</strong><small>Anonymous browser IDs</small></div><div class="stat"><span class="stat-label">Average time ${icon('calendar')}</span><strong>${formatDuration(data.averageDurationSec)}</strong><small>Completed page sessions</small></div><div class="stat"><span class="stat-label">Period ${icon('calendar')}</span><strong>${data.days}d</strong><small>Rolling reporting window</small></div></section><div class="analytics-grid">${analyticsTable('Top pages', data.topPages)}${analyticsTable('Devices', data.devices)}${analyticsTable('Browsers', data.browsers)}${analyticsTable('Operating systems', data.operatingSystems)}${analyticsTable('Languages', data.languages)}</div><section class="panel analytics-note"><p>Analytics uses anonymous visitor and session IDs stored in the browser. No names, account details, or IP addresses are stored. Visitors can decline tracking from the public site.</p></section>`;
}
function adminsPage(admins) {
  return (
    heading('Administrators', 'Create and manage the people who can access Tekkatha CMS.') +
    `<div class="admin-management-grid"><section class="form-panel"><h2>Create an administrator</h2><p class="muted">Passwords must be at least 12 characters and are stored as one-way hashes.</p><form id="admin-create-form"><div id="admin-create-error"></div>${field('Name', 'name', '', { required: true, max: 100 })}${field('Email', 'email', '', { type: 'email', required: true })}${field('Temporary password', 'password', '', { type: 'password', required: true, min: 12, max: 256 })}${field('Access level', 'role', 'admin', { list: [['admin', 'Admin'], ['super_admin', 'Super admin']] })}<button class="btn" type="submit">${icon('check')} Create administrator</button></form></section><section class="panel"><div class="panel-head"><h2>Current administrators</h2><span class="pill">${admins.length} account${admins.length === 1 ? '' : 's'}</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>NAME</th><th>EMAIL</th><th>ACCESS</th><th>CREATED</th></tr></thead><tbody>${admins.map((item) => `<tr><td><strong>${esc(item.name)}</strong></td><td>${esc(item.email)}</td><td><span class="pill">${item.role === 'super_admin' ? 'Super admin' : 'Admin'}</span></td><td><span class="muted">${date(item.createdAt)}</span></td></tr>`).join('')}</tbody></table></div></section></div>`
  );
}
function bindAdmins() {
  $('#admin-create-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    const error = $('#admin-create-error');
    button.disabled = true;
    error.innerHTML = '';
    try {
      await api('/admin/admins', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      notice('Administrator created successfully.');
      await loadView();
    } catch (reason) {
      error.innerHTML = `<div class="form-error" role="alert">${esc(reason.message)}</div>`;
      button.disabled = false;
    }
  });
}
function assistantPage() {
  return (
    heading(
      'Useful answers start with reliable data.',
      'Tekkatha AI reads the shared MongoDB product catalog.',
    ) +
    `<section class="panel"><div class="panel-head"><h2>Tekkatha AI</h2><span class="pill">Catalog mode</span></div><div class="panel-content"><h3>Connected to the product catalog.</h3><p>The assistant can look up specifications, compare products from the same category, find phones within a budget, and link published buying guides. It uses the prices and verification labels you manage in the CMS.</p><p>A live language model and automatic retailer lookup are not connected. The assistant explains this limitation and does not claim current prices or stock.</p><a class="btn" href="${WEBSITE}/ai" target="_blank" rel="noopener noreferrer">Open Tekkatha AI ${icon('external')}</a></div></section>`
  );
}
const adsManager = createAdsManager({
  api,
  esc,
  icon,
  field,
  heading,
  layout,
  notice,
  productImageField,
  bindProductImage,
  currentView: () => view,
  setEditorView: () => {
    view = 'ads-editor';
  },
  returnToAds: () => {
    view = 'ads';
    return loadView();
  },
});
const popupNoticesManager = createPopupNoticesManager({
  api,
  websiteUrl: WEBSITE,
  esc,
  icon,
  field,
  heading,
  layout,
  notice,
  currentView: () => view,
  returnToNotices: () => {
    view = 'popup';
    return loadView();
  },
});
document.addEventListener('click', async (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'theme') return toggleTheme();
  if (action === 'logout') {
    try {
      await api('/auth/logout', { method: 'POST', body: '{}' });
    } catch (error) {
      if (error.status !== 401) {
        notice(error.message);
        return;
      }
    }
    showLogin();
    return;
  }
  if (action === 'retry') return loadView();
  const nav = e.target.closest('[data-nav]');
  if (nav) {
    view = nav.dataset.nav;
    page = 1;
    query = '';
    archived = false;
    status = 'all';
    return loadView();
  }
  const create = e.target.closest('[data-create]');
  if (create) return openEditor(create.dataset.create);
  const edit = e.target.closest('[data-edit]');
  if (edit) return openEditor(view, edit.dataset.edit);
  const archive = e.target.closest('[data-archive]');
  const restore = e.target.closest('[data-restore]');
  if (archive || restore) {
    const id = (archive || restore).dataset[archive ? 'archive' : 'restore'];
    const b = archive || restore;
    b.disabled = true;
    try {
      await api('/admin/' + view + '/' + encodeURIComponent(id) + (restore ? '/restore' : ''), {
        method: restore ? 'POST' : 'DELETE',
        body: '{}',
      });
      await refreshList();
      notice(restore ? 'Entry restored.' : 'Entry archived. It can be restored from the archive.');
    } catch (error) {
      notice(error.message);
      b.disabled = false;
    }
  }
  const pagination = e.target.closest('[data-page]');
  if (pagination && !pagination.disabled) {
    page = Number(pagination.dataset.page);
    await refreshList();
  }
});
$('#admin-app').innerHTML = '<div class="loading">Connecting to Tekkatha CMS…</div>';
try {
  const result = await api('/auth/me');
  admin = result.admin;
  const initial = location.hash.slice(1);
  view = ['overview', 'articles', 'products', 'ads', 'popup', 'analytics', 'settings', 'admins', 'assistant'].includes(initial)
    ? initial
    : 'overview';
  await loadView();
} catch (error) {
  showLogin(error.status === 401 ? '' : error.message);
}
