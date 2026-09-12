CREATE OR REPLACE FUNCTION public.get_room_version(room_id_param text)
RETURNS TABLE(id text, last_updated timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF room_id_param IS NULL OR room_id_param !~ '^[A-Za-z0-9]{4,32}$' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT r.id, r.last_updated
  FROM public.rooms r
  WHERE r.id = room_id_param;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_room_version(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_room_version(text) TO anon, authenticated, service_role;