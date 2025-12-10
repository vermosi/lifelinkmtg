-- Add SELECT policy for rooms (needed for realtime subscriptions and room retrieval)
-- The RPC functions use SECURITY DEFINER so they bypass RLS, but realtime needs SELECT
CREATE POLICY "Anyone can read rooms"
ON public.rooms
FOR SELECT
USING (true);