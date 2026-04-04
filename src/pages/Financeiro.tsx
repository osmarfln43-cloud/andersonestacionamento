import { Wallet, TrendingUp, ArrowUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMovimentacoesHoje } from "@/hooks/useDatabase";
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

export default function Financeiro() {
  const { data: movimentacoesHoje = [] } = useMovimentacoesHoje();
  const { data: pagamentos = [] } = usePagamentos();

  const saidasHoje = movimentacoesHoje.filter(m => m.status_movimentacao === 'finalizado');
  const faturamentoHoje = saidasHoje.reduce((sum, m) => sum + (Number(m.valor_total) || 0), 0);

  // This month's data from pagamentos
  const thisMonth = useMemo(() => {
    const now = new Date();
    return pagamentos.filter((p: any) => {
      const d = new Date(p.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [pagamentos]);

  const faturamentoMes = thisMonth.reduce((s: number, p: any) => s + Number(p.valor), 0);

  // Weekly (last 7 days)
  const faturamentoSemana = useMemo(() => {
    const now = Date.now();
    const week = pagamentos.filter((p: any) => now - new Date(p.created_at).getTime() < 7 * 86400000);
    return week.reduce((s: number, p: any) => s + Number(p.valor), 0);
  }, [pagamentos]);

  // Chart: daily this month
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-accent" />
          </div>
          Financeiro
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Controle financeiro e receitas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hoje', value: `R$ ${faturamentoHoje.toLocaleString()}`, color: 'text-accent' },
          { label: 'Semana', value: `R$ ${faturamentoSemana.toLocaleString()}`, color: 'text-primary' },
          { label: 'Mês', value: `R$ ${faturamentoMes.toLocaleString()}`, color: 'text-primary' },
          { label: 'Pagamentos', value: thisMonth.length, color: 'text-foreground' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <p className="stat-label">{s.label}</p>
            <p className={`stat-value mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

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
    </div>
  );
}
