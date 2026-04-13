
-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela text NOT NULL,
  registro_id uuid,
  acao text NOT NULL, -- INSERT, UPDATE, DELETE
  dados_anteriores jsonb,
  dados_novos jsonb,
  usuario_id uuid,
  usuario_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view (admin check done in app)
CREATE POLICY "Authenticated can view audit_logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (true);

-- Allow inserts from triggers (service role) and authenticated
CREATE POLICY "Allow insert audit_logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Index for quick filtering
CREATE INDEX idx_audit_logs_tabela ON public.audit_logs (tabela);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (tabela, registro_id, acao, dados_anteriores, dados_novos, usuario_id)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach triggers to main tables
CREATE TRIGGER audit_movimentacoes AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER audit_veiculos AFTER INSERT OR UPDATE OR DELETE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER audit_clientes AFTER INSERT OR UPDATE OR DELETE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER audit_mensalistas AFTER INSERT OR UPDATE OR DELETE ON public.mensalistas FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER audit_pagamentos AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER audit_configuracoes AFTER INSERT OR UPDATE OR DELETE ON public.configuracoes FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER audit_unidades AFTER INSERT OR UPDATE OR DELETE ON public.unidades FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
