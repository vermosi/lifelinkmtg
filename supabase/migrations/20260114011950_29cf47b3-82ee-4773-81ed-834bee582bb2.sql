-- Block direct SELECT access to rooms table (forces use of RPC functions that exclude admin_key)
CREATE POLICY "Block direct select on rooms"
ON public.rooms
FOR SELECT
USING (false);

-- Block direct UPDATE access (forces use of update_room_as_admin RPC)
CREATE POLICY "Block direct update on rooms"
ON public.rooms
FOR UPDATE
USING (false);

-- Block direct DELETE access (forces use of delete_room_as_admin RPC)
CREATE POLICY "Block direct delete on rooms"
ON public.rooms
FOR DELETE
USING (false);