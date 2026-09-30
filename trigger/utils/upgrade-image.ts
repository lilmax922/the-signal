// Upgrades a BBC ichef thumbnail URL to its 1024px variant.
//
// Only rewrites `ichef.bbci.co.uk` URLs whose path contains
// `/ace/standard/240/` — everything else (branded_news, non-ichef hosts,
// already-upgraded URLs, unparseable input) is returned unchanged so the
// caller can always fall back to the original URL.
export function upgradeIchefThumbnail(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'ichef.bbci.co.uk') {
      return url
    }
    if (!parsed.pathname.includes('/ace/standard/240/')) {
      return url
    }
    return url.replace('/ace/standard/240/', '/ace/standard/1024/')
  }
  catch {
    return url
  }
}
