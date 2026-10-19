function readStorage(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {}
}

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}

export function createPopupNotice({ apiBase = '/api' } = {}) {
  let notice = null;
  let timer = null;
  let root = null;
  let keydownHandler = null;

  function storageKey() {
    return notice ? `tekkatha-popup-notice:${notice.id}:${notice.updatedAt || ''}` : '';
  }

  function canShow() {
    if (!notice) return false;
    const key = storageKey();
    if (notice.displayMode === 'every_visit')
      return !readStorage(window.sessionStorage, key);
    const value = readStorage(window.localStorage, key);
    if (!value) return true;
    if (notice.displayMode === 'first_visit') return false;
    const shownAt = Number(value);
    return !Number.isFinite(shownAt) || Date.now() - shownAt >= notice.repeatDays * 86400000;
  }

  function markShown() {
    const key = storageKey();
    if (!key) return;
    const storage = notice.displayMode === 'every_visit' ? window.sessionStorage : window.localStorage;
    writeStorage(storage, key, String(Date.now()));
  }

  function close() {
    if (!root) return;
    if (keydownHandler) document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
    root.replaceChildren();
    document.body.classList.remove('popup-notice-open');
  }

  function imageLoads(source) {
    return new Promise((resolve) => {
      const image = new Image();
      let finished = false;
      const finish = (loaded) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        image.onload = image.onerror = null;
        resolve(loaded);
      };
      const timeout = window.setTimeout(() => finish(false), 4000);
      image.onload = () => finish(image.naturalWidth > 0);
      image.onerror = () => finish(false);
      image.src = source;
    });
  }

  async function render() {
    if (!root || !notice || !notice.image || !notice.link || !canShow()) return;
    const currentNotice = notice;
    const showImage = await imageLoads(notice.image);
    if (!root || notice !== currentNotice || !showImage || !canShow()) return;
    markShown();
    const closeButton = notice.dismissible
      ? `<button type="button" class="popup-notice-close" data-popup-close aria-label="Close notice"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button>`
      : '';
    const label = escapeHtml(notice.title || notice.imageAlt || 'Open promotion');
    root.innerHTML = `<div class="popup-notice-backdrop" data-popup-backdrop><section class="popup-notice" role="dialog" aria-modal="true" aria-label="${label}" tabindex="-1">${closeButton}<a class="popup-notice-link" href="${escapeHtml(notice.link)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${label}"><img class="popup-notice-image" src="${escapeHtml(notice.image)}" alt="${escapeHtml(notice.imageAlt || notice.title)}"></a></section></div>`;
    root.querySelector('.popup-notice-image')?.addEventListener('error', close);
    document.body.classList.add('popup-notice-open');
    root.querySelector('.popup-notice')?.focus({ preventScroll: true });
    root.querySelector('[data-popup-backdrop]')?.addEventListener('click', (event) => {
      if (event.target.matches('[data-popup-backdrop]') && notice.dismissible) close();
    });
    root.querySelector('[data-popup-close]')?.addEventListener('click', close);
    if (notice.dismissible) {
      keydownHandler = (event) => {
        if (event.key === 'Escape') close();
      };
      document.addEventListener('keydown', keydownHandler);
    }
  }

  async function load() {
    try {
      const response = await fetch(apiBase + '/popup-notice', { credentials: 'omit' });
      if (!response.ok) return;
      notice = await response.json();
      if (!notice || !canShow()) return;
      const delay = Math.max(0, Number(notice.delaySeconds) || 0) * 1000;
      timer = window.setTimeout(render, delay);
    } catch {}
  }

  return {
    start() {
      root = document.getElementById('popup-notice-root');
      if (root) load();
    },
    close,
  };
}
