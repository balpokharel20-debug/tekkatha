export const PRODUCT_IMAGE_HOSTS = Object.freeze([
  // Keep aligned with vercel.json; Vercel accepts at most 50 remote patterns.
  "asset.conrad.com",
  "assets.mmsrg.com",
  "assets.umart.com.au",
  "blackviewshop.de",
  "cdn-files.kimovil.com",
  "cdn.beebom.com",
  "cdn.billiger.com",
  "cdn.hstatic.net",
  "cdn.idealo.com",
  "cdn.mafrservices.com",
  "cdn.salla.sa",
  "cdn.shopify.com",
  "cdn.vatanbilgisayar.com",
  "down-id.img.susercontent.com",
  "down-th.img.susercontent.com",
  "fdn.gsmarena.com",
  "files.refurbed.com",
  "i.allo.ua",
  "i0.wp.com",
  "i5.walmartimages.com",
  "image.vandenborre.be",
  "images.samsung.com",
  "img-resizer.cyberport.de",
  "img.danawa.com",
  "img02.honorfile.com",
  "img1.kakaku.k-img.com",
  "laptopdecision.com",
  "laptopmedia.com",
  "m.media-amazon.com",
  "med.csmobiles.com",
  "media.gadgetbytenepal.com",
  "media.telisik.id",
  "mobidevices.com",
  "pisces.bbystatic.com",
  "psrefstuff.lenovo.com",
  "qualitycomputer.com.np",
  "s.yimg.com",
  "shop.r10s.jp",
  "shop.urbanrepublic.com.my",
  "static-01.daraz.lk",
  "static.swappa.com",
  "static.wixstatic.com",
  "storage-asset.msi.com",
  "www.100percent.co.nz",
  "www.alkomprar.com",
  "www.honor.com",
  "www.jbl.com.br",
  "www.notebookcheck.net",
  "www.phonebunch.com",
  "www.simplytek.lk",
]);

export const PRODUCT_IMAGE_WIDTHS = Object.freeze([320, 640, 960]);

export function optimizedProductImageUrl(source, width, enabled = false) {
  if (!enabled || ![...PRODUCT_IMAGE_WIDTHS].includes(width)) return source;
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || !PRODUCT_IMAGE_HOSTS.includes(url.hostname)) return source;
    return '/_vercel/image?url=' + encodeURIComponent(url.href) + '&w=' + width + '&q=75';
  } catch {
    return source;
  }
}

export function productImageSources(source, widths, enabled = false) {
  const validWidths = widths.filter((width) => PRODUCT_IMAGE_WIDTHS.includes(width));
  const largest = validWidths.at(-1) || 640;
  const src = optimizedProductImageUrl(source, largest, enabled);
  const srcSet = enabled && src !== source
    ? validWidths.map((width) => optimizedProductImageUrl(source, width, true) + ' ' + width + 'w').join(', ')
    : '';
  return { src, srcSet };
}
