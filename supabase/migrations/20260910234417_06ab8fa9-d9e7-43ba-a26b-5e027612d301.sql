ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS ticket_codigo TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS movimentacoes_ticket_codigo_key ON public.movimentacoes (ticket_codigo) WHERE ticket_codigo IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.despesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id UUID REFERENCES public.unidades(id),
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'outros',
  valor NUMERIC NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT DEFAULT 'dinheiro',
  observacao TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas TO authenticated;
GRANT ALL ON public.despesas TO service_role;

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view despesas" ON public.despesas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert despesas" ON public.despesas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update despesas" ON public.despesas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete despesas" ON public.despesas FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_despesas_updated_at BEFORE UPDATE ON public.despesas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_despesas AFTER INSERT OR UPDATE OR DELETE ON public.despesas FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

CREATE INDEX IF NOT EXISTS despesas_data_idx ON public.despesas (data DESC);