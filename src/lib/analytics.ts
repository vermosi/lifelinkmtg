export type AnalyticsEvent =
  | 'overlay_loaded'
  | 'game_started'
  | 'life_changed'
  | 'undo_used';

const ANALYTICS_ENABLED = import.meta.env.VITE_ANALYTICS_ENABLED === 'true';

export function trackEvent(name: AnalyticsEvent, payload?: Record<string, unknown>): void {
  if (!ANALYTICS_ENABLED) return;

  try {
    const detail = {
      name,
      payload,
      timestamp: Date.now(),
    };

    window.dispatchEvent(new CustomEvent('lifelink_analytics', { detail }));
    console.info('[LifeLink Analytics]', detail);
  } catch {
    // Ignore analytics errors
  }
}
