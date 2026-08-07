CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.cleanup_stale_rooms()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rooms
  WHERE last_updated < now() - interval '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_stale_rooms() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('cleanup-stale-rooms')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stale-rooms');

SELECT cron.schedule(
  'cleanup-stale-rooms',
  '0 * * * *',
  $$SELECT public.cleanup_stale_rooms();$$
);