import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Movimentacoes
export function useMovimentacoesAtivas() {
  return useQuery({
    queryKey: ['movimentacoes', 'ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .eq('status_movimentacao', 'ativo')
        .order('entrada', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useMovimentacoesFinalizadasHoje() {
  return useQuery({
    queryKey: ['movimentacoes', 'finalizadas-hoje'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .eq('status_movimentacao', 'finalizado')
        .gte('saida', today.toISOString())
        .order('saida', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useMovimentacoesHoje() {
  return useQuery({
    queryKey: ['movimentacoes', 'hoje'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .gte('entrada', today.toISOString())
        .order('entrada', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useRegistrarEntrada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mov: { placa: string; modelo: string; cor: string; tipo_cliente: string; observacao?: string; foto_url?: string }) => {
      const { data, error } = await supabase
        .from('movimentacoes')
        .insert({
          placa: mov.placa.toUpperCase(),
          modelo: mov.modelo,
          cor: mov.cor,
          tipo_cliente: mov.tipo_cliente,
          observacao: mov.observacao,
          valor_hora: 12,
          foto_url: mov.foto_url || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
    },
  });
}

export function useRegistrarSaida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, forma_pagamento }: { id: string; forma_pagamento: 'pix' | 'dinheiro' }) => {
      // Get the movimentacao first
      const { data: mov, error: fetchError } = await supabase
        .from('movimentacoes')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError || !mov) throw fetchError || new Error('Not found');

      const saida = new Date();
      const entrada = new Date(mov.entrada);
      const diffMs = saida.getTime() - entrada.getTime();
      const diffH = diffMs / 3600000;
      const hours = Math.floor(diffH);
      const mins = Math.round((diffH % 1) * 60);
      const valorTotal = Math.max(Math.ceil(diffH), 1) * Number(mov.valor_hora);

      const { data, error } = await supabase
        .from('movimentacoes')
        .update({
          saida: saida.toISOString(),
          tempo_total: `${hours}h ${mins}min`,
          valor_total: valorTotal,
          forma_pagamento,
          status_pagamento: 'pago',
          status_movimentacao: 'finalizado',
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Create payment record
      await supabase.from('pagamentos').insert({
        movimentacao_id: id,
        tipo: forma_pagamento,
        valor: valorTotal,
        status: 'pago',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
    },
  });
}

// Clientes
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clientes').select('*').order('nome');
      if (error) throw error;
      return data;
    },
  });
}

// Veiculos
export function useVeiculos() {
  return useQuery({
    queryKey: ['veiculos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('veiculos').select('*, clientes(nome)').order('placa');
      if (error) throw error;
      return data;
    },
  });
}

// Mensalistas
export function useMensalistas() {
  return useQuery({
    queryKey: ['mensalistas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mensalistas').select('*, clientes(nome), veiculos(placa)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Configuracoes
export function useConfiguracoes() {
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
