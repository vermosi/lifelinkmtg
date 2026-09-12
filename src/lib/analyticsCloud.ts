/**
 * Cloud destination for the nine allow-listed product events.
 *
 * The frontend never writes to the events table directly — it calls a
 * validating database function that re-checks the event name and drops any
 * property that is not on the allow-list. Consent gating, sanitising and
 * failure isolation all happen in `analytics.ts` before this runs.
 */
import { supabase } from '@/integrations/supabase/client';
import { registerAnalyticsProvider, type AnalyticsProvider } from '@/lib/analytics';

const cloudProvider: AnalyticsProvider = (event, props) => {
  void supabase
    .rpc('track_analytics_event', { event_name: event, event_props: props })
    .then(({ error }) => {
      if (error) {
        // Analytics must never surface to the player; swallow transport errors.
      }
    });
};

let unregister: (() => void) | null = null;

/** Send tracked events to the app's own database. Safe to call more than once. */
export function enableCloudAnalytics(): () => void {
  unregister?.();
  unregister = registerAnalyticsProvider(cloudProvider);
  return () => {
    unregister?.();
    unregister = null;
  };
}
