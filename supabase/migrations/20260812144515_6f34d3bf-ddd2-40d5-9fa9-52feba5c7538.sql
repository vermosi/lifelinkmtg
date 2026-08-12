REVOKE EXECUTE ON FUNCTION public.update_room_timestamp() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_room_timestamp() FROM authenticated;

-- Ensure service_role can still manage triggers if needed.
GRANT EXECUTE ON FUNCTION public.update_room_timestamp() TO service_role;