-- Drop the dangerous SELECT policy that exposes admin_key
DROP POLICY IF EXISTS "Anyone can read rooms" ON public.rooms;