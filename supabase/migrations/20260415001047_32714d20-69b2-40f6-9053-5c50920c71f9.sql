CREATE OR REPLACE FUNCTION public.normalize_login(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(lower(regexp_replace(coalesce(input_text, ''), '[^a-zA-Z0-9._-]+', '', 'g')), '');
$$;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS login text;

WITH source AS (
  SELECT
    p.id,
    COALESCE(
      public.normalize_login(NULLIF(au.raw_user_meta_data->>'login', '')),
      public.normalize_login(split_part(COALESCE(au.email, p.email, 'usuario'), '@', 1)),
      'usuario'
    ) AS base_login
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  WHERE p.login IS NULL OR btrim(p.login) = ''
), ranked AS (
  SELECT
    id,
    base_login,
    row_number() OVER (PARTITION BY base_login ORDER BY id) AS rn
  FROM source
), final_logins AS (
  SELECT
    id,
    CASE WHEN rn = 1 THEN base_login ELSE base_login || rn::text END AS final_login
  FROM ranked
)
UPDATE public.profiles p
SET login = f.final_login
FROM final_logins f
WHERE p.id = f.id;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_login_unique_idx
ON public.profiles (lower(login))
WHERE login IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, login)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'real_email', NEW.email),
    COALESCE(
      public.normalize_login(NULLIF(NEW.raw_user_meta_data->>'login', '')),
      public.normalize_login(split_part(NEW.email, '@', 1)),
      'usuario'
    )
  );
  RETURN NEW;
END;
$function$;