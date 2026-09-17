export const MAX_FOOTER_SEO_CODE = 50000;

export function buildSeoData({ settings, url, title, description = settings.description }) {
  const page = new URL(url);
  page.search = '';
  page.hash = '';
  const home = new URL('/', page).href;
  const organization = home + '#organization';
  const website = home + '#website';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organization,
        name: settings.siteName,
        url: home,
        logo: new URL('/assets/mark.svg', home).href,
        slogan: settings.tagline,
      },
      {
        '@type': 'WebSite',
        '@id': website,
        name: settings.siteName,
        url: home,
        description: settings.description,
        inLanguage: 'en',
        publisher: { '@id': organization },
      },
      {
        '@type': 'WebPage',
        '@id': page.href + '#webpage',
        url: page.href,
        name: title,
        description,
        inLanguage: 'en',
        isPartOf: { '@id': website },
        publisher: { '@id': organization },
      },
    ],
  };
}

export function serializeSeoData(data) {
  // Keep the JSON safe when copied into an HTML script element.
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

export function buildSeoMarkup(options) {
  return (
    '<script type="application/ld+json">\n' +
    serializeSeoData(buildSeoData(options)) +
    '\n</script>'
  );
}
