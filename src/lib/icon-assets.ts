/**
 * Bump ICON_VERSION whenever any favicon / app icon file changes.
 * The version is appended as a query string so browsers, OSes and
 * social crawlers fetch the new bytes instead of a cached copy.
 */
export const ICON_VERSION = '3';

export interface IconAsset {
  /** Path relative to the site root, without a version query. */
  path: string;
  label: string;
  /** Expected square size in px, or null for non-raster/unknown. */
  size: number | null;
  usage: string;
}

export const ICON_ASSETS: IconAsset[] = [
  { path: '/favicon.png', label: 'favicon.png', size: 64, usage: 'Browser tab and bookmarks' },
  { path: '/icon-192.png', label: 'icon-192.png', size: 192, usage: 'Android home screen' },
  { path: '/apple-touch-icon.png', label: 'apple-touch-icon.png', size: 180, usage: 'iOS home screen' },
  { path: '/icon-512.png', label: 'icon-512.png', size: 512, usage: 'Install prompt / splash' },
  { path: '/android-chrome-192x192.png', label: 'android-chrome-192x192.png', size: 192, usage: 'Android Chrome home screen' },
  { path: '/android-chrome-512x512.png', label: 'android-chrome-512x512.png', size: 512, usage: 'Android Chrome splash / install' },
  { path: '/icon-maskable-512.png', label: 'icon-maskable-512.png', size: 512, usage: 'Android adaptive (maskable)' },
];

/** Returns the asset path with the current cache-busting version applied. */
export function versionedIconUrl(path: string, version: string = ICON_VERSION): string {
  return `${path}?v=${version}`;
}
