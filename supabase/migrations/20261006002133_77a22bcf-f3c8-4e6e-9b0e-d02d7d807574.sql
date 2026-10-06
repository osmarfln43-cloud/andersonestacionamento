ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS nome_sistema text NOT NULL DEFAULT 'Anderson Estacionamento',
  ADD COLUMN IF NOT EXISTS logo_interna_url text,
  ADD COLUMN IF NOT EXISTS logo_login_url text,
  ADD COLUMN IF NOT EXISTS titulo_pagina_automatico boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.get_public_branding()
RETURNS TABLE (
  nome_sistema text,
  logo_login_url text,
  titulo_pagina_automatico boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(c.nome_sistema, 'Anderson Estacionamento'),
    c.logo_login_url,
    COALESCE(c.titulo_pagina_automatico, true)
  FROM public.configuracoes c
  ORDER BY c.updated_at DESC, c.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_branding() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_branding() TO anon, authenticated, service_role;