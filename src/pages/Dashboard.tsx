import { Car, LogIn, LogOut, DollarSign, Clock, TrendingUp, Users, Percent, CalendarCheck, Banknote, CreditCard, Flame } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMovimentacoesAtivas, useMovimentacoesHoje, useMensalistas, useMovimentacoesFinalizadasHoje } from "@/hooks/useDatabase";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const tooltipStyle = {
  background: 'hsl(0, 0%, 100%)',
  border: '1px solid hsl(200, 20%, 82%)',
  borderRadius: 4,
  fontSize: 12,
  padding: '8px 12px',
  color: 'hsl(0, 0%, 10%)',
};

function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string | number; color: string;
}) {
  return (
    <div className="pdv-card p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="stat-label">{label}</span>
      </div>
      <p className="text-lg font-mono font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data: veiculosAtivos = [] } = useMovimentacoesAtivas();
  const { data: movimentacoesHoje = [] } = useMovimentacoesHoje();
  const { data: mensalistas = [] } = useMensalistas();
  const { data: finalizadosHoje = [] } = useMovimentacoesFinalizadasHoje();

  const { data: movLast6Months = [] } = useQuery({
    queryKey: ['movimentacoes', 'last-6-months'],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from('movimentacoes')
        .select('entrada, valor_total, status_movimentacao, categoria, forma_pagamento')
        .eq('status_movimentacao', 'finalizado').gte('entrada', sixMonthsAgo.toISOString())
        .order('entrada', { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  const monthlyComparison = useMemo(() => {
    const months: Record<string, any> = {};
    movLast6Months.forEach((m: any) => {
      const d = new Date(m.entrada);
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { mes: key, faturamento: 0, veiculos: 0, carros: 0, motos: 0, pix: 0, dinheiro: 0 };
      const val = Number(m.valor_total) || 0;
      months[key].faturamento += val; months[key].veiculos += 1;
      if (m.categoria === 'moto') months[key].motos += 1; else months[key].carros += 1;
      if (m.forma_pagamento === 'pix') months[key].pix += val; else months[key].dinheiro += val;
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

  const { hourlyData, peakThreshold } = useMemo(() => {
    const hours: Record<string, any> = {};
    for (let h = 6; h <= 22; h++) {
      const key = `${h.toString().padStart(2, '0')}h`;
      hours[key] = { hora: key, faturamento: 0, entradas: 0, saidas: 0 };
    }
    movimentacoesHoje.forEach(m => {
      const h = new Date(m.entrada).getHours();
      const key = `${h.toString().padStart(2, '0')}h`;
      if (hours[key]) {
        hours[key].entradas++;
        if (m.status_movimentacao === 'finalizado') hours[key].faturamento += Number(m.valor_total) || 0;
      }
      if (m.saida) {
        const sh = new Date(m.saida).getHours();
        const skey = `${sh.toString().padStart(2, '0')}h`;
        if (hours[skey]) hours[skey].saidas++;
      }
    });
    const arr = Object.values(hours);
    const maxEntradas = Math.max(...arr.map((h: any) => h.entradas), 0);
    return { hourlyData: arr, peakThreshold: Math.max(Math.ceil(maxEntradas * 0.7), 2) };
  }, [movimentacoesHoje]);

  const paymentData = useMemo(() => {
    const pix = saidasHoje.filter(m => m.forma_pagamento === 'pix').length;
    const din = saidasHoje.filter(m => m.forma_pagamento === 'dinheiro').length;
    const total = pix + din || 1;
    return [
      { name: 'PIX', value: Math.round((pix / total) * 100), color: 'hsl(200, 80%, 50%)' },
      { name: 'Dinheiro', value: Math.round((din / total) * 100), color: 'hsl(120, 55%, 42%)' },
    ];
  }, [saidasHoje]);

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
    { icon: Car, label: "No Pátio", value: veiculosAtivos.length, color: "hsl(200,80%,50%)" },
    { icon: LogIn, label: "Entradas", value: movimentacoesHoje.length, color: "hsl(120,55%,42%)" },
    { icon: LogOut, label: "Saídas", value: saidasHoje.length, color: "hsl(45,90%,50%)" },
    { icon: DollarSign, label: "Faturamento", value: `R$ ${faturamentoHoje.toLocaleString()}`, color: "hsl(120,55%,42%)" },
    { icon: DollarSign, label: "Ticket Médio", value: `R$ ${ticketMedio}`, color: "hsl(280,65%,55%)" },
    { icon: Clock, label: "Tempo Médio", value: tempoMedio, color: "hsl(200,80%,50%)" },
    { icon: Percent, label: "Ocupação", value: `${ocupacao}%`, color: "hsl(45,90%,50%)" },
    { icon: Users, label: "Mensalistas", value: mensalistasAtivos, color: "hsl(280,65%,55%)" },
    { icon: CalendarCheck, label: "Rec. Mensal", value: `R$ ${receitaMensalistas.toLocaleString()}`, color: "hsl(120,55%,42%)" },
    { icon: CreditCard, label: "PIX Hoje", value: `R$ ${faturamentoPix.toLocaleString()}`, color: "hsl(200,80%,50%)" },
    { icon: Banknote, label: "Dinheiro", value: `R$ ${faturamentoDinheiro.toLocaleString()}`, color: "hsl(45,90%,50%)" },
    { icon: TrendingUp, label: "Total Geral", value: `R$ ${(faturamentoHoje + receitaMensalistas).toLocaleString()}`, color: "hsl(120,55%,42%)" },
  ];

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-destructive">Gerenciador</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 pdv-card p-4">
          <h3 className="section-title mb-4">Faturamento por Hora</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(200,80%,50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(200,80%,50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(60,4%,30%)" vertical={false} />
              <XAxis dataKey="hora" tick={{ fill: 'hsl(60,8%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(60,8%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="faturamento" stroke="hsl(200,80%,50%)" fill="url(#gradFat)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="pdv-card p-4 flex flex-col">
          <h3 className="section-title mb-4">Pagamento</h3>
          <div className="flex-1 flex items-center justify-center">
            {saidasHoje.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={paymentData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                    {paymentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground font-mono">Sem dados</p>}
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {paymentData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.name} {p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="pdv-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Movimentação / Hora</h3>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Flame className="h-3 w-3 text-destructive" /> Pico</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(60,4%,30%)" vertical={false} />
              <XAxis dataKey="hora" tick={{ fill: 'hsl(60,8%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(60,8%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="entradas" name="Entradas" radius={[4, 4, 0, 0]} maxBarSize={18}>
                {hourlyData.map((entry: any, index: number) => (
                  <Cell key={index} fill={entry.entradas >= peakThreshold ? 'hsl(0,72%,50%)' : 'hsl(200,80%,50%)'} />
                ))}
              </Bar>
              <Bar dataKey="saidas" fill="hsl(120,55%,42%)" radius={[4, 4, 0, 0]} maxBarSize={18} name="Saídas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pdv-card p-4">
          <h3 className="section-title mb-3">Últimas Movimentações</h3>
          <div className="space-y-1">
            {movimentacoesHoje.length === 0 && <p className="text-sm text-muted-foreground text-center py-6 font-mono">Nenhuma hoje</p>}
            {movimentacoesHoje.slice(0, 8).map((m) => (
              <div key={m.id} className="flex items-center gap-2 p-2 rounded bg-secondary/40 hover:bg-secondary/60 transition-colors">
                <span className={`h-2 w-2 rounded-full shrink-0 ${m.status_movimentacao === 'ativo' ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
                <span className="font-mono font-bold text-sm">{m.placa}</span>
                <span className="text-xs text-muted-foreground truncate flex-1">{m.modelo}</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {new Date(m.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  m.status_movimentacao === 'ativo' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                }`}>
                  {m.status_movimentacao === 'ativo' ? 'PÁTIO' : 'SAIU'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {monthlyComparison.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="pdv-card p-4">
            <h3 className="section-title mb-4">Faturamento Mensal</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyComparison} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(60,4%,30%)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(60,8%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(60,8%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `R$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`R$ ${v.toFixed(2)}`, name === 'pix' ? 'PIX' : 'Dinheiro']} />
                <Bar dataKey="pix" name="PIX" stackId="a" fill="hsl(200,80%,50%)" maxBarSize={30} />
                <Bar dataKey="dinheiro" name="Dinheiro" stackId="a" fill="hsl(120,55%,42%)" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pdv-card p-4">
            <h3 className="section-title mb-4">Veículos / Mês</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyComparison} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(60,4%,30%)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(60,8%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(60,8%,55%)', fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="carros" name="Carros" fill="hsl(200,80%,50%)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="motos" name="Motos" fill="hsl(45,90%,50%)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
