export const DEFAULT_BRAND_SETTINGS = Object.freeze({
  id: 'brand',
  siteName: 'Tekkatha',
  tagline: 'Technology, Explained.',
  description:
    'Tekkatha covers the latest technology news, smartphone and laptop prices, gadget reviews, product comparisons, PC builds, AI, gaming, and buying guides.',
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
