export const MAX_FOOTER_SEO_CODE = 50000;

function isoDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function buildSeoData({ settings, url, title, description = settings.description, article, product }) {
  const page = new URL(url);
  page.search = '';
  page.hash = '';
  const home = new URL('/', page).href;
  const organization = home + '#organization';
  const website = home + '#website';
  const graph = [
    {
      '@type': 'Organization',
      '@id': organization,
      name: settings.siteName,
      url: home,
      logo: new URL(settings.logoImage || '/assets/mark.svg', home).href,
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
      ...(article?.status === 'published' && !article.isSample
        ? { mainEntity: { '@id': page.href + '#article' } }
        : product?.id
          ? { mainEntity: { '@id': page.href + '#product' } }
        : {}),
    },
  ];

  if (article?.status === 'published' && !article.isSample) {
    const articleImage = article.image ? new URL(article.image, home).href : undefined;
    const datePublished = isoDate(article.publishedAt || article.createdAt);
    const dateModified = isoDate(article.updatedAt || article.publishedAt || article.createdAt);
    graph.push({
      '@type': 'BlogPosting',
      '@id': page.href + '#article',
      mainEntityOfPage: { '@id': page.href + '#webpage' },
      headline: article.title,
      description: article.excerpt || description,
      ...(articleImage ? { image: [articleImage] } : {}),
      ...(datePublished ? { datePublished } : {}),
      ...(dateModified ? { dateModified } : {}),
      articleSection: article.category,
      author: {
        '@type': /tekkatha|editorial/i.test(article.author || '') ? 'Organization' : 'Person',
        name: article.author,
      },
      publisher: { '@id': organization },
      inLanguage: 'en',
    });
  }

  if (product?.id) {
    let image;
    if (typeof product.image === 'string' && product.image && !product.image.startsWith('data:')) {
      try {
        const candidate = new URL(product.image, home);
        if (['http:', 'https:'].includes(candidate.protocol)) image = candidate.href;
      } catch {}
    }
    const entity = {
      '@type': 'Product',
      '@id': page.href + '#product',
      mainEntityOfPage: { '@id': page.href + '#webpage' },
      name: `${product.brand} ${product.name}${product.variant ? ` ${product.variant}` : ''}`,
      description: product.note || description,
      brand: { '@type': 'Brand', name: product.brand },
      category: product.type,
      ...(image ? { image: [image] } : {}),
    };
    const checkedAt = product.priceCheckedAt ? new Date(product.priceCheckedAt) : null;
    const now = Date.now();
    if (
      product.priceStatus === 'verified' &&
      /^https?:\/\//i.test(product.priceSource || '') &&
      Number.isFinite(Number(product.price)) &&
      checkedAt && !Number.isNaN(checkedAt.getTime()) && checkedAt.getTime() <= now &&
      now - checkedAt.getTime() <= 30 * 24 * 60 * 60 * 1000
    ) {
      entity.offers = {
        '@type': 'Offer',
        url: product.priceSource,
        priceCurrency: 'NPR',
        price: Number(product.price),
        priceValidUntil: new Date(checkedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        ...(product.availability === 'in-stock' ? { availability: 'https://schema.org/InStock' } : {}),
        ...(product.availability === 'out-of-stock' ? { availability: 'https://schema.org/OutOfStock' } : {}),
      };
    }
    graph.push(entity);
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
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
