import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ADMIN_KEY_HEADER = 'x-analytics-key';
const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers'] ?? ''}, ${ADMIN_KEY_HEADER}` },
    });
  }

  const adminKey = Deno.env.get('ANALYTICS_ADMIN_KEY');
  if (!adminKey) {
    return json({ error: 'Analytics admin key is not configured.' }, 503);
  }

  const provided = req.headers.get(ADMIN_KEY_HEADER) ?? '';
  if (!provided || !timingSafeEqual(provided, adminKey)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const url = new URL(req.url);
  const parsedDays = Number(url.searchParams.get('days'));
  const days = Number.isFinite(parsedDays) && parsedDays > 0 ? Math.min(Math.round(parsedDays), MAX_DAYS) : DEFAULT_DAYS;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data, error } = await supabase
    .from('analytics_events')
    .select('event, props, occurred_at')
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false })
    .limit(50000);

  if (error) {
    console.error('analytics-summary query failed:', error.message);
    return json({ error: 'Could not load analytics.', details: error.message }, 500);
  }

  const rows = data ?? [];
  const totals: Record<string, number> = {};
  const byDay: Record<string, Record<string, number>> = {};
  const playerCounts: Record<string, number> = {};
  const surfaces: Record<string, number> = {};

  for (const row of rows) {
    const event = String(row.event);
    totals[event] = (totals[event] ?? 0) + 1;

    const day = String(row.occurred_at).slice(0, 10);
    byDay[day] ??= {};
    byDay[day][event] = (byDay[day][event] ?? 0) + 1;

    const props = (row.props ?? {}) as Record<string, unknown>;
    if (event === 'room_created' && props.player_count != null) {
      const key = String(props.player_count);
      playerCounts[key] = (playerCounts[key] ?? 0) + 1;
    }
    if (props.surface != null) {
      const key = String(props.surface);
      surfaces[key] = (surfaces[key] ?? 0) + 1;
    }
  }

  return json({
    days,
    since,
    total_events: rows.length,
    totals,
    by_day: Object.entries(byDay)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, events]) => ({ date, events })),
    room_player_counts: playerCounts,
    surfaces,
  });
});
