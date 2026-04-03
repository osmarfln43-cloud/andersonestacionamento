
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT,
  perfil TEXT NOT NULL DEFAULT 'operador' CHECK (perfil IN ('admin', 'gerente', 'operador', 'financeiro')),
  unidade_id UUID,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Unidades
CREATE TABLE public.unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  chave_pix TEXT,
  valor_hora NUMERIC(10,2) NOT NULL DEFAULT 12.00,
  vagas INTEGER NOT NULL DEFAULT 50,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view unidades" ON public.unidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert unidades" ON public.unidades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update unidades" ON public.unidades FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON public.unidades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add FK on profiles after unidades exists
ALTER TABLE public.profiles ADD CONSTRAINT profiles_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.unidades(id);

-- Clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID REFERENCES public.unidades(id),
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  tipo TEXT NOT NULL DEFAULT 'eventual' CHECK (tipo IN ('eventual', 'mensalista')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update clientes" ON public.clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete clientes" ON public.clientes FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Veiculos
CREATE TABLE public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID REFERENCES public.unidades(id),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  placa TEXT NOT NULL,
  marca TEXT,
  modelo TEXT NOT NULL,
  cor TEXT,
  categoria TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view veiculos" ON public.veiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert veiculos" ON public.veiculos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update veiculos" ON public.veiculos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete veiculos" ON public.veiculos FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON public.veiculos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mensalistas
CREATE TABLE public.mensalistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID REFERENCES public.unidades(id),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  plano TEXT NOT NULL DEFAULT 'Mensal Integral',
  valor_mensal NUMERIC(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'atrasado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mensalistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view mensalistas" ON public.mensalistas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert mensalistas" ON public.mensalistas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update mensalistas" ON public.mensalistas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete mensalistas" ON public.mensalistas FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_mensalistas_updated_at BEFORE UPDATE ON public.mensalistas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Movimentacoes
CREATE TABLE public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID REFERENCES public.unidades(id),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL,
  placa TEXT NOT NULL,
  modelo TEXT,
  cor TEXT,
  tipo_cliente TEXT NOT NULL DEFAULT 'avulso' CHECK (tipo_cliente IN ('avulso', 'mensalista')),
  entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  saida TIMESTAMPTZ,
  tempo_total TEXT,
  valor_hora NUMERIC(10,2) NOT NULL DEFAULT 12.00,
  valor_total NUMERIC(10,2),
  forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'dinheiro')),
  status_pagamento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago')),
  status_movimentacao TEXT NOT NULL DEFAULT 'ativo' CHECK (status_movimentacao IN ('ativo', 'finalizado')),
  operador_entrada_id UUID REFERENCES auth.users(id),
  operador_saida_id UUID REFERENCES auth.users(id),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view movimentacoes" ON public.movimentacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert movimentacoes" ON public.movimentacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update movimentacoes" ON public.movimentacoes FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER update_movimentacoes_updated_at BEFORE UPDATE ON public.movimentacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pagamentos
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID REFERENCES public.unidades(id),
  movimentacao_id UUID REFERENCES public.movimentacoes(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pix', 'dinheiro')),
  valor NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pago' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  qr_code TEXT,
  codigo_pix TEXT,
  valor_recebido NUMERIC(10,2),
  troco NUMERIC(10,2),
  data_pagamento TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view pagamentos" ON public.pagamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert pagamentos" ON public.pagamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Configuracoes
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID REFERENCES public.unidades(id) UNIQUE,
  nome_estacionamento TEXT NOT NULL DEFAULT 'ME PARK AI',
  endereco TEXT,
  telefone TEXT,
  cnpj TEXT,
  valor_hora NUMERIC(10,2) NOT NULL DEFAULT 12.00,
  tolerancia_minutos INTEGER NOT NULL DEFAULT 15,
  valor_minimo NUMERIC(10,2) DEFAULT 6.00,
  valor_maximo_diario NUMERIC(10,2) DEFAULT 60.00,
  chave_pix TEXT,
  tipo_chave_pix TEXT DEFAULT 'email',
  nome_beneficiario TEXT,
  mensagem_comprovante TEXT DEFAULT 'Obrigado pela preferência!',
  largura_papel TEXT DEFAULT '80mm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view configuracoes" ON public.configuracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert configuracoes" ON public.configuracoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update configuracoes" ON public.configuracoes FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON public.configuracoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_movimentacoes_placa ON public.movimentacoes(placa);
CREATE INDEX idx_movimentacoes_status ON public.movimentacoes(status_movimentacao);
CREATE INDEX idx_movimentacoes_entrada ON public.movimentacoes(entrada);
CREATE INDEX idx_veiculos_placa ON public.veiculos(placa);
CREATE INDEX idx_clientes_cpf ON public.clientes(cpf_cnpj);
CREATE INDEX idx_mensalistas_status ON public.mensalistas(status);

-- Seed default unit
INSERT INTO public.unidades (nome, endereco, valor_hora, vagas, chave_pix)
VALUES ('ME PARK Centro', 'Rua Principal, 100 - Centro', 12.00, 50, 'mepark@estacionamento.com.br');

-- Seed default config
INSERT INTO public.configuracoes (unidade_id, nome_estacionamento, endereco, cnpj, chave_pix, nome_beneficiario)
SELECT id, 'ME PARK AI', 'Rua Principal, 100 - Centro', '12.345.678/0001-00', 'mepark@estacionamento.com.br', 'ME PARK ESTACIONAMENTO LTDA'
FROM public.unidades LIMIT 1;
