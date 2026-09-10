// Aggregations for the cash-flow panel

export type PeriodoId = 'hoje' | 'semana' | 'mes' | 'dias30' | 'semestre' | 'ano' | 'personalizado';

export const PERIODOS: { id: PeriodoId; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mês' },
  { id: 'dias30', label: 'Últimos 30 dias' },
  { id: 'semestre', label: 'Últimos 6 meses' },
  { id: 'ano', label: 'Último ano' },
  { id: 'personalizado', label: 'Personalizado' },
];

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function resolvePeriodo(
  periodo: PeriodoId,
  custom?: { de?: string; ate?: string },
): { inicio: Date; fim: Date } {
  const hoje = new Date();
  const fim = endOfDay(hoje);

  switch (periodo) {
    case 'hoje':
      return { inicio: startOfDay(hoje), fim };
    case 'semana': {
      const inicio = startOfDay(hoje);
      const diaSemana = inicio.getDay(); // 0 = domingo
      inicio.setDate(inicio.getDate() - diaSemana);
      return { inicio, fim };
    }
    case 'mes': {
      const inicio = startOfDay(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
      return { inicio, fim };
    }
    case 'dias30': {
      const inicio = startOfDay(hoje);
      inicio.setDate(inicio.getDate() - 29);
      return { inicio, fim };
    }
    case 'semestre': {
      const inicio = startOfDay(hoje);
      inicio.setMonth(inicio.getMonth() - 6);
      return { inicio, fim };
    }
    case 'ano': {
      const inicio = startOfDay(hoje);
      inicio.setFullYear(inicio.getFullYear() - 1);
      return { inicio, fim };
    }
    case 'personalizado': {
      const inicio = custom?.de ? startOfDay(new Date(`${custom.de}T00:00:00`)) : startOfDay(hoje);
      const fimCustom = custom?.ate ? endOfDay(new Date(`${custom.ate}T00:00:00`)) : fim;
      return { inicio, fim: fimCustom };
    }
  }
}

export function formatBRL(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

export type MovLike = {
  entrada: string;
  saida: string | null;
  valor_total: number | null;
  forma_pagamento: string | null;
  tipo_cliente: string | null;
  categoria?: string | null;
  status_movimentacao: string;
};

export type DespesaLike = { data: string; valor: number; categoria: string };

function bucketKey(date: Date, granularidade: 'dia' | 'mes') {
  if (granularidade === 'mes') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function bucketLabel(key: string, granularidade: 'dia' | 'mes') {
  const parts = key.split('-');
  if (granularidade === 'mes') {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  }
  return `${parts[2]}/${parts[1]}`;
}

export function aggregate(
  movimentacoes: MovLike[],
  despesas: DespesaLike[],
  inicio: Date,
  fim: Date,
) {
  const dias = Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / 86400000));
  const granularidade: 'dia' | 'mes' = dias > 62 ? 'mes' : 'dia';

  const finalizadas = movimentacoes.filter((m) => {
    if (m.status_movimentacao !== 'finalizado' || !m.saida) return false;
    const d = new Date(m.saida);
    return d >= inicio && d <= fim;
  });

  const entradasPeriodo = movimentacoes.filter((m) => {
    const d = new Date(m.entrada);
    return d >= inicio && d <= fim;
  });

  const despesasPeriodo = despesas.filter((d) => {
    const data = new Date(`${d.data}T12:00:00`);
    return data >= inicio && data <= fim;
  });

  const receita = finalizadas.reduce((s, m) => s + Number(m.valor_total || 0), 0);
  const despesaTotal = despesasPeriodo.reduce((s, d) => s + Number(d.valor || 0), 0);

  const receitaDinheiro = finalizadas
    .filter((m) => m.forma_pagamento === 'dinheiro')
    .reduce((s, m) => s + Number(m.valor_total || 0), 0);
  const receitaPix = finalizadas
    .filter((m) => m.forma_pagamento === 'pix')
    .reduce((s, m) => s + Number(m.valor_total || 0), 0);
  const receitaMensalista = finalizadas
    .filter((m) => m.tipo_cliente === 'mensalista')
    .reduce((s, m) => s + Number(m.valor_total || 0), 0);
  const receitaAvulso = receita - receitaMensalista;

  // Tempo médio de permanência (minutos) e horários de pico
  let minutosTotais = 0;
  const porHora = new Array(24).fill(0);
  finalizadas.forEach((m) => {
    const ent = new Date(m.entrada).getTime();
    const sai = new Date(m.saida as string).getTime();
    if (sai > ent) minutosTotais += (sai - ent) / 60000;
  });
  entradasPeriodo.forEach((m) => {
    porHora[new Date(m.entrada).getHours()] += 1;
  });

  const tempoMedioMin = finalizadas.length ? minutosTotais / finalizadas.length : 0;
  const picos = porHora
    .map((qtd, hora) => ({ hora, qtd }))
    .filter((h) => h.qtd > 0)
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 3);

  // Séries temporais
  const map = new Map<string, { receita: number; despesa: number; veiculos: number }>();
  const touch = (key: string) => {
    if (!map.has(key)) map.set(key, { receita: 0, despesa: 0, veiculos: 0 });
    return map.get(key)!;
  };
  finalizadas.forEach((m) => {
    const b = touch(bucketKey(new Date(m.saida as string), granularidade));
    b.receita += Number(m.valor_total || 0);
    b.veiculos += 1;
  });
  despesasPeriodo.forEach((d) => {
    touch(bucketKey(new Date(`${d.data}T12:00:00`), granularidade)).despesa += Number(d.valor || 0);
  });

  const serie = Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({
      key,
      label: bucketLabel(key, granularidade),
      receita: Number(v.receita.toFixed(2)),
      despesa: Number(v.despesa.toFixed(2)),
      lucro: Number((v.receita - v.despesa).toFixed(2)),
      veiculos: v.veiculos,
    }));

  const despesasPorCategoria = Array.from(
    despesasPeriodo.reduce((acc, d) => {
      acc.set(d.categoria, (acc.get(d.categoria) || 0) + Number(d.valor || 0));
      return acc;
    }, new Map<string, number>()),
  )
    .map(([categoria, valor]) => ({ categoria, valor: Number(valor.toFixed(2)) }))
    .sort((a, b) => b.valor - a.valor);

  return {
    granularidade,
    dias,
    receita,
    despesa: despesaTotal,
    lucro: receita - despesaTotal,
    receitaDinheiro,
    receitaPix,
    receitaAvulso,
    receitaMensalista,
    veiculosAtendidos: finalizadas.length,
    entradasPeriodo: entradasPeriodo.length,
    ticketMedio: finalizadas.length ? receita / finalizadas.length : 0,
    tempoMedioMin,
    ocupacaoMediaDia: entradasPeriodo.length / dias,
    picos,
    serie,
    despesasPorCategoria,
    despesasPeriodo,
  };
}

