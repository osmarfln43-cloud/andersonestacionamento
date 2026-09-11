import { useMemo, useState } from "react";
import { BarChart3, Clock, CalendarDays, CalendarRange, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMovimentacoesHistorico } from "@/hooks/useDatabase";
import { formatBRL } from "@/lib/cashflow";

type Mov = {
  entrada: string;
  saida: string | null;
  valor_total: number | null;
  status_movimentacao: string;
};

function finalizadas(movs: Mov[]) {
  return movs.filter((m) => m.status_movimentacao === "finalizado" && m.saida);
}

export default function Graficos() {
  const { data: movimentacoes = [] } = useMovimentacoesHistorico();
  const [aba, setAba] = useState("hora");

  const movs = movimentacoes as unknown as Mov[];

  const porHora = useMemo(() => {
    const receita = new Array(24).fill(0);
    const entradas = new Array(24).fill(0);
    finalizadas(movs).forEach((m) => {
      receita[new Date(m.saida as string).getHours()] += Number(m.valor_total || 0);
    });
    movs.forEach((m) => {
      entradas[new Date(m.entrada).getHours()] += 1;
    });
    return receita.map((valor, hora) => ({
      label: `${String(hora).padStart(2, "0")}h`,
      receita: Number(valor.toFixed(2)),
      entradas: entradas[hora],
    }));
  }, [movs]);

  const porDia = useMemo(() => {
    const map = new Map<string, { receita: number; entradas: number }>();
    const hoje = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), { receita: 0, entradas: 0 });
    }
    finalizadas(movs).forEach((m) => {
      const key = new Date(m.saida as string).toISOString().slice(0, 10);
      const row = map.get(key);
      if (row) row.receita += Number(m.valor_total || 0);
    });
    movs.forEach((m) => {
      const key = new Date(m.entrada).toISOString().slice(0, 10);
      const row = map.get(key);
      if (row) row.entradas += 1;
    });
    return Array.from(map.entries()).map(([key, v]) => ({
      label: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
      receita: Number(v.receita.toFixed(2)),
      entradas: v.entradas,
    }));
  }, [movs]);

  const porMes = useMemo(() => {
    const map = new Map<string, { receita: number; entradas: number }>();
    const hoje = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      map.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, { receita: 0, entradas: 0 });
    }
    const key = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };
    finalizadas(movs).forEach((m) => {
      const row = map.get(key(m.saida as string));
      if (row) row.receita += Number(m.valor_total || 0);
    });
    movs.forEach((m) => {
      const row = map.get(key(m.entrada));
      if (row) row.entradas += 1;
    });
    return Array.from(map.entries()).map(([k, v]) => {
      const d = new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 1);
      return {
        label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        receita: Number(v.receita.toFixed(2)),
        entradas: v.entradas,
      };
    });
  }, [movs]);

  const serie = aba === "hora" ? porHora : aba === "dia" ? porDia : porMes;
  const totalReceita = serie.reduce((s, r) => s + r.receita, 0);
  const totalEntradas = serie.reduce((s, r) => s + r.entradas, 0);
  const pico = serie.reduce((best, r) => (r.entradas > (best?.entradas ?? -1) ? r : best), serie[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight font-display">Gráficos de Receita</h1>
          <p className="text-[11px] text-muted-foreground">Receita e fluxo de entrada por hora, dia e mês</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card p-4">
          <p className="stat-label text-[11px] flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Receita do período exibido</p>
          <p className="text-xl font-display font-bold text-accent">{formatBRL(totalReceita)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="stat-label text-[11px] flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Entradas</p>
          <p className="text-xl font-display font-bold">{totalEntradas}</p>
        </div>
        <div className="glass-card p-4">
          <p className="stat-label text-[11px] flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Maior movimento</p>
          <p className="text-xl font-display font-bold text-primary">{pico ? `${pico.label} (${pico.entradas})` : "—"}</p>
        </div>
      </div>

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="hora"><Clock className="h-4 w-4 mr-1.5" /> Por hora</TabsTrigger>
          <TabsTrigger value="dia"><CalendarDays className="h-4 w-4 mr-1.5" /> Por dia</TabsTrigger>
          <TabsTrigger value="mes"><CalendarRange className="h-4 w-4 mr-1.5" /> Por mês</TabsTrigger>
        </TabsList>

        {["hora", "dia", "mes"].map((id) => (
          <TabsContent key={id} value={id} className="space-y-4 mt-4">
            <div className="glass-card p-3 md:p-4">
              <p className="stat-label text-[11px] mb-2">Receita ({id === "hora" ? "por hora do dia" : id === "dia" ? "últimos 30 dias" : "últimos 12 meses"})</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serie}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                    <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-3 md:p-4">
              <p className="stat-label text-[11px] mb-2">Fluxo de entrada de veículos</p>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="entradas" name="Entradas" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
