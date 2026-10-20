export const DEFAULT_BRAND_SETTINGS = Object.freeze({
  id: 'brand',
  siteName: 'Tekkatha',
  tagline: 'Technology, Explained.',
  headerTagline: 'Know tech. Make better choices.',
  logoImage: '/assets/mark.svg',
  description:
    'Tekkatha covers the latest technology news, smartphone and laptop prices, gadget reviews, product comparisons, PC builds, AI, gaming, and buying guides.',
  homepageTitle: 'Your daily dose of tech.',
  homepageSubtitle: 'The stories that matter. The details that help you decide.',
  homepageMetaTitle: 'Tech News, Reviews, Prices & Buying Guides',
  pageTitleSuffix: 'Tekkatha',
  footerDescription: 'Making technology easier to understand, compare, and buy. From Nepal, for everyone.',
  primaryColor: '#1357D6',
  aiName: 'Tekkatha AI',
  adminName: 'Tekkatha CMS',
  contactEmail: 'contact@tekkatha.com',
  editorialEmail: 'editorial@tekkatha.com',
  advertiseEmail: 'advertise@tekkatha.com',
  supportEmail: 'support@tekkatha.com',
  footerSeoCode: '',
});

export function withDefaultBrandSettings(settings) {
  return { ...DEFAULT_BRAND_SETTINGS, ...(settings || {}) };
}
