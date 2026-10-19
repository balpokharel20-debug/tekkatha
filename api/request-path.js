const ORIGINAL_PATH_PARAM = '__vercel_path';

export function restoreOriginalPath(req) {
  const rewrittenUrl = new URL(req.url || '/', 'https://tekkatha.invalid');
  const originalPath = rewrittenUrl.searchParams.get(ORIGINAL_PATH_PARAM);
  if (!originalPath?.startsWith('/')) return;

  rewrittenUrl.searchParams.delete(ORIGINAL_PATH_PARAM);
  const originalQuery = rewrittenUrl.searchParams.toString();
  req.url = `${originalPath}${originalQuery ? `?${originalQuery}` : ''}`;
}
