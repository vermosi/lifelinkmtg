-- Create a public view that excludes admin_key for safe querying
CREATE VIEW public.rooms_public AS
SELECT 
  id, 
  players, 
  settings, 
  day_night, 
  monarch, 
  initiative, 
  dungeon_progress, 
  overlay_layout, 
  history, 
  created_at, 
  last_updated
FROM public.rooms;

-- Enable RLS on the view
ALTER VIEW public.rooms_public SET (security_invoker = on);

-- Create a function to verify admin key server-side (returns room data only if key matches)
CREATE OR REPLACE FUNCTION public.verify_room_admin(room_id TEXT, provided_admin_key TEXT)
RETURNS TABLE (
  is_admin BOOLEAN,
  room_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- Create a function to update room only if admin key matches
CREATE OR REPLACE FUNCTION public.update_room_as_admin(
  room_id TEXT, 
  provided_admin_key TEXT,
  room_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_key TEXT;
BEGIN
  -- Get the stored admin key
  SELECT admin_key INTO stored_key FROM public.rooms WHERE id = room_id;
  
  -- If room doesn't exist or key doesn't match, return false
  IF stored_key IS NULL OR stored_key != provided_admin_key THEN
    RETURN FALSE;
  END IF;
  
  -- Update the room
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
$$;

-- Create a function to delete room only if admin key matches
CREATE OR REPLACE FUNCTION public.delete_room_as_admin(room_id TEXT, provided_admin_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_key TEXT;
BEGIN
  SELECT admin_key INTO stored_key FROM public.rooms WHERE id = room_id;
  
  IF stored_key IS NULL OR stored_key != provided_admin_key THEN
    RETURN FALSE;
  END IF;
  
  DELETE FROM public.rooms WHERE id = room_id;
  RETURN TRUE;
END;
$$;