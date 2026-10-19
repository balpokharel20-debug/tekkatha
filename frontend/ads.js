import {
  AD_PLACEMENTS,
  AD_REFRESH_MS,
  AD_ROTATION_MS,
  createAdRotation,
  isAdRunning,
} from '../shared/ads.js';

export function createAdDisplay({ api, apiBase = '/api' }) {
  const rotation = createAdRotation();
  const failedImages = new Map();
  let ads = [],
    slots = [],
    rotationTimer,
    refreshTimer,
    requestController;

  const eligible = (id) =>
    ads.filter(
      (ad) => isAdRunning(ad) && ad.placements.includes(id) && failedImages.get(ad.id) !== ad.image,
    );

  function updateSlot(slot, advance = false) {
    const candidates = eligible(slot.id);
    if (!candidates.length) {
      slot.root.hidden = true;
      slot.ad = null;
      slot.image.removeAttribute('src');
      return;
    }
    const current = slot.ad && candidates.find((ad) => ad.id === slot.ad.id);
    const ad = advance || !current ? rotation.next(slot.id, candidates) : current;
    if (advance || slot.ad?.id !== ad.id || slot.ad?.image !== ad.image) slot.elapsed = 0;
    slot.root.hidden = false;
    slot.link.href = ad.link;
    slot.link.setAttribute('aria-label', `${ad.advertiser}: ${ad.alt} (opens in a new tab)`);
    slot.image.alt = ad.alt;
    if (slot.ad?.image !== ad.image) slot.image.src = ad.image;
    slot.ad = ad;
    slot.caption.hidden = candidates.length < 2;
    slot.tools.hidden = candidates.length < 2;
    slot.count.textContent = `${candidates.length} ads`;
    slot.pause.textContent = slot.paused ? 'Resume' : 'Pause';
    slot.pause.setAttribute('aria-pressed', String(slot.paused));
    slot.pause.setAttribute(
      'aria-label',
      slot.paused ? 'Resume advertisement rotation' : 'Pause advertisement rotation',
    );
  }

  function makeSlot(id, anchor, position) {
    if (!anchor) return;
    const placement = AD_PLACEMENTS.find((item) => item.id === id);
    const root = document.createElement('section');
    root.className = 'ad-placement ad-placement-' + id;
    root.dataset.adSlot = id;
    root.style.setProperty('--ad-ratio', placement.ratio);
    root.setAttribute('aria-label', placement.label + ' advertisement');
    root.hidden = true;
    root.innerHTML =
      '<div class="ad-caption" hidden><div class="ad-rotation-tools" hidden><span class="ad-count"></span><button type="button" class="ad-pause" aria-pressed="false">Pause</button><button type="button" class="ad-next" aria-label="Show next advertisement">Next</button></div></div><a class="ad-creative" target="_blank" rel="sponsored noopener noreferrer"><img loading="lazy" decoding="async" alt=""></a>';
    const slot = {
      id,
      root,
      paused: false,
      ad: null,
      elapsed: 0,
      caption: root.querySelector('.ad-caption'),
      link: root.querySelector('.ad-creative'),
      image: root.querySelector('img'),
      tools: root.querySelector('.ad-rotation-tools'),
      count: root.querySelector('.ad-count'),
      pause: root.querySelector('.ad-pause'),
    };
    slot.pause.addEventListener('click', () => {
      slot.paused = !slot.paused;
      updateSlot(slot);
    });
    root.querySelector('.ad-next').addEventListener('click', () => updateSlot(slot, true));
    slot.image.addEventListener('error', () => {
      if (!slot.ad) return;
      failedImages.set(slot.ad.id, slot.ad.image);
      updateSlot(slot);
    });
    if (id === 'site-top' || id === 'site-bottom') {
      const container = document.createElement('div');
      container.className = 'container';
      container.dataset.adContainer = '';
      container.append(root);
      if (id === 'site-top') anchor.prepend(container);
      else anchor.append(container);
    } else anchor.insertAdjacentElement(position, root);
    slots.push(slot);
    updateSlot(slot);
  }

  function mount() {
    document
      .querySelectorAll('[data-ad-container], [data-ad-slot]')
      .forEach((node) => node.remove());
    slots = [];
    const main = document.querySelector('#main');
    if (!main) return;
    makeSlot('site-top', main);
    makeSlot('site-bottom', main);
    makeSlot('home-feed', main.querySelector('.hero-grid'), 'afterend');
    makeSlot('home-sidebar', main.querySelector('.news-sidebar .ai-mini'), 'beforebegin');
    const sections = main.querySelectorAll('.article-body > section');
    makeSlot('article-inline', sections[Math.min(1, sections.length - 1)], 'afterend');
    makeSlot('product-details', main.querySelector('.spec-section'), 'afterend');
  }

  async function refresh() {
    if (requestController || document.hidden) return;
    const controller = new AbortController();
    requestController = controller;
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const data = await api('/ads', { signal: controller.signal });
      if (!Array.isArray(data.items)) throw new Error('Invalid ads response.');
      ads = data.items.map((ad) => ({
        ...ad,
        image: ad.image.startsWith('/api/ads/')
          ? apiBase.replace(/\/$/, '') + ad.image.slice(4)
          : ad.image,
      }));
      failedImages.clear();
    } catch {
      // The publication stays available if advertising is unavailable.
      ads = [];
    } finally {
      clearTimeout(timeout);
      if (requestController === controller) requestController = null;
      slots.forEach((slot) => updateSlot(slot));
    }
  }

  function tick() {
    if (document.hidden) return;
    for (const slot of slots) {
      const candidates = eligible(slot.id);
      if (!slot.ad || !candidates.some((ad) => ad.id === slot.ad.id)) {
        updateSlot(slot);
        continue;
      }
      if (
        slot.root.hidden ||
        candidates.length < 2 ||
        slot.paused ||
        slot.root.matches(':hover') ||
        slot.root.contains(document.activeElement)
      )
        continue;
      const bounds = slot.root.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < window.innerHeight) {
        slot.elapsed += 1000;
        if (slot.elapsed >= AD_ROTATION_MS) updateSlot(slot, true);
      }
    }
  }

  function start() {
    if (rotationTimer) return;
    refresh();
    rotationTimer = setInterval(tick, 1000);
    refreshTimer = setInterval(refresh, AD_REFRESH_MS);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
  window.addEventListener('pagehide', () => {
    clearInterval(rotationTimer);
    clearInterval(refreshTimer);
    rotationTimer = refreshTimer = null;
    requestController?.abort();
  });
  window.addEventListener('pageshow', start);
  return { mount, start };
}
