import { Wallet, TrendingUp, Banknote, QrCode, Users, Calendar, DollarSign, Car, Bike, Search, Download } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line } from "recharts";
import { useMensalistas, useConfiguracoes } from "@/hooks/useDatabase";
import { useMemo, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(160, 65%, 48%)',
  'hsl(340, 82%, 52%)',
  'hsl(45, 93%, 47%)',
  'hsl(280, 67%, 55%)',
  'hsl(16, 90%, 55%)',
];

const tooltipStyle = {
  background: 'hsl(225, 22%, 9%)',
  border: '1px solid hsl(225, 15%, 16%)',
  borderRadius: 12,
  fontSize: 12,
  padding: '10px 14px',
  boxShadow: '0 8px 32px -8px hsl(0 0% 0% / 0.5)',
};

type Periodo = 'hoje' | '15dias' | '30dias' | '6meses' | '1ano' | 'custom';

const periodoLabel: Record<Periodo, string> = {
  hoje: 'Hoje',
  '15dias': 'Últimos 15 Dias',
  '30dias': 'Últimos 30 Dias',
  '6meses': 'Últimos 6 Meses',
  '1ano': 'Último Ano',
  custom: 'Personalizado',
};

function getDateRange(periodo: Periodo) {
  const now = new Date();
  const ate = new Date(now); ate.setHours(23, 59, 59, 999);
  const de = new Date(now); de.setHours(0, 0, 0, 0);
  switch (periodo) {
    case 'hoje': break;
    case '15dias': de.setDate(de.getDate() - 15); break;
    case '30dias': de.setDate(de.getDate() - 30); break;
    case '6meses': de.setMonth(de.getMonth() - 6); break;
    case '1ano': de.setFullYear(de.getFullYear() - 1); break;
    default: break;
  }
  return { de, ate };
}

function useMovimentacoesPeriodo(periodo: Periodo, customDe?: string, customAte?: string) {
  return useQuery({
    queryKey: ['movimentacoes', 'financeiro', periodo, customDe, customAte],
    queryFn: async () => {
      let deDate: string, ateDate: string;
      if (periodo === 'custom' && customDe && customAte) {
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
    refetchInterval: 30000,
  });
}

function usePagamentosPeriodo(periodo: Periodo, customDe?: string, customAte?: string) {
  return useQuery({
    queryKey: ['pagamentos', 'financeiro', periodo, customDe, customAte],
    queryFn: async () => {
      let deDate: string, ateDate: string;
      if (periodo === 'custom' && customDe && customAte) {
        deDate = new Date(customDe).toISOString();
        ateDate = new Date(customAte + 'T23:59:59').toISOString();
      } else {
        const range = getDateRange(periodo);
        deDate = range.de.toISOString();
        ateDate = range.ate.toISOString();
      }
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .gte('created_at', deDate)
        .lte('created_at', ateDate)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export default function Financeiro() {
  const [periodo, setPeriodo] = useState<Periodo>('30dias');
  const [customDe, setCustomDe] = useState('');
  const [customAte, setCustomAte] = useState('');
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { data: mensalistas = [] } = useMensalistas();
  const { data: config } = useConfiguracoes();
  const { toast } = useToast();

  const { data: movimentacoes = [] } = useMovimentacoesPeriodo(periodo, customDe || undefined, customAte || undefined);
  const { data: pagamentos = [] } = usePagamentosPeriodo(periodo, customDe || undefined, customAte || undefined);

  const finalizados = movimentacoes.filter(m => m.status_movimentacao === 'finalizado');
  const faturamento = finalizados.reduce((sum, m) => sum + (Number(m.valor_total) || 0), 0);
  const ticketMedio = finalizados.length > 0 ? faturamento / finalizados.length : 0;

  const pixTotal = pagamentos.filter((p: any) => p.tipo === 'pix').reduce((s: number, p: any) => s + Number(p.valor), 0);
  const dinheiroTotal = pagamentos.filter((p: any) => p.tipo === 'dinheiro').reduce((s: number, p: any) => s + Number(p.valor), 0);
  const pixCount = pagamentos.filter((p: any) => p.tipo === 'pix').length;
  const dinheiroCount = pagamentos.filter((p: any) => p.tipo === 'dinheiro').length;

  const carrosCount = movimentacoes.filter(m => (m as any).categoria === 'carro').length;
  const motosCount = movimentacoes.filter(m => (m as any).categoria === 'moto').length;
  const carrosFat = finalizados.filter(m => (m as any).categoria === 'carro').reduce((s, m) => s + (Number(m.valor_total) || 0), 0);
  const motosFat = finalizados.filter(m => (m as any).categoria === 'moto').reduce((s, m) => s + (Number(m.valor_total) || 0), 0);

  // Revenue by day chart
  const receitaDia = useMemo(() => {
    const days: Record<string, { dia: string; pix: number; dinheiro: number; total: number }> = {};
    const isLong = periodo === '6meses' || periodo === '1ano';
    finalizados.forEach(m => {
      const d = isLong
        ? new Date(m.entrada).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        : new Date(m.entrada).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!days[d]) days[d] = { dia: d, pix: 0, dinheiro: 0, total: 0 };
      const val = Number(m.valor_total) || 0;
      days[d].total += val;
      if (m.forma_pagamento === 'pix') days[d].pix += val;
      else days[d].dinheiro += val;
    });
    return Object.values(days).sort((a, b) => {
      const [da, ma] = a.dia.split('/').map(Number);
      const [db, mb] = b.dia.split('/').map(Number);
      if (isNaN(da)) return 0;
      return (ma * 100 + da) - (mb * 100 + db);
    });
  }, [finalizados, periodo]);

  // Payment type pie
  const pagamentoData = useMemo(() => [
    { name: 'PIX', value: pixTotal, color: COLORS[0] },
    { name: 'Dinheiro', value: dinheiroTotal, color: COLORS[1] },
  ].filter(d => d.value > 0), [pixTotal, dinheiroTotal]);

  // Category revenue pie
  const categoriaFatData = useMemo(() => [
    { name: 'Carros', value: carrosFat, color: COLORS[0] },
    { name: 'Motos', value: motosFat, color: COLORS[3] },
  ].filter(d => d.value > 0), [carrosFat, motosFat]);

  // Mensalistas
  const mensalistasAtivos = useMemo(() => (mensalistas || []).filter((m: any) => m.status === 'ativo'), [mensalistas]);
  const receitaMensalistas = mensalistasAtivos.reduce((s: number, m: any) => s + Number(m.valor_mensal || 0), 0);

  // Recent transactions
  const recentTransactions = pagamentos.slice(0, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-accent" />
          </div>
          Financeiro
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Controle financeiro detalhado com gráficos</p>
      </div>

      {/* Period Selector */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="section-title">Período</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
          {(['hoje', '15dias', '30dias', '6meses', '1ano', 'custom'] as Periodo[]).map(p => (
            <button
              key={p}
              onClick={() => { setPeriodo(p); if (p !== 'custom') { setCustomDe(''); setCustomAte(''); } }}
              className={`h-11 rounded-xl text-xs sm:text-sm font-medium transition-all border-2 ${
                periodo === p ? 'border-primary bg-primary/[0.06] text-primary' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {periodoLabel[p]}
            </button>
          ))}
        </div>
        {periodo === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div><p className="stat-label mb-1.5">Data Início</p><Input type="date" value={customDe} onChange={e => setCustomDe(e.target.value)} className="h-11" /></div>
            <div><p className="stat-label mb-1.5">Data Fim</p><Input type="date" value={customAte} onChange={e => setCustomAte(e.target.value)} className="h-11" /></div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Faturamento', value: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-accent' },
          { label: 'Ticket Médio', value: `R$ ${ticketMedio.toFixed(2)}`, color: 'text-primary' },
          { label: 'PIX', value: `R$ ${pixTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-primary' },
          { label: 'Dinheiro', value: `R$ ${dinheiroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-accent' },
          { label: 'Carros', value: `${carrosCount} (R$${carrosFat.toFixed(0)})`, color: 'text-primary' },
          { label: 'Motos', value: `${motosCount} (R$${motosFat.toFixed(0)})`, color: 'text-foreground' },
          { label: 'Saídas', value: finalizados.length, color: 'text-accent' },
          { label: 'Mensalistas', value: `R$ ${receitaMensalistas.toLocaleString()}`, color: 'text-foreground' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <p className="stat-label text-[10px]">{s.label}</p>
            <p className={`stat-value text-lg mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Revenue + Payment Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="section-title mb-6">📈 Receita por Dia — {periodoLabel[periodo]}</h3>
          {receitaDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={receitaDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 10 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `R$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Bar dataKey="pix" name="PIX" stackId="a" fill={COLORS[0]} radius={[0, 0, 0, 0]} maxBarSize={28} />
                <Bar dataKey="dinheiro" name="Dinheiro" stackId="a" fill={COLORS[1]} radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-16">Sem dados</p>}
        </div>

        <div className="glass-card p-6 flex flex-col gap-6">
          <div>
            <h3 className="section-title mb-4">💳 Pagamentos</h3>
            {pagamentoData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pagamentoData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} strokeWidth={0}>
                      {pagamentoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4">
                  {pagamentoData.map(p => (
                    <div key={p.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />{p.name}
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>}
          </div>

          <div>
            <h3 className="section-title mb-4">🚗 Receita por Categoria</h3>
            {categoriaFatData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={categoriaFatData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} strokeWidth={0}>
                      {categoriaFatData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4">
                  {categoriaFatData.map(c => (
                    <div key={c.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />{c.name}: R${c.value.toFixed(0)}
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>}
          </div>
        </div>
      </div>

      {/* Accumulated revenue line chart */}
      <div className="glass-card p-6">
        <h3 className="section-title mb-6">📊 Evolução Acumulada do Faturamento</h3>
        {receitaDia.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={receitaDia.reduce((acc: any[], item, i) => {
              const prev = i > 0 ? acc[i - 1].acumulado : 0;
              acc.push({ ...item, acumulado: prev + item.total });
              return acc;
            }, [])}>
              <defs>
                <linearGradient id="gradAcum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 10 }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
              <Area type="monotone" dataKey="acumulado" name="Acumulado" stroke={COLORS[1]} fill="url(#gradAcum)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>}
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <h3 className="section-title mb-4 flex items-center gap-2"><Banknote className="h-4 w-4 text-accent" /> Últimas Transações</h3>
        {recentTransactions.length > 0 ? (
          <div className="max-h-[300px] overflow-y-auto space-y-1.5">
            {recentTransactions.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-2">
                  {p.tipo === 'pix' ? <QrCode className="h-3.5 w-3.5 text-primary" /> : <Banknote className="h-3.5 w-3.5 text-accent" />}
                  <span className="text-xs font-semibold text-foreground uppercase">{p.tipo}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {new Date(p.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <span className="text-sm font-display font-bold text-accent">R$ {Number(p.valor).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação no período</p>}
      </div>

      {/* Mensalistas Section */}
      <div className="glass-card p-6">
        <h3 className="section-title mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Mensalistas — Controle de Pagamentos</h3>
        {mensalistasAtivos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 stat-label">Cliente</th>
                  <th className="text-left py-2 px-3 stat-label">Plano</th>
                  <th className="text-left py-2 px-3 stat-label">Valor Mensal</th>
                  <th className="text-left py-2 px-3 stat-label">Vencimento</th>
                  <th className="text-left py-2 px-3 stat-label">Status</th>
                </tr>
              </thead>
              <tbody>
                {mensalistasAtivos.map((m: any) => {
                  const venc = new Date(m.vencimento + 'T12:00:00');
                  const hoje = new Date();
                  const vencido = venc < hoje;
                  return (
                    <tr key={m.id} className="border-b border-border/20 hover:bg-secondary/20">
                      <td className="py-3 px-3 font-medium text-foreground">{m.clientes?.nome || '—'}</td>
                      <td className="py-3 px-3 text-muted-foreground">{m.plano}</td>
                      <td className="py-3 px-3 font-mono font-bold text-accent">R$ {Number(m.valor_mensal).toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className={`font-mono text-xs ${vencido ? 'text-destructive font-bold' : 'text-foreground'}`}>
                            {venc.toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold uppercase ${vencido ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}`}>
                          {vencido ? 'Vencido' : 'Em dia'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum mensalista ativo</p>
        )}
        <div className="mt-4 p-4 rounded-xl bg-primary/[0.04] border border-primary/10 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Receita mensal estimada (mensalistas)</span>
          <span className="text-xl font-display font-bold text-primary">R$ {receitaMensalistas.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
