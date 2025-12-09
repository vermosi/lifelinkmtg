-- Drop existing permissive RLS policies on rooms table
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can delete rooms" ON public.rooms;

-- Keep the INSERT policy but make it restrictive (only allow creating new rooms)
DROP POLICY IF EXISTS "Anyone can create rooms" ON public.rooms;
CREATE POLICY "Anyone can create rooms" ON public.rooms
FOR INSERT WITH CHECK (true);

-- Block all direct SELECT, UPDATE, DELETE on rooms table
-- (all operations must go through RPC functions)

-- Drop the rooms_public view since it won't work with blocked SELECT
DROP VIEW IF EXISTS public.rooms_public;

-- Create a security definer function to safely get room data without admin_key
CREATE OR REPLACE FUNCTION public.get_room_public(room_id_param text)
RETURNS TABLE(
  id text,
  players jsonb,
  settings jsonb,
  day_night text,
  monarch text,
  initiative text,
  dungeon_progress integer,
  overlay_layout jsonb,
  history jsonb,
  created_at timestamptz,
  last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.players,
    r.settings,
    r.day_night,
    r.monarch,
    r.initiative,
    r.dungeon_progress,
    r.overlay_layout,
    r.history,
    r.created_at,
    r.last_updated
  FROM public.rooms r
  WHERE r.id = room_id_param;
END;
$$;

-- Create a function to list recent rooms (without admin_key)
CREATE OR REPLACE FUNCTION public.get_recent_rooms(limit_count integer DEFAULT 10)
RETURNS TABLE(
  id text,
  players jsonb,
  settings jsonb,
  day_night text,
  monarch text,
  initiative text,
  dungeon_progress integer,
  overlay_layout jsonb,
  history jsonb,
  created_at timestamptz,
  last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.players,
    r.settings,
    r.day_night,
    r.monarch,
    r.initiative,
    r.dungeon_progress,
    r.overlay_layout,
    r.history,
    r.created_at,
    r.last_updated
  FROM public.rooms r
  ORDER BY r.last_updated DESC
  LIMIT limit_count;
END;
$$;