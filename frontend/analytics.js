const CONSENT_KEY = 'tekkatha-analytics-consent';
const VISITOR_KEY = 'tekkatha-visitor-id';
const SESSION_KEY = 'tekkatha-session-id';

function id(key) {
  try {
    const current = localStorage.getItem(key) || crypto.randomUUID();
    localStorage.setItem(key, current);
    return current;
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
function classifyDevice() {
  const width = window.innerWidth || 1024;
  return width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
}
function browserName() {
  const ua = navigator.userAgent;
  return /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Other';
}
function operatingSystem() {
  const ua = navigator.userAgent;
  return /Android/.test(ua) ? 'Android' : /iPhone|iPad|Mac OS/.test(ua) ? 'Apple' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Other';
}

export function createAnalytics({ apiBase = '/api' } = {}) {
  let consent = localStorage.getItem(CONSENT_KEY);
  let visitorId = id(VISITOR_KEY);
  let sessionId = id(SESSION_KEY);
  let currentPath = '';
  let openedAt = 0;
  let timer;
  let started = false;

  function send(type, durationSec = 0) {
    if (consent !== 'granted' || !currentPath) return;
    const event = {
      visitorId,
      sessionId,
      type,
      path: currentPath.slice(0, 300),
      durationSec: Math.max(0, Math.round(durationSec)),
      deviceType: classifyDevice(),
      browser: browserName(),
      os: operatingSystem(),
      language: navigator.language || 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    };
    fetch(apiBase + '/analytics/events', {
      method: 'POST',
      credentials: 'omit',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [event] }),
    }).catch(() => {});
  }
  function endPage() {
    if (!openedAt) return;
    send('session_end', (Date.now() - openedAt) / 1000);
    openedAt = 0;
  }
  function setPage(path) {
    if (!started || path === currentPath) return;
    endPage();
    currentPath = path;
    openedAt = Date.now();
    send('pageview');
  }
  function mountConsent() {
    if (consent || !document.getElementById('analytics-consent-root')) return;
    const root = document.getElementById('analytics-consent-root');
    root.innerHTML = '<div class="analytics-consent" role="dialog" aria-label="Analytics preference"><p>Help us understand which devices and pages are useful. Tekkatha stores anonymous visit statistics without your name or IP address.</p><div><button type="button" data-analytics="decline">Decline</button><button type="button" class="btn" data-analytics="accept">Allow anonymous analytics</button></div></div>';
    root.querySelector('[data-analytics="accept"]').addEventListener('click', () => {
      consent = 'granted';
      localStorage.setItem(CONSENT_KEY, consent);
      root.replaceChildren();
      started = true;
      currentPath = '';
      setPage(location.pathname);
    });
    root.querySelector('[data-analytics="decline"]').addEventListener('click', () => {
      consent = 'declined';
      localStorage.setItem(CONSENT_KEY, consent);
      root.replaceChildren();
    });
  }
  return {
    start() {
      mountConsent();
      if (consent !== 'granted') return;
      started = true;
      setPage(location.pathname);
      timer = setInterval(() => send('heartbeat', (Date.now() - openedAt) / 1000), 30000);
      window.addEventListener('pagehide', endPage, { once: true });
    },
    setPage,
  };
}
