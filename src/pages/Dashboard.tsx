import { Car, LogIn, LogOut, DollarSign, Clock, TrendingUp, Users, Percent } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

const hourlyData = [
  { hora: '06h', faturamento: 24, entradas: 2 },
  { hora: '07h', faturamento: 60, entradas: 5 },
  { hora: '08h', faturamento: 108, entradas: 9 },
  { hora: '09h', faturamento: 144, entradas: 12 },
  { hora: '10h', faturamento: 132, entradas: 11 },
  { hora: '11h', faturamento: 96, entradas: 8 },
  { hora: '12h', faturamento: 156, entradas: 13 },
  { hora: '13h', faturamento: 120, entradas: 10 },
  { hora: '14h', faturamento: 84, entradas: 7 },
  { hora: '15h', faturamento: 72, entradas: 6 },
  { hora: '16h', faturamento: 108, entradas: 9 },
  { hora: '17h', faturamento: 168, entradas: 14 },
  { hora: '18h', faturamento: 180, entradas: 15 },
];

const paymentData = [
  { name: 'PIX', value: 65, color: 'hsl(210 100% 52%)' },
  { name: 'Dinheiro', value: 35, color: 'hsl(152 60% 45%)' },
];

function StatCard({ icon: Icon, label, value, trend, color }: {
  icon: any; label: string; value: string | number; trend?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-hover p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className="stat-value text-foreground">{value}</p>
          {trend && <p className="text-xs text-accent mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" />{trend}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { veiculosAtivos, movimentacoesHoje, saidasHoje, faturamentoHoje } = useStore();

  const ticketMedio = saidasHoje.length > 0 ? (faturamentoHoje / saidasHoje.length).toFixed(0) : '0';

  const stats = [
    { icon: Car, label: "No Pátio", value: veiculosAtivos.length, trend: "agora", color: "hsl(210,100%,52%)" },
    { icon: LogIn, label: "Entradas Hoje", value: movimentacoesHoje.length, color: "hsl(152,60%,45%)" },
    { icon: LogOut, label: "Saídas Hoje", value: saidasHoje.length, color: "hsl(42,95%,55%)" },
    { icon: DollarSign, label: "Faturamento", value: `R$ ${faturamentoHoje}`, trend: "+12%", color: "hsl(152,60%,45%)" },
    { icon: DollarSign, label: "Ticket Médio", value: `R$ ${ticketMedio}`, color: "hsl(280,65%,60%)" },
    { icon: Clock, label: "Tempo Médio", value: "2h 15m", color: "hsl(210,100%,52%)" },
    { icon: Percent, label: "Ocupação", value: `${Math.min(Math.round((veiculosAtivos.length / 50) * 100), 100)}%`, color: "hsl(42,95%,55%)" },
    { icon: Users, label: "Mensalistas", value: 12, color: "hsl(280,65%,60%)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do estacionamento em tempo real</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Faturamento por Hora</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210,100%,52%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(210,100%,52%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
              <XAxis dataKey="hora" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,14%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="faturamento" stroke="hsl(210,100%,52%)" fill="url(#gradFat)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Formas de Pagamento</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4}>
                {paymentData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,14%,18%)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {paymentData.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name} ({p.value}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Movimentação por Hora</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
            <XAxis dataKey="hora" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} />
            <Tooltip contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,14%,18%)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="entradas" fill="hsl(210,100%,52%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent activity */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Últimas Movimentações</h3>
        <div className="space-y-2">
          {movimentacoesHoje.slice(-5).reverse().map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 text-sm">
              <div className={`h-2 w-2 rounded-full ${m.statusMovimentacao === 'ativo' ? 'bg-accent' : 'bg-muted-foreground'}`} />
              <span className="font-mono font-medium text-foreground">{m.placa}</span>
              <span className="text-muted-foreground">{m.modelo}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(m.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                m.statusMovimentacao === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
              }`}>
                {m.statusMovimentacao === 'ativo' ? 'No pátio' : 'Finalizado'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
