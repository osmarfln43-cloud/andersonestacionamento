
ALTER TABLE public.configuracoes ADD COLUMN IF NOT EXISTS valor_hora_moto numeric NOT NULL DEFAULT 6.00;

ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'carro';
