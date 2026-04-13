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
    mutationFn: async (mov: { placa: string; marca?: string; modelo: string; cor: string; tipo_cliente: string; observacao?: string; foto_url?: string; categoria?: string }) => {
      const placaUpper = mov.placa.toUpperCase();
      const marcaInformada = mov.marca?.trim() || '';
      const modeloInformado = mov.modelo?.trim() || 'N/I';
      const corInformada = mov.cor?.trim() || '';

      const { data: veiculoExistente, error: veiculoFetchError } = await supabase
        .from('veiculos')
        .select('id, marca, modelo, cor')
        .eq('placa', placaUpper)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (veiculoFetchError) throw veiculoFetchError;

      const marcaFinal = marcaInformada || veiculoExistente?.marca || '';
      const modeloFinal = modeloInformado !== 'N/I' ? modeloInformado : veiculoExistente?.modelo || 'N/I';
      const corFinal = corInformada || veiculoExistente?.cor || '';

      let veiculoId = veiculoExistente?.id || null;

      if (veiculoExistente) {
        const { error: veiculoUpdateError } = await supabase
          .from('veiculos')
          .update({
            marca: marcaFinal || null,
            modelo: modeloFinal,
            cor: corFinal || null,
          })
          .eq('id', veiculoExistente.id);
        if (veiculoUpdateError) throw veiculoUpdateError;
      } else if (marcaFinal || modeloFinal !== 'N/I' || corFinal) {
        const { data: veiculoCriado, error: veiculoInsertError } = await supabase
          .from('veiculos')
          .insert({
            placa: placaUpper,
            marca: marcaFinal || null,
            modelo: modeloFinal,
            cor: corFinal || null,
          })
          .select('id')
          .single();
        if (veiculoInsertError) throw veiculoInsertError;
        veiculoId = veiculoCriado.id;
      }

      const modeloMovimentacao = [marcaFinal, modeloFinal !== 'N/I' ? modeloFinal : '']
        .filter(Boolean)
        .join(' ')
        .trim() || 'N/I';

      // Fetch config to get correct valor_hora based on category
      const categoriaVeiculo = mov.categoria || 'carro';
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('valor_hora, valor_hora_moto, valor_maximo_diario, valor_maximo_diario_moto')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const valorHora = categoriaVeiculo === 'moto' 
        ? Number((configData as any)?.valor_hora_moto ?? 6) 
        : Number(configData?.valor_hora ?? 12);

      const { data, error } = await supabase
        .from('movimentacoes')
        .insert({
          placa: placaUpper,
          veiculo_id: veiculoId,
          modelo: modeloMovimentacao,
          cor: corFinal || null,
          tipo_cliente: mov.tipo_cliente,
          observacao: mov.observacao,
          valor_hora: valorHora,
          foto_url: mov.foto_url || null,
          categoria: categoriaVeiculo,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
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
      let valorTotal = Math.max(Math.ceil(diffH), 1) * Number(mov.valor_hora);

      // Apply daily max cap based on category
      const categoria = (mov as any).categoria || 'carro';
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('valor_maximo_diario, valor_maximo_diario_moto')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const maxDiario = categoria === 'moto' 
        ? Number((configData as any)?.valor_maximo_diario_moto ?? 15)
        : Number(configData?.valor_maximo_diario ?? 35);
      
      if (maxDiario > 0 && valorTotal > maxDiario) {
        valorTotal = maxDiario;
      }

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
