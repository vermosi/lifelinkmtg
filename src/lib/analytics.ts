/**
 * Privacy-safe product analytics.
 *
 * Rules enforced here (not by callers):
 *  - Only the coarse events in `ANALYTICS_EVENTS` are accepted.
 *  - Only allow-listed, non-identifying payload keys are forwarded.
 *  - Nothing is sent unless the visitor accepted analytics cookies.
 *  - A provider throwing never breaks the app.
 *
 * Note on destinations: the hosting platform collects its own aggregate
 * pageview analytics server-side (visitors/pageviews/session length). That is
 * essential first-party measurement and is independent of this module. The
 * events below only reach a destination when an analytics provider script is
 * present on the page (Plausible / GA / Umami) or one is registered via
 * `registerAnalyticsProvider`. With no provider present, events are dropped.
 */

export const ANALYTICS_EVENTS = [
  'room_created',
  'room_control_opened',
  'overlay_opened',
  'obs_overlay_opened',
  'game_started',
  'game_reset',
  'sync_failure',
  'sync_recovered',
  'help_opened',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/** Coarse, non-identifying properties. Anything else is dropped. */
export const ALLOWED_PROPS = [
  'player_count',
  'surface',
  'source',
  'preset',
  'layout',
  'fit',
  'safe_margins',
  'reason',
  'attempt',
] as const;

export type AnalyticsProps = Partial<Record<(typeof ALLOWED_PROPS)[number], string | number | boolean>>;

export type AnalyticsProvider = (event: AnalyticsEvent, props: Record<string, string | number | boolean>) => void;

const CONSENT_KEY = 'lifelink-cookie-consent';
const ALLOWED_PROP_SET = new Set<string>(ALLOWED_PROPS);
const MAX_STRING_LENGTH = 32;

let customProvider: AnalyticsProvider | null = null;

/** Register an analytics destination. Returns an unsubscribe function. */
export function registerAnalyticsProvider(provider: AnalyticsProvider): () => void {
  customProvider = provider;
  return () => {
    if (customProvider === provider) customProvider = null;
  };
}

export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

/**
 * Strip anything that could identify a room, a player, or a person.
 * Exported for tests.
 */
export function sanitizeProps(props?: AnalyticsProps | Record<string, unknown>): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  if (!props) return safe;

  for (const [key, value] of Object.entries(props)) {
    if (!ALLOWED_PROP_SET.has(key)) continue;
    if (typeof value === 'boolean') {
      safe[key] = value;
    } else if (typeof value === 'number') {
      if (Number.isFinite(value)) safe[key] = Math.round(value);
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed && trimmed.length <= MAX_STRING_LENGTH && !/[:/?#@]/.test(trimmed)) {
        safe[key] = trimmed;
      }
    }
  }

  return safe;
}

type AnalyticsWindow = Window & {
  plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  gtag?: (command: 'event', event: string, params?: Record<string, unknown>) => void;
  umami?: { track?: (event: string, props?: Record<string, unknown>) => void };
};

function resolveProvider(): AnalyticsProvider | null {
  if (customProvider) return customProvider;
  if (typeof window === 'undefined') return null;
  const w = window as AnalyticsWindow;

  if (typeof w.plausible === 'function') {
    return (event, props) => w.plausible!(event, Object.keys(props).length ? { props } : undefined);
  }
  if (typeof w.gtag === 'function') {
    return (event, props) => w.gtag!('event', event, props);
  }
  if (typeof w.umami?.track === 'function') {
    return (event, props) => w.umami!.track!(event, props);
  }
  return null;
}

export function trackEvent(name: AnalyticsEvent, props?: AnalyticsProps): void {
  if (!ANALYTICS_EVENTS.includes(name)) return;
  if (!hasAnalyticsConsent()) return;

  const provider = resolveProvider();
  if (!provider) return;

  try {
    provider(name, sanitizeProps(props));
  } catch {
    // A failing analytics provider must never affect the app.
  }
}
