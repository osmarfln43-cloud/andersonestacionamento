import { FileText, Download, Filter, DollarSign, Car, Clock, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const tooltipStyle = {
  background: 'hsl(225, 22%, 9%)',
  border: '1px solid hsl(225, 15%, 16%)',
  borderRadius: 12,
  fontSize: 12,
  padding: '10px 14px',
  boxShadow: '0 8px 32px -8px hsl(0 0% 0% / 0.5)',
};

type Periodo = 'hoje' | 'semanal' | 'quinzenal' | 'mensal';

function getDateRange(periodo: Periodo) {
  const now = new Date();
  const ate = new Date(now);
  ate.setHours(23, 59, 59, 999);
  const de = new Date(now);
  de.setHours(0, 0, 0, 0);

  switch (periodo) {
    case 'hoje': break;
    case 'semanal': de.setDate(de.getDate() - 7); break;
    case 'quinzenal': de.setDate(de.getDate() - 15); break;
    case 'mensal': de.setDate(1); break;
  }
  return { de, ate };
}

function useMovimentacoesPeriodo(periodo: Periodo, customDe?: string, customAte?: string) {
  return useQuery({
    queryKey: ['movimentacoes', 'relatorio', periodo, customDe, customAte],
    queryFn: async () => {
      let deDate: string, ateDate: string;
      if (customDe && customAte) {
        deDate = new Date(customDe).toISOString();
        ateDate = new Date(customAte + 'T23:59:59').toISOString();
      } else {
        const range = getDateRange(periodo);
        deDate = range.de.toISOString();
        ateDate = range.ate.toISOString();
      }
      const { data, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .gte('entrada', deDate)
        .lte('entrada', ateDate)
        .order('entrada', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>('mensal');
  const [customDe, setCustomDe] = useState('');
  const [customAte, setCustomAte] = useState('');
  const [filtroPlaca, setFiltroPlaca] = useState('');

  const { data: movimentacoes = [] } = useMovimentacoesPeriodo(
    periodo,
    customDe || undefined,
    customAte || undefined
  );

  const filtrados = filtroPlaca
    ? movimentacoes.filter(m => m.placa.includes(filtroPlaca.toUpperCase()))
    : movimentacoes;

  const finalizados = filtrados.filter(m => m.status_movimentacao === 'finalizado');
  const ativos = filtrados.filter(m => m.status_movimentacao === 'ativo');
  const faturamento = finalizados.reduce((sum, m) => sum + (Number(m.valor_total) || 0), 0);
  const ticketMedio = finalizados.length > 0 ? faturamento / finalizados.length : 0;
  const pixCount = finalizados.filter(m => m.forma_pagamento === 'pix').length;
  const dinheiroCount = finalizados.filter(m => m.forma_pagamento === 'dinheiro').length;

  const chartData = useMemo(() => {
    const days: Record<string, { dia: string; faturamento: number; veiculos: number }> = {};
    finalizados.forEach(m => {
      const d = new Date(m.entrada).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      days[d] = days[d] || { dia: d, faturamento: 0, veiculos: 0 };
      days[d].faturamento += Number(m.valor_total) || 0;
      days[d].veiculos += 1;
    });
    return Object.values(days).sort((a, b) => {
      const [da, ma] = a.dia.split('/').map(Number);
      const [db, mb] = b.dia.split('/').map(Number);
      return (ma * 100 + da) - (mb * 100 + db);
    });
  }, [finalizados]);

  const periodoLabel = { hoje: 'Hoje', semanal: 'Última Semana', quinzenal: 'Últimos 15 Dias', mensal: 'Este Mês' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Análises e relatórios operacionais completos</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="section-title">Período</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {(['hoje', 'semanal', 'quinzenal', 'mensal'] as Periodo[]).map(p => (
            <button
              key={p}
              onClick={() => { setPeriodo(p); setCustomDe(''); setCustomAte(''); }}
              className={`h-11 rounded-xl text-sm font-medium transition-all border-2 ${
                periodo === p && !customDe ? 'border-primary bg-primary/[0.06] text-primary' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {periodoLabel[p]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><p className="stat-label mb-1.5">De</p><Input type="date" value={customDe} onChange={e => setCustomDe(e.target.value)} className="h-11" /></div>
          <div><p className="stat-label mb-1.5">Até</p><Input type="date" value={customAte} onChange={e => setCustomAte(e.target.value)} className="h-11" /></div>
          <div><p className="stat-label mb-1.5">Placa</p><Input placeholder="ABC1D23" value={filtroPlaca} onChange={e => setFiltroPlaca(e.target.value)} className="h-11 font-mono" /></div>
          <div className="flex items-end"><Button onClick={() => { setCustomDe(''); setCustomAte(''); setFiltroPlaca(''); setPeriodo('mensal'); }} variant="outline" className="w-full h-11 rounded-xl">Limpar</Button></div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { icon: Car, label: 'Total Entradas', value: filtrados.length, color: 'text-primary' },
          { icon: Car, label: 'Saídas', value: finalizados.length, color: 'text-accent' },
          { icon: Clock, label: 'Em Aberto', value: ativos.length, color: 'text-warning' },
          { icon: DollarSign, label: 'Faturamento', value: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-accent' },
          { icon: TrendingUp, label: 'Ticket Médio', value: `R$ ${ticketMedio.toFixed(2)}`, color: 'text-foreground' },
          { icon: DollarSign, label: 'PIX / Dinheiro', value: `${pixCount} / ${dinheiroCount}`, color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2"><s.icon className="h-4 w-4 text-muted-foreground" /><p className="stat-label">{s.label}</p></div>
            <p className={`stat-value ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="section-title mb-6">Faturamento por Dia — {customDe ? 'Personalizado' : periodoLabel[periodo]}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="faturamento" name="Faturamento" fill="hsl(217,91%,60%)" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="veiculos" name="Veículos" fill="hsl(160,65%,48%)" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h3 className="section-title">Movimentações ({filtrados.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 stat-label">Placa</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Modelo</th>
                <th className="text-left p-4 stat-label">Entrada</th>
                <th className="text-left p-4 stat-label">Saída</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Tempo</th>
                <th className="text-left p-4 stat-label">Valor</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Pagamento</th>
                <th className="text-left p-4 stat-label">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhuma movimentação encontrada</td></tr>
              ) : filtrados.map((m) => (
                <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground tracking-wide">{m.placa}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{m.modelo}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{new Date(m.entrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{m.saida ? new Date(m.saida).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                  <td className="p-4 text-xs text-muted-foreground hidden md:table-cell">{m.tempo_total || '—'}</td>
                  <td className="p-4 font-display font-bold text-foreground">{m.valor_total ? `R$ ${Number(m.valor_total).toFixed(2)}` : '—'}</td>
                  <td className="p-4 text-xs uppercase font-semibold text-muted-foreground hidden md:table-cell">{m.forma_pagamento || '—'}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${m.status_movimentacao === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                      {m.status_movimentacao === 'ativo' ? 'Ativo' : 'Finalizado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
