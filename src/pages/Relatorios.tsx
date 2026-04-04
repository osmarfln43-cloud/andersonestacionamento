import { FileText, Download, Filter, DollarSign, Car, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMovimentacoesHoje } from "@/hooks/useDatabase";
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

function useMovimentacoesPeriodo(de: string, ate: string) {
  return useQuery({
    queryKey: ['movimentacoes', 'periodo', de, ate],
    queryFn: async () => {
      let query = supabase.from('movimentacoes').select('*').order('entrada', { ascending: false });
      if (de) query = query.gte('entrada', new Date(de).toISOString());
      if (ate) query = query.lte('entrada', new Date(ate + 'T23:59:59').toISOString());
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });
}

export default function Relatorios() {
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const { data: movimentacoesHoje = [] } = useMovimentacoesHoje();
  const { data: movPeriodo = [] } = useMovimentacoesPeriodo(de, ate);

  const dadosExibidos = (de || ate) ? movPeriodo : movimentacoesHoje;
  const filtrados = filtroPlaca
    ? dadosExibidos.filter(m => m.placa.includes(filtroPlaca.toUpperCase()))
    : dadosExibidos;

  const saidasHoje = movimentacoesHoje.filter(m => m.status_movimentacao === 'finalizado');
  const faturamentoHoje = saidasHoje.reduce((sum, m) => sum + (Number(m.valor_total) || 0), 0);
  const ticketMedio = saidasHoje.length > 0 ? (faturamentoHoje / saidasHoje.length).toFixed(0) : '0';

  // Daily chart from period data
  const chartData = useMemo(() => {
    const days: Record<string, { dia: string; faturamento: number }> = {};
    const finalizados = dadosExibidos.filter(m => m.status_movimentacao === 'finalizado');
    finalizados.forEach(m => {
      const d = new Date(m.entrada);
      const key = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      days[key] = days[key] || { dia: key, faturamento: 0 };
      days[key].faturamento += Number(m.valor_total) || 0;
    });
    return Object.values(days);
  }, [dadosExibidos]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Análises e relatórios operacionais</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Car, label: 'Entradas Hoje', value: movimentacoesHoje.length, color: 'text-primary' },
          { icon: Car, label: 'Saídas Hoje', value: saidasHoje.length, color: 'text-accent' },
          { icon: DollarSign, label: 'Faturamento Hoje', value: `R$ ${faturamentoHoje.toLocaleString()}`, color: 'text-accent' },
          { icon: TrendingUp, label: 'Ticket Médio', value: `R$ ${ticketMedio}`, color: 'text-foreground' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2"><s.icon className="h-4 w-4 text-muted-foreground" /><p className="stat-label">{s.label}</p></div>
            <p className={`stat-value ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4"><Filter className="h-4 w-4 text-muted-foreground" /><span className="section-title">Filtros</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><p className="stat-label mb-1.5">De</p><Input type="date" value={de} onChange={e => setDe(e.target.value)} className="h-11" /></div>
          <div><p className="stat-label mb-1.5">Até</p><Input type="date" value={ate} onChange={e => setAte(e.target.value)} className="h-11" /></div>
          <div><p className="stat-label mb-1.5">Placa</p><Input placeholder="ABC1D23" value={filtroPlaca} onChange={e => setFiltroPlaca(e.target.value)} className="h-11 font-mono" /></div>
          <div className="flex items-end"><Button onClick={() => { setDe(''); setAte(''); setFiltroPlaca(''); }} variant="outline" className="w-full h-11 rounded-xl">Limpar</Button></div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="section-title mb-6">Faturamento</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="faturamento" fill="hsl(217,91%,60%)" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50"><h3 className="section-title">Movimentações</h3></div>
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
                  <td className="p-4 font-display font-bold text-foreground">{m.valor_total ? `R$ ${Number(m.valor_total)}` : '—'}</td>
                  <td className="p-4 text-xs uppercase text-muted-foreground hidden md:table-cell">{m.forma_pagamento || '—'}</td>
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
