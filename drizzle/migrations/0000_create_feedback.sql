CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  rating text NOT NULL CHECK (rating IN ('up','down')),
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 1000),
  email text CHECK (email IS NULL OR (char_length(email) <= 255 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  surface text NOT NULL DEFAULT 'unknown' CHECK (char_length(surface) <= 40)
);

GRANT ALL ON public.feedback TO service_role;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: writes go only through the validating RPC below.

CREATE OR REPLACE FUNCTION public.submit_feedback(
  p_rating text,
  p_message text DEFAULT '',
  p_email text DEFAULT NULL,
  p_surface text DEFAULT 'unknown'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message text := left(coalesce(btrim(p_message), ''), 1000);
  v_email text := nullif(btrim(coalesce(p_email, '')), '');
  v_surface text := left(coalesce(btrim(p_surface), 'unknown'), 40);
BEGIN
  IF p_rating NOT IN ('up','down') THEN
    RAISE EXCEPTION 'invalid rating';
  END IF;

  IF v_email IS NOT NULL AND v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid email';
  END IF;

  IF v_surface !~ '^[a-z_]{1,40}$' THEN
    v_surface := 'unknown';
  END IF;

  INSERT INTO public.feedback (rating, message, email, surface)
  VALUES (p_rating, v_message, v_email, v_surface);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_feedback(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_feedback(text, text, text, text) TO anon, authenticated, service_role;