import { Wallet, TrendingUp, Banknote, QrCode, Users, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMovimentacoesHoje, useMovimentacoesFinalizadasHoje, useMensalistas } from "@/hooks/useDatabase";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

function usePagamentos() {
  return useQuery({
    queryKey: ['pagamentos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pagamentos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function usePagamentosHoje() {
  return useQuery({
    queryKey: ['pagamentos', 'hoje'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from('pagamentos').select('*').gte('created_at', today.toISOString()).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export default function Financeiro() {
  const { data: movimentacoesHoje = [] } = useMovimentacoesHoje();
  const { data: finalizadosHoje = [] } = useMovimentacoesFinalizadasHoje();
  const { data: pagamentos = [] } = usePagamentos();
  const { data: pagamentosHoje = [] } = usePagamentosHoje();
  const { data: mensalistas = [] } = useMensalistas();

  const faturamentoHoje = finalizadosHoje.reduce((sum, m) => sum + (Number(m.valor_total) || 0), 0);
  const dinheiroHoje = pagamentosHoje.filter((p: any) => p.tipo === 'dinheiro').reduce((s: number, p: any) => s + Number(p.valor), 0);
  const pixHoje = pagamentosHoje.filter((p: any) => p.tipo === 'pix').reduce((s: number, p: any) => s + Number(p.valor), 0);

  const thisMonth = useMemo(() => {
    const now = new Date();
    return pagamentos.filter((p: any) => {
      const d = new Date(p.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [pagamentos]);

  const faturamentoMes = thisMonth.reduce((s: number, p: any) => s + Number(p.valor), 0);

  const faturamentoSemana = useMemo(() => {
    const now = Date.now();
    const week = pagamentos.filter((p: any) => now - new Date(p.created_at).getTime() < 7 * 86400000);
    return week.reduce((s: number, p: any) => s + Number(p.valor), 0);
  }, [pagamentos]);

  const monthData = useMemo(() => {
    const days: Record<string, number> = {};
    thisMonth.forEach((p: any) => {
      const d = new Date(p.created_at).getDate().toString().padStart(2, '0');
      days[d] = (days[d] || 0) + Number(p.valor);
    });
    return Object.entries(days).map(([dia, receita]) => ({ dia, receita })).sort((a, b) => a.dia.localeCompare(b.dia));
  }, [thisMonth]);

  const catData = useMemo(() => {
    const pix = thisMonth.filter((p: any) => p.tipo === 'pix').reduce((s: number, p: any) => s + Number(p.valor), 0);
    const din = thisMonth.filter((p: any) => p.tipo === 'dinheiro').reduce((s: number, p: any) => s + Number(p.valor), 0);
    const total = pix + din || 1;
    return [
      { name: 'PIX', value: Math.round((pix / total) * 100), color: 'hsl(217, 91%, 60%)' },
      { name: 'Dinheiro', value: Math.round((din / total) * 100), color: 'hsl(160, 65%, 48%)' },
    ];
  }, [thisMonth]);

  // Mensalistas ativos com vencimento
  const mensalistasAtivos = useMemo(() => {
    return (mensalistas || []).filter((m: any) => m.status === 'ativo');
  }, [mensalistas]);

  const receitaMensalistas = mensalistasAtivos.reduce((s: number, m: any) => s + Number(m.valor_mensal || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-accent" />
          </div>
          Financeiro
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Controle financeiro diário e mensal</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hoje', value: `R$ ${faturamentoHoje.toLocaleString()}`, color: 'text-accent' },
          { label: 'Semana', value: `R$ ${faturamentoSemana.toLocaleString()}`, color: 'text-primary' },
          { label: 'Mês', value: `R$ ${faturamentoMes.toLocaleString()}`, color: 'text-primary' },
          { label: 'Mensalistas', value: `R$ ${receitaMensalistas.toLocaleString()}`, color: 'text-foreground' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <p className="stat-label">{s.label}</p>
            <p className={`stat-value mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Cash Control */}
      <div className="glass-card p-6">
        <h3 className="section-title mb-4 flex items-center gap-2"><Banknote className="h-4 w-4 text-accent" /> Controle Diário — {new Date().toLocaleDateString('pt-BR')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-secondary/40">
            <p className="stat-label mb-1">Entradas Hoje</p>
            <p className="text-2xl font-display font-bold text-foreground">{movimentacoesHoje.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/40">
            <p className="stat-label mb-1">Saídas Hoje</p>
            <p className="text-2xl font-display font-bold text-accent">{finalizadosHoje.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/40">
            <p className="stat-label mb-1">💵 Dinheiro</p>
            <p className="text-2xl font-display font-bold text-foreground">R$ {dinheiroHoje.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/40">
            <p className="stat-label mb-1">📱 PIX</p>
            <p className="text-2xl font-display font-bold text-primary">R$ {pixHoje.toLocaleString()}</p>
          </div>
        </div>

        {/* Today's transactions */}
        {pagamentosHoje.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Transações do Dia</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1.5">
              {pagamentosHoje.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-2">
                    {p.tipo === 'pix' ? <QrCode className="h-3.5 w-3.5 text-primary" /> : <Banknote className="h-3.5 w-3.5 text-accent" />}
                    <span className="text-xs font-medium text-foreground uppercase">{p.tipo}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-sm font-display font-bold text-accent">R$ {Number(p.valor).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="section-title mb-6">Receita Mensal</h3>
          {monthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthData}>
                <defs>
                  <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160,65%,48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160,65%,48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" />
                <XAxis dataKey="dia" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(225,22%,9%)', border: '1px solid hsl(225,15%,16%)', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="receita" stroke="hsl(160,65%,48%)" fill="url(#gradRec)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados neste mês</p>
          )}
        </div>
        <div className="glass-card p-6">
          <h3 className="section-title mb-6">Por Tipo de Pagamento</h3>
          {thisMonth.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={catData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                    {catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(225,22%,9%)', border: '1px solid hsl(225,15%,16%)', borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {catData.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name} ({p.value}%)
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados</p>
          )}
        </div>
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
