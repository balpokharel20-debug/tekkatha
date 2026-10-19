export const MAX_PRODUCT_CONTENT_TEXT = 100000;

export function renderProductText(value = '') {
  return String(value)
    .split(/\r?\n[ \t]*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const text = paragraph.replace(
        /[&<>"']/g,
        (character) =>
          ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
      );
      return `<p>${text.replace(/\r\n?|\n/g, '<br>')}</p>`;
    })
    .join('');
}
