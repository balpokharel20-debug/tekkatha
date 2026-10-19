import { buildSeoData, serializeSeoData } from '../shared/seo.js';

export function createFooterSeo() {
  const structuredData = document.getElementById('tekkatha-structured-data');
  const customCode = document.getElementById('footer-seo-code');
  let appliedCode;

  function setMeta(attribute, name, content) {
    let meta = document.head.querySelector(`meta[${attribute}="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.append(meta);
    }
    meta.setAttribute('content', content);
  }

  async function activateScripts(scripts, code) {
    for (const original of scripts) {
      if (appliedCode !== code) return;
      const script = document.createElement('script');
      for (const attribute of original.attributes)
        script.setAttribute(attribute.name, attribute.value);
      script.textContent = original.textContent;
      const type = (script.getAttribute('type') || '').trim().toLowerCase();
      const executable = !type || type === 'module' || /(?:java|ecma)script/.test(type);
      const skipped = script.noModule && type !== 'module' && 'noModule' in script;
      const waitForLoad =
        executable &&
        !skipped &&
        !script.hasAttribute('async') &&
        (script.hasAttribute('src') || type === 'module');
      // Dynamic classic scripts otherwise default to async, changing snippet order.
      if (script.hasAttribute('src') && !script.hasAttribute('async')) script.async = false;
      const loaded = waitForLoad
        ? new Promise((resolve) => {
            script.addEventListener('load', resolve, { once: true });
            script.addEventListener('error', resolve, { once: true });
          })
        : null;
      // innerHTML leaves script tags inert. Recreating them deliberately executes
      // the code saved by the authenticated administrator, once per document.
      original.replaceWith(script);
      if (loaded) await loaded;
    }
  }

  return {
    update(options) {
      const data = buildSeoData(options);
      structuredData.textContent = serializeSeoData(data);
      const description = document.querySelector('meta[name="description"]');
      if (description) description.content = data['@graph'][2].description;
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.append(canonical);
      }
      canonical.href = data['@graph'][2].url;

      const page = data['@graph'][2];
      const image = new URL(options.image || '/assets/mark.svg', options.url).href;
      const imageAlt = options.imageAlt || `${options.settings.siteName} technology coverage`;
      setMeta('property', 'og:site_name', options.settings.siteName);
      setMeta('property', 'og:type', options.type || 'website');
      setMeta('property', 'og:title', options.title);
      setMeta('property', 'og:description', page.description);
      setMeta('property', 'og:url', page.url);
      setMeta('property', 'og:image', image);
      setMeta('property', 'og:image:alt', imageAlt);
      setMeta('property', 'og:locale', 'en_US');
      setMeta('name', 'twitter:card', 'summary_large_image');
      setMeta('name', 'twitter:title', options.title);
      setMeta('name', 'twitter:description', page.description);
      setMeta('name', 'twitter:image', image);
      setMeta('name', 'twitter:image:alt', imageAlt);

      const article = options.article?.status === 'published' && !options.article.isSample
        ? options.article
        : null;
      for (const [property, value] of [
        ['article:published_time', article?.publishedAt || article?.createdAt],
        ['article:modified_time', article?.updatedAt || article?.publishedAt || article?.createdAt],
        ['article:author', article?.author],
        ['article:section', article?.category],
      ]) {
        const existing = document.head.querySelector(`meta[property="${property}"]`);
        if (value) setMeta('property', property, value);
        else existing?.remove();
      }

      const code = options.settings.footerSeoCode || '';
      if (code === appliedCode) return;
      appliedCode = code;
      const template = document.createElement('template');
      template.innerHTML = code;
      const scripts = Array.from(template.content.querySelectorAll('script'));
      customCode.replaceChildren(template.content);
      void activateScripts(scripts, code);
    },
  };
}
