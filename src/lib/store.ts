// Local data store for ME PARK AI (will be replaced by Supabase later)
import { useState, useCallback } from 'react';

export interface Vehicle {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  marca?: string;
  clienteId?: string;
}

export interface Client {
  id: string;
  nome: string;
  cpfCnpj?: string;
  telefone?: string;
  email?: string;
  tipo: 'eventual' | 'mensalista';
  status: 'ativo' | 'inativo';
}

export interface Movimentacao {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  clienteNome?: string;
  tipoCliente: 'avulso' | 'mensalista';
  entrada: Date;
  saida?: Date;
  tempoTotal?: string;
  valorHora: number;
  valorTotal?: number;
  formaPagamento?: 'pix' | 'dinheiro';
  statusPagamento: 'pendente' | 'pago';
  statusMovimentacao: 'ativo' | 'finalizado';
  observacao?: string;
}

const STORAGE_KEY = 'mepark_data';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadData(): { movimentacoes: Movimentacao[]; clientes: Client[]; veiculos: Vehicle[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      data.movimentacoes = (data.movimentacoes || []).map((m: any) => ({
        ...m,
        entrada: new Date(m.entrada),
        saida: m.saida ? new Date(m.saida) : undefined,
      }));
      return data;
    }
  } catch {}
  return { movimentacoes: [], clientes: [], veiculos: [] };
}

function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Seed demo data
function seedDemoData() {
  const data = loadData();
  if (data.movimentacoes.length > 0) return data;

  const now = new Date();
  const placas = ['ABC1D23', 'XYZ4E56', 'MNO7F89', 'JKL2G34', 'DEF5H67', 'GHI8I90', 'PQR3J45', 'STU6K78'];
  const modelos = ['Honda Civic', 'Toyota Corolla', 'VW Golf', 'Fiat Argo', 'Hyundai HB20', 'Chevrolet Onix', 'Ford Ka', 'Jeep Renegade'];
  const cores = ['Preto', 'Branco', 'Prata', 'Vermelho', 'Azul', 'Cinza', 'Verde', 'Amarelo'];

  // Active vehicles
  for (let i = 0; i < 5; i++) {
    const hoursAgo = Math.floor(Math.random() * 6) + 1;
    data.movimentacoes.push({
      id: generateId(),
      placa: placas[i],
      modelo: modelos[i],
      cor: cores[i],
      tipoCliente: 'avulso',
      entrada: new Date(now.getTime() - hoursAgo * 3600000),
      valorHora: 12,
      statusPagamento: 'pendente',
      statusMovimentacao: 'ativo',
    });
  }

  // Completed today
  for (let i = 5; i < 8; i++) {
    const hoursAgoIn = Math.floor(Math.random() * 8) + 4;
    const hoursAgoOut = Math.floor(Math.random() * 3) + 1;
    const entrada = new Date(now.getTime() - hoursAgoIn * 3600000);
    const saida = new Date(now.getTime() - hoursAgoOut * 3600000);
    const diffH = (saida.getTime() - entrada.getTime()) / 3600000;
    data.movimentacoes.push({
      id: generateId(),
      placa: placas[i],
      modelo: modelos[i],
      cor: cores[i],
      tipoCliente: 'avulso',
      entrada,
      saida,
      tempoTotal: `${Math.floor(diffH)}h ${Math.round((diffH % 1) * 60)}min`,
      valorHora: 12,
      valorTotal: Math.ceil(diffH) * 12,
      formaPagamento: i % 2 === 0 ? 'pix' : 'dinheiro',
      statusPagamento: 'pago',
      statusMovimentacao: 'finalizado',
    });
  }

  saveData(data);
  return data;
}

export function useStore() {
  const [data, setData] = useState(() => seedDemoData());

  const refresh = useCallback(() => setData(loadData()), []);

  const registrarEntrada = useCallback((mov: Omit<Movimentacao, 'id' | 'entrada' | 'statusPagamento' | 'statusMovimentacao' | 'valorHora'>) => {
    const updated = loadData();
    const newMov: Movimentacao = {
      ...mov,
      id: generateId(),
      entrada: new Date(),
      valorHora: 12,
      statusPagamento: 'pendente',
      statusMovimentacao: 'ativo',
    };
    updated.movimentacoes.push(newMov);
    saveData(updated);
    setData(updated);
    return newMov;
  }, []);

  const registrarSaida = useCallback((id: string, formaPagamento: 'pix' | 'dinheiro') => {
    const updated = loadData();
    const mov = updated.movimentacoes.find((m: Movimentacao) => m.id === id);
    if (!mov) return null;
    
    const saida = new Date();
    const diffMs = saida.getTime() - new Date(mov.entrada).getTime();
    const diffH = diffMs / 3600000;
    const hours = Math.floor(diffH);
    const mins = Math.round((diffH % 1) * 60);

    mov.saida = saida;
    mov.tempoTotal = `${hours}h ${mins}min`;
    mov.valorTotal = Math.max(Math.ceil(diffH), 1) * mov.valorHora;
    mov.formaPagamento = formaPagamento;
    mov.statusPagamento = 'pago';
    mov.statusMovimentacao = 'finalizado';

    saveData(updated);
    setData(updated);
    return mov;
  }, []);

  const veiculosAtivos = data.movimentacoes.filter((m: Movimentacao) => m.statusMovimentacao === 'ativo');
  const movimentacoesHoje = data.movimentacoes.filter((m: Movimentacao) => {
    const today = new Date();
    const d = new Date(m.entrada);
    return d.toDateString() === today.toDateString();
  });
  const saidasHoje = movimentacoesHoje.filter((m: Movimentacao) => m.statusMovimentacao === 'finalizado');
  const faturamentoHoje = saidasHoje.reduce((sum: number, m: Movimentacao) => sum + (m.valorTotal || 0), 0);

  return {
    data,
    refresh,
    registrarEntrada,
    registrarSaida,
    veiculosAtivos,
    movimentacoesHoje,
    saidasHoje,
    faturamentoHoje,
  };
}
