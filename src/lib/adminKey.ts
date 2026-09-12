/**
 * Helpers for keeping the room admin key out of the visible address bar.
 *
 * Control links shared as `?adminKey=...` keep working: the key is validated
 * against the room, stored locally, and only then removed from the URL. All
 * other query parameters and the hash are preserved.
 */

export const ADMIN_KEY_PARAM = 'adminKey';

export interface StrippedLocation {
  search: string;
  hash: string;
  /** True when an admin key was present and removed. */
  changed: boolean;
}

export function stripAdminKeyFromLocation(search: string, hash = ''): StrippedLocation {
  const params = new URLSearchParams(search);
  if (!params.has(ADMIN_KEY_PARAM)) {
    return { search: search.startsWith('?') ? search : search ? `?${search}` : '', hash, changed: false };
  }

  params.delete(ADMIN_KEY_PARAM);
  const rest = params.toString();
  return { search: rest ? `?${rest}` : '', hash, changed: true };
}

/** Rebuild the private control URL on demand (e.g. "Copy admin link"). */
export function buildAdminUrl(origin: string, roomId: string, adminKey: string, extraParams?: URLSearchParams): string {
  const params = new URLSearchParams(extraParams ?? undefined);
  params.delete(ADMIN_KEY_PARAM);
  params.set(ADMIN_KEY_PARAM, adminKey);
  return `${origin}/room/${roomId}?${params.toString()}`;
}
