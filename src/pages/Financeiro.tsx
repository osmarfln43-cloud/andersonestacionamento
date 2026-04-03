import { Wallet, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useStore } from "@/lib/store";

const monthData = [
  { dia: '01', receita: 1200 }, { dia: '05', receita: 1800 }, { dia: '10', receita: 2400 },
  { dia: '15', receita: 1600 }, { dia: '20', receita: 3200 }, { dia: '25', receita: 2800 },
  { dia: '30', receita: 3600 },
];

const catData = [
  { name: 'Avulsos', value: 65, color: 'hsl(210,100%,52%)' },
  { name: 'Mensalistas', value: 35, color: 'hsl(152,60%,45%)' },
];

export default function Financeiro() {
  const { faturamentoHoje } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Wallet className="h-6 w-6 text-accent" /> Financeiro
        </h1>
        <p className="text-sm text-muted-foreground">Controle financeiro e receitas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hoje', value: `R$ ${faturamentoHoje}`, icon: ArrowUp, color: 'text-accent' },
          { label: 'Semana', value: 'R$ 4.788', icon: TrendingUp, color: 'text-primary' },
          { label: 'Mês', value: 'R$ 16.800', icon: TrendingUp, color: 'text-primary' },
          { label: 'Mensalistas', value: 'R$ 3.850', icon: ArrowUp, color: 'text-accent' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className={`stat-value mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthData}>
              <defs>
                <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152,60%,45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152,60%,45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
              <XAxis dataKey="dia" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,14%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="receita" stroke="hsl(152,60%,45%)" fill="url(#gradRec)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Receita por Categoria</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={catData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4}>
                {catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,14%,18%)', borderRadius: 8, fontSize: 12 }} />
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
        </div>
      </div>
    </div>
  );
}