/** Fechamentos por dia / mês / semestre / ano dentro do período informado. */
export function fechamentos(
  movimentacoes: MovLike[],
  despesas: DespesaLike[],
  tipo: 'diario' | 'mensal' | 'semestral' | 'anual',
  inicio: Date,
  fim: Date,
) {
  const keyOf = (d: Date) => {
    switch (tipo) {
      case 'diario':
        return d.toLocaleDateString('pt-BR');
      case 'mensal':
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      case 'semestral':
        return `${d.getMonth() < 6 ? '1º' : '2º'} sem ${d.getFullYear()}`;
      case 'anual':
        return String(d.getFullYear());
    }
  };
  const sortKeyOf = (d: Date) => {
    switch (tipo) {
      case 'diario':
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      case 'mensal':
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
      case 'semestral':
        return `${d.getFullYear()}${d.getMonth() < 6 ? '1' : '2'}`;
      case 'anual':
        return String(d.getFullYear());
    }
  };

  const map = new Map<string, { sort: string; label: string; receita: number; despesa: number; veiculos: number }>();
  const touch = (d: Date) => {
    const label = keyOf(d);
    if (!map.has(label)) map.set(label, { sort: sortKeyOf(d), label, receita: 0, despesa: 0, veiculos: 0 });
    return map.get(label)!;
  };

  movimentacoes.forEach((m) => {
    if (m.status_movimentacao !== 'finalizado' || !m.saida) return;
    const d = new Date(m.saida);
    if (d < inicio || d > fim) return;
    const row = touch(d);
    row.receita += Number(m.valor_total || 0);
    row.veiculos += 1;
  });

  despesas.forEach((dp) => {
    const d = new Date(`${dp.data}T12:00:00`);
    if (d < inicio || d > fim) return;
    touch(d).despesa += Number(dp.valor || 0);
  });

  return Array.from(map.values())
    .sort((a, b) => b.sort.localeCompare(a.sort))
    .map((r) => ({ ...r, lucro: r.receita - r.despesa }));
}
