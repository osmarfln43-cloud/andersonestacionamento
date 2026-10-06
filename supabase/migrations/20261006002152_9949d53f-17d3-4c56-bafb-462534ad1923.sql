DROP FUNCTION IF EXISTS public.get_public_branding();

CREATE TABLE public.identidade_visual (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_sistema text NOT NULL DEFAULT 'Anderson Estacionamento',
  logo_login_url text,
  titulo_pagina_automatico boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.identidade_visual TO anon, authenticated;
GRANT INSERT, UPDATE ON public.identidade_visual TO authenticated;
GRANT ALL ON public.identidade_visual TO service_role;

ALTER TABLE public.identidade_visual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Identidade visual publica para leitura"
ON public.identidade_visual FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Usuarios conectados podem criar identidade visual"
ON public.identidade_visual FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios conectados podem atualizar identidade visual"
ON public.identidade_visual FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_identidade_visual_updated_at
BEFORE UPDATE ON public.identidade_visual
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.identidade_visual (nome_sistema, logo_login_url, titulo_pagina_automatico)
SELECT
  COALESCE(c.nome_sistema, 'Anderson Estacionamento'),
  c.logo_login_url,
  COALESCE(c.titulo_pagina_automatico, true)
FROM public.configuracoes c
ORDER BY c.updated_at DESC, c.created_at DESC
LIMIT 1;