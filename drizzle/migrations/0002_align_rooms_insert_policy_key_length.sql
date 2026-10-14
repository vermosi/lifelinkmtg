DROP POLICY "Anyone can create rooms" ON public.rooms;

CREATE POLICY "Anyone can create rooms"
ON public.rooms
FOR INSERT
TO public
WITH CHECK (
  id ~ '^[A-Za-z0-9_-]{6,32}$'
  AND length(admin_key) >= 12
  AND jsonb_typeof(players) = 'array'
  AND jsonb_typeof(settings) = 'object'
);