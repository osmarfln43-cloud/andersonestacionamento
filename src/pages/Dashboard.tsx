import { Car, LogIn, LogOut, DollarSign, Clock, TrendingUp, Users, Percent, ArrowUpRight, CalendarCheck, Banknote, CreditCard, Flame } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMovimentacoesAtivas, useMovimentacoesHoje, useMensalistas, useMovimentacoesFinalizadasHoje } from "@/hooks/useDatabase";
import { useMemo } from "react";
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

function StatCard({ icon: Icon, label, value, trend, trendUp, color, delay }: {
  icon: any; label: string; value: string | number; trend?: string; trendUp?: boolean; color: string; delay: number;
}) {
  return (
    <div className={`glass-card-hover p-3 md:p-6 animate-in stagger-${delay}`} style={{ opacity: 0 }}>
      <div className="flex items-start justify-between mb-2 md:mb-4">
        <div className="h-8 w-8 md:h-11 md:w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}12` }}>
          <Icon className="h-4 w-4 md:h-5 md:w-5" style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] md:text-[11px] font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg ${
            trendUp !== false ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
          }`}>
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </div>
        )}
      </div>
      <p className="stat-label mb-0.5 md:mb-1 text-[10px] md:text-xs">{label}</p>
      <p className="text-base md:text-2xl font-display font-bold text-foreground truncate">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data: veiculosAtivos = [] } = useMovimentacoesAtivas();
  const { data: movimentacoesHoje = [] } = useMovimentacoesHoje();
  const { data: mensalistas = [] } = useMensalistas();
  const { data: finalizadosHoje = [] } = useMovimentacoesFinalizadasHoje();

  // Last 6 months of finalized movimentacoes for month comparison
  const { data: movLast6Months = [] } = useQuery({
    queryKey: ['movimentacoes', 'last-6-months'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('movimentacoes')
        .select('entrada, valor_total, status_movimentacao, categoria, forma_pagamento')
        .eq('status_movimentacao', 'finalizado')
        .gte('entrada', sixMonthsAgo.toISOString())
        .order('entrada', { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  const monthlyComparison = useMemo(() => {
    const months: Record<string, { mes: string; faturamento: number; veiculos: number; carros: number; motos: number; pix: number; dinheiro: number }> = {};
    movLast6Months.forEach((m: any) => {
      const d = new Date(m.entrada);
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { mes: key, faturamento: 0, veiculos: 0, carros: 0, motos: 0, pix: 0, dinheiro: 0 };
      const val = Number(m.valor_total) || 0;
      months[key].faturamento += val;
      months[key].veiculos += 1;
      if (m.categoria === 'moto') months[key].motos += 1;
      else months[key].carros += 1;
      if (m.forma_pagamento === 'pix') months[key].pix += val;
      else months[key].dinheiro += val;
    });
    return Object.values(months);
  }, [movLast6Months]);

  const saidasHoje = movimentacoesHoje.filter(m => m.status_movimentacao === 'finalizado');
  const faturamentoHoje = saidasHoje.reduce((sum, m) => sum + (Number(m.valor_total) || 0), 0);
  const ticketMedio = saidasHoje.length > 0 ? (faturamentoHoje / saidasHoje.length).toFixed(0) : '0';
  const ocupacao = Math.min(Math.round((veiculosAtivos.length / 50) * 100), 100);
  const mensalistasAtivos = mensalistas.filter((m: any) => m.status === 'ativo').length;
  const receitaMensalistas = mensalistas.filter((m: any) => m.status === 'ativo').reduce((s: number, m: any) => s + Number(m.valor_mensal), 0);
  const faturamentoPix = saidasHoje.filter(m => m.forma_pagamento === 'pix').reduce((s, m) => s + (Number(m.valor_total) || 0), 0);
  const faturamentoDinheiro = saidasHoje.filter(m => m.forma_pagamento === 'dinheiro').reduce((s, m) => s + (Number(m.valor_total) || 0), 0);

  // Build hourly data from real movements
  const hourlyData = useMemo(() => {
    const hours: Record<string, { hora: string; faturamento: number; entradas: number; saidas: number }> = {};
    for (let h = 6; h <= 22; h++) {
      const key = `${h.toString().padStart(2, '0')}h`;
      hours[key] = { hora: key, faturamento: 0, entradas: 0, saidas: 0 };
    }
    movimentacoesHoje.forEach(m => {
      const h = new Date(m.entrada).getHours();
      const key = `${h.toString().padStart(2, '0')}h`;
      if (hours[key]) {
        hours[key].entradas++;
        if (m.status_movimentacao === 'finalizado') {
          hours[key].faturamento += Number(m.valor_total) || 0;
        }
      }
      if (m.saida) {
        const sh = new Date(m.saida).getHours();
        const skey = `${sh.toString().padStart(2, '0')}h`;
        if (hours[skey]) hours[skey].saidas++;
      }
    });
    return Object.values(hours);
  }, [movimentacoesHoje]);

  // Payment distribution from real data
  const paymentData = useMemo(() => {
    const pix = saidasHoje.filter(m => m.forma_pagamento === 'pix').length;
    const din = saidasHoje.filter(m => m.forma_pagamento === 'dinheiro').length;
    const total = pix + din || 1;
    return [
      { name: 'PIX', value: Math.round((pix / total) * 100), color: 'hsl(217, 91%, 60%)' },
      { name: 'Dinheiro', value: Math.round((din / total) * 100), color: 'hsl(160, 65%, 48%)' },
    ];
  }, [saidasHoje]);

  // Average time
  const tempoMedio = useMemo(() => {
    if (saidasHoje.length === 0) return '—';
    const totalMs = saidasHoje.reduce((sum, m) => {
      if (m.entrada && m.saida) return sum + (new Date(m.saida).getTime() - new Date(m.entrada).getTime());
      return sum;
    }, 0);
    const avgH = totalMs / saidasHoje.length / 3600000;
    return `${Math.floor(avgH)}h ${Math.round((avgH % 1) * 60)}m`;
  }, [saidasHoje]);

  const stats = [
    { icon: Car, label: "Veículos no Pátio", value: veiculosAtivos.length, trend: "agora", trendUp: true, color: "hsl(217,91%,60%)", delay: 1 },
    { icon: LogIn, label: "Entradas Hoje", value: movimentacoesHoje.length, color: "hsl(160,65%,48%)", delay: 2 },
    { icon: LogOut, label: "Saídas Hoje", value: saidasHoje.length, color: "hsl(38,92%,55%)", delay: 3 },
    { icon: DollarSign, label: "Faturamento Hoje", value: `R$ ${faturamentoHoje.toLocaleString()}`, color: "hsl(160,65%,48%)", delay: 4 },
    { icon: DollarSign, label: "Ticket Médio", value: `R$ ${ticketMedio}`, color: "hsl(280,65%,62%)", delay: 5 },
    { icon: Clock, label: "Tempo Médio", value: tempoMedio, color: "hsl(217,91%,60%)", delay: 6 },
    { icon: Percent, label: "Taxa de Ocupação", value: `${ocupacao}%`, color: "hsl(38,92%,55%)", delay: 7 },
    { icon: Users, label: "Mensalistas Ativos", value: mensalistasAtivos, color: "hsl(280,65%,62%)", delay: 8 },
    { icon: CalendarCheck, label: "Receita Mensalistas", value: `R$ ${receitaMensalistas.toLocaleString()}`, color: "hsl(160,65%,48%)", delay: 1 },
    { icon: CreditCard, label: "PIX Hoje", value: `R$ ${faturamentoPix.toLocaleString()}`, color: "hsl(217,91%,60%)", delay: 2 },
    { icon: Banknote, label: "Dinheiro Hoje", value: `R$ ${faturamentoDinheiro.toLocaleString()}`, color: "hsl(38,92%,55%)", delay: 3 },
    { icon: TrendingUp, label: "Faturamento Total", value: `R$ ${(faturamentoHoje + receitaMensalistas).toLocaleString()}`, color: "hsl(160,65%,48%)", delay: 4 },
  ];

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display text-destructive">Gerenciador</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">Visão geral do estacionamento em tempo real</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title">Faturamento por Hora</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217,91%,60%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(217,91%,60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
              <XAxis dataKey="hora" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="faturamento" stroke="hsl(217,91%,60%)" fill="url(#gradFat)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h3 className="section-title mb-6">Formas de Pagamento</h3>
          <div className="flex-1 flex items-center justify-center">
            {saidasHoje.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={paymentData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                    {paymentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados ainda</p>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {paymentData.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.name}</span>
                <span className="font-medium text-foreground">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h3 className="section-title mb-6">Movimentação por Hora</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourlyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
              <XAxis dataKey="hora" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="entradas" fill="hsl(217,91%,60%)" radius={[6, 6, 0, 0]} maxBarSize={20} name="Entradas" />
              <Bar dataKey="saidas" fill="hsl(160,65%,48%)" radius={[6, 6, 0, 0]} maxBarSize={20} name="Saídas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Últimas Movimentações</h3>
          <div className="space-y-2">
            {movimentacoesHoje.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação hoje</p>
            )}
            {movimentacoesHoje.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${m.status_movimentacao === 'ativo' ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-foreground">{m.placa}</span>
                    <span className="text-xs text-muted-foreground truncate">{m.modelo}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {new Date(m.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg ${
                  m.status_movimentacao === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                }`}>
                  {m.status_movimentacao === 'ativo' ? 'No pátio' : 'Saiu'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cumulative Evolution */}
      {monthlyComparison.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="section-title mb-6">📈 Evolução Acumulada — Últimos 6 Meses</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyComparison.reduce((acc: any[], item, i) => {
              const prev = i > 0 ? acc[i - 1].acumulado : 0;
              acc.push({ ...item, acumulado: prev + item.faturamento });
              return acc;
            }, [])}>
              <defs>
                <linearGradient id="gradAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160,65%,48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160,65%,48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Acumulado']} />
              <Area type="monotone" dataKey="acumulado" name="Acumulado" stroke="hsl(160,65%,48%)" fill="url(#gradAcumulado)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h3 className="section-title mb-6">📊 Comparativo Mês a Mês — Faturamento</h3>
          {monthlyComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyComparison} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `R$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`R$ ${v.toFixed(2)}`, name === 'pix' ? 'PIX' : name === 'dinheiro' ? 'Dinheiro' : name]} />
                <Bar dataKey="pix" name="PIX" stackId="a" fill="hsl(217, 91%, 60%)" maxBarSize={36} />
                <Bar dataKey="dinheiro" name="Dinheiro" stackId="a" fill="hsl(160, 65%, 48%)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados nos últimos 6 meses</p>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="section-title mb-6">🚗 Veículos por Mês — Carros vs Motos</h3>
          {monthlyComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyComparison} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="carros" name="Carros" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="motos" name="Motos" fill="hsl(45, 93%, 47%)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados nos últimos 6 meses</p>
          )}
        </div>
      </div>
    </div>
  );
}
