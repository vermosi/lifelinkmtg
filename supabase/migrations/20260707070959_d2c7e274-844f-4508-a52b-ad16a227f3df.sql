
-- 1. Remove rooms from realtime publication (app uses polling, not realtime).
--    Prevents any possibility of admin_key being broadcast over realtime channels.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.rooms';
  END IF;
END $$;

-- 2. Add strict input validation to all room RPC functions.
--    Room IDs: 6-16 alphanumeric chars (backward compatible with existing 6-char IDs).
--    Admin keys: 12-32 alphanumeric chars (backward compatible with existing 12-char keys).

CREATE OR REPLACE FUNCTION public.get_room_public(room_id_param text)
 RETURNS TABLE(id text, players jsonb, settings jsonb, day_night text, monarch text, initiative text, dungeon_progress integer, overlay_layout jsonb, history jsonb, created_at timestamp with time zone, last_updated timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF room_id_param IS NULL OR room_id_param !~ '^[A-Za-z0-9]{4,32}$' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT r.id, r.players, r.settings, r.day_night, r.monarch, r.initiative,
         r.dungeon_progress, r.overlay_layout, r.history, r.created_at, r.last_updated
  FROM public.rooms r
  WHERE r.id = room_id_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_room_admin(room_id text, provided_admin_key text)
 RETURNS TABLE(is_admin boolean, room_data jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF room_id IS NULL OR provided_admin_key IS NULL
     OR room_id !~ '^[A-Za-z0-9]{4,32}$'
     OR provided_admin_key !~ '^[A-Za-z0-9]{8,64}$' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    (r.admin_key = provided_admin_key) as is_admin,
    jsonb_build_object(
      'id', r.id,
      'players', r.players,
      'settings', r.settings,
      'day_night', r.day_night,
      'monarch', r.monarch,
      'initiative', r.initiative,
      'dungeon_progress', r.dungeon_progress,
      'overlay_layout', r.overlay_layout,
      'history', r.history,
      'created_at', r.created_at,
      'last_updated', r.last_updated
    ) as room_data
  FROM public.rooms r
  WHERE r.id = room_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_room_as_admin(room_id text, provided_admin_key text, room_data jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stored_key TEXT;
BEGIN
  IF room_id IS NULL OR provided_admin_key IS NULL
     OR room_id !~ '^[A-Za-z0-9]{4,32}$'
     OR provided_admin_key !~ '^[A-Za-z0-9]{8,64}$' THEN
    RETURN FALSE;
  END IF;

  SELECT admin_key INTO stored_key FROM public.rooms WHERE id = room_id;
  
  IF stored_key IS NULL OR stored_key != provided_admin_key THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.rooms SET
    players = COALESCE(room_data->>'players', players::text)::jsonb,
    settings = COALESCE(room_data->>'settings', settings::text)::jsonb,
    day_night = COALESCE(room_data->>'day_night', day_night),
    monarch = room_data->>'monarch',
    initiative = room_data->>'initiative',
    dungeon_progress = COALESCE((room_data->>'dungeon_progress')::integer, dungeon_progress),
    overlay_layout = COALESCE(room_data->'overlay_layout', overlay_layout),
    history = COALESCE(room_data->'history', history)
  WHERE id = room_id;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_room_as_admin(room_id text, provided_admin_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  stored_key TEXT;
BEGIN
  IF room_id IS NULL OR provided_admin_key IS NULL
     OR room_id !~ '^[A-Za-z0-9]{4,32}$'
     OR provided_admin_key !~ '^[A-Za-z0-9]{8,64}$' THEN
    RETURN FALSE;
  END IF;

  SELECT admin_key INTO stored_key FROM public.rooms WHERE id = room_id;
  
  IF stored_key IS NULL OR stored_key != provided_admin_key THEN
    RETURN FALSE;
  END IF;
  
  DELETE FROM public.rooms WHERE id = room_id;
  RETURN TRUE;
END;
$function$;
