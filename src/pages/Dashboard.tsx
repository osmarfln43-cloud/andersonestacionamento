import { Car, LogIn, LogOut, DollarSign, Clock, TrendingUp, Users, Percent, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useStore } from "@/lib/store";

const hourlyData = [
  { hora: '06h', faturamento: 24, entradas: 2, saidas: 1 },
  { hora: '07h', faturamento: 60, entradas: 5, saidas: 3 },
  { hora: '08h', faturamento: 108, entradas: 9, saidas: 6 },
  { hora: '09h', faturamento: 144, entradas: 12, saidas: 10 },
  { hora: '10h', faturamento: 132, entradas: 11, saidas: 9 },
  { hora: '11h', faturamento: 96, entradas: 8, saidas: 7 },
  { hora: '12h', faturamento: 156, entradas: 13, saidas: 11 },
  { hora: '13h', faturamento: 120, entradas: 10, saidas: 9 },
  { hora: '14h', faturamento: 84, entradas: 7, saidas: 6 },
  { hora: '15h', faturamento: 72, entradas: 6, saidas: 5 },
  { hora: '16h', faturamento: 108, entradas: 9, saidas: 8 },
  { hora: '17h', faturamento: 168, entradas: 14, saidas: 12 },
  { hora: '18h', faturamento: 180, entradas: 15, saidas: 13 },
];

const paymentData = [
  { name: 'PIX', value: 65, color: 'hsl(217, 91%, 60%)' },
  { name: 'Dinheiro', value: 35, color: 'hsl(160, 65%, 48%)' },
];

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
    <div className={`glass-card-hover p-6 animate-in stagger-${delay}`} style={{ opacity: 0 }}>
      <div className="flex items-start justify-between mb-4">
        <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}12` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg ${
            trendUp ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
          }`}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="stat-label mb-1">{label}</p>
      <p className="stat-value text-foreground">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { veiculosAtivos, movimentacoesHoje, saidasHoje, faturamentoHoje } = useStore();
  const ticketMedio = saidasHoje.length > 0 ? (faturamentoHoje / saidasHoje.length).toFixed(0) : '0';
  const ocupacao = Math.min(Math.round((veiculosAtivos.length / 50) * 100), 100);

  const stats = [
    { icon: Car, label: "Veículos no Pátio", value: veiculosAtivos.length, trend: "agora", trendUp: true, color: "hsl(217,91%,60%)", delay: 1 },
    { icon: LogIn, label: "Entradas Hoje", value: movimentacoesHoje.length, trend: "+8%", trendUp: true, color: "hsl(160,65%,48%)", delay: 2 },
    { icon: LogOut, label: "Saídas Hoje", value: saidasHoje.length, trend: "+5%", trendUp: true, color: "hsl(38,92%,55%)", delay: 3 },
    { icon: DollarSign, label: "Faturamento Hoje", value: `R$ ${faturamentoHoje.toLocaleString()}`, trend: "+12%", trendUp: true, color: "hsl(160,65%,48%)", delay: 4 },
    { icon: DollarSign, label: "Ticket Médio", value: `R$ ${ticketMedio}`, color: "hsl(280,65%,62%)", delay: 5 },
    { icon: Clock, label: "Tempo Médio", value: "2h 15m", color: "hsl(217,91%,60%)", delay: 6 },
    { icon: Percent, label: "Taxa de Ocupação", value: `${ocupacao}%`, trend: `${ocupacao}%`, trendUp: ocupacao < 90, color: "hsl(38,92%,55%)", delay: 7 },
    { icon: Users, label: "Mensalistas Ativos", value: 12, trend: "+2", trendUp: true, color: "hsl(280,65%,62%)", delay: 8 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do estacionamento em tempo real</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title">Faturamento por Hora</h3>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Faturamento</span>
            </div>
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

        {/* Payment Pie */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="section-title mb-6">Formas de Pagamento</h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                  {paymentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
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

      {/* Movement Chart + Activity */}
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
          <div className="flex justify-center gap-6 mt-4">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" />Entradas</span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-accent" />Saídas</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Últimas Movimentações</h3>
          <div className="space-y-2">
            {movimentacoesHoje.slice(-6).reverse().map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${m.statusMovimentacao === 'ativo' ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
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
                  m.statusMovimentacao === 'ativo'
                    ? 'bg-accent/10 text-accent'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {m.statusMovimentacao === 'ativo' ? 'No pátio' : 'Saiu'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
