CREATE TABLE public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX analytics_events_occurred_at_idx ON public.analytics_events (occurred_at DESC);
CREATE INDEX analytics_events_event_idx ON public.analytics_events (event, occurred_at DESC);

GRANT ALL ON public.analytics_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block direct select on analytics_events" ON public.analytics_events FOR SELECT USING (false);
CREATE POLICY "Block direct insert on analytics_events" ON public.analytics_events FOR INSERT WITH CHECK (false);
CREATE POLICY "Block direct update on analytics_events" ON public.analytics_events FOR UPDATE USING (false);
CREATE POLICY "Block direct delete on analytics_events" ON public.analytics_events FOR DELETE USING (false);

CREATE OR REPLACE FUNCTION public.track_analytics_event(event_name text, event_props jsonb DEFAULT '{}'::jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  allowed_events text[] := ARRAY['room_created','room_control_opened','overlay_opened','obs_overlay_opened','game_started','game_reset','sync_failure','sync_recovered','help_opened'];
  allowed_props text[] := ARRAY['player_count','surface','source','preset','layout','fit','safe_margins','reason','attempt'];
  clean_props jsonb := '{}'::jsonb;
  k text;
  v jsonb;
BEGIN
  IF event_name IS NULL OR NOT (event_name = ANY(allowed_events)) THEN
    RETURN FALSE;
  END IF;

  IF event_props IS NOT NULL AND jsonb_typeof(event_props) = 'object' THEN
    FOR k, v IN SELECT key, value FROM jsonb_each(event_props) LOOP
      IF k = ANY(allowed_props)
         AND jsonb_typeof(v) IN ('string','number','boolean')
         AND length(v::text) <= 40 THEN
        clean_props := clean_props || jsonb_build_object(k, v);
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.analytics_events (event, props) VALUES (event_name, clean_props);
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.track_analytics_event(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_analytics_event(text, jsonb) TO anon, authenticated, service_role;
