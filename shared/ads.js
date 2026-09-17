export const AD_PLACEMENTS = [
  {
    id: 'site-top',
    label: 'Below the header',
    description: 'All public pages, below navigation.',
    size: '728 × 90',
    ratio: '728 / 90',
  },
  {
    id: 'home-feed',
    label: 'Homepage featured stories',
    description: 'Homepage, below the featured stories.',
    size: '970 × 250',
    ratio: '970 / 250',
  },
  {
    id: 'home-sidebar',
    label: 'Homepage sidebar',
    description: 'Homepage, beside the news feed.',
    size: '300 × 250',
    ratio: '300 / 250',
  },
  {
    id: 'article-inline',
    label: 'Inside articles',
    description: 'Article reader, after the first two sections.',
    size: '728 × 90',
    ratio: '728 / 90',
  },
  {
    id: 'product-details',
    label: 'Below product details',
    description: 'Product pages, below the specifications.',
    size: '728 × 90',
    ratio: '728 / 90',
  },
  {
    id: 'site-bottom',
    label: 'Above the footer',
    description: 'All public pages, before the footer.',
    size: '728 × 90',
    ratio: '728 / 90',
  },
];
export const AD_ROTATION_MS = 8000;
export const AD_REFRESH_MS = 60000;

export function adStatus(ad, now = Date.now()) {
  if (ad.deletedAt != null) return 'archived';
  if (!ad.active) return 'paused';
  if (ad.endsAt && Date.parse(ad.endsAt) <= now) return 'expired';
  if (ad.startsAt && Date.parse(ad.startsAt) > now) return 'scheduled';
  return 'running';
}

export function isAdRunning(ad, now = Date.now()) {
  return (
    ad.active === true &&
    ad.deletedAt == null &&
    (!ad.startsAt || Date.parse(ad.startsAt) <= now) &&
    (!ad.endsAt || Date.parse(ad.endsAt) > now)
  );
}

// Each placement gets a shuffled bag. Every eligible ad appears once per cycle.
export function createAdRotation(random = Math.random) {
  const states = new Map();
  return {
    next(placement, ads) {
      const ids = [...new Set(ads.map((ad) => ad.id))].sort();
      if (!ids.length) {
        states.delete(placement);
        return null;
      }
      const key = JSON.stringify(ids);
      const state = states.get(placement) || { key: '', bag: [], previous: null };
      if (state.key !== key || !state.bag.length) {
        state.key = key;
        state.bag = [...ids];
        for (let i = state.bag.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [state.bag[i], state.bag[j]] = [state.bag[j], state.bag[i]];
        }
        if (state.bag.length > 1 && state.bag[0] === state.previous)
          [state.bag[0], state.bag[1]] = [state.bag[1], state.bag[0]];
      }
      state.previous = state.bag.shift();
      states.set(placement, state);
      return ads.find((ad) => ad.id === state.previous);
    },
  };
}
