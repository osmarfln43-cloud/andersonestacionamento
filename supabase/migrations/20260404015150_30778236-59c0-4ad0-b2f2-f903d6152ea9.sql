ALTER TABLE public.configuracoes 
  ADD COLUMN IF NOT EXISTS horario_abertura text DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS horario_fechamento text DEFAULT '19:00',
  ADD COLUMN IF NOT EXISTS dias_funcionamento text DEFAULT 'Segunda a Sexta',
  ADD COLUMN IF NOT EXISTS disclaimer_comprovante text DEFAULT 'NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO';