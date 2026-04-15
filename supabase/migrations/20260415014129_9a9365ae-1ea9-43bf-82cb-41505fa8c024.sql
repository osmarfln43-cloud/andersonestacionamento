
-- Function to resolve a login identifier to auth email, accessible by anon
CREATE OR REPLACE FUNCTION public.resolve_auth_email(identifier text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(
      -- Try exact email match first
      (SELECT email FROM public.profiles WHERE email = lower(trim(identifier)) LIMIT 1),
      -- Then try login match
      (SELECT email FROM public.profiles WHERE login = public.normalize_login(identifier) LIMIT 1)
    );
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.resolve_auth_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_auth_email(text) TO authenticated;
