import { FileText, Download, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const weekData = [
  { dia: 'Seg', entradas: 45, saidas: 42, faturamento: 540 },
  { dia: 'Ter', entradas: 52, saidas: 50, faturamento: 624 },
  { dia: 'Qua', entradas: 48, saidas: 47, faturamento: 576 },
  { dia: 'Qui', entradas: 61, saidas: 58, faturamento: 732 },
  { dia: 'Sex', entradas: 73, saidas: 70, faturamento: 876 },
  { dia: 'Sáb', entradas: 85, saidas: 82, faturamento: 1020 },
  { dia: 'Dom', entradas: 35, saidas: 34, faturamento: 420 },
];

export default function Relatorios() {
  const { movimentacoesHoje, faturamentoHoje, saidasHoje } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" /> Relatórios
          </h1>
          <p className="text-sm text-muted-foreground">Análises e relatórios detalhados</p>
        </div>
        <Button className="gap-2"><Download className="h-4 w-4" /> Exportar PDF</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Entradas Hoje', value: movimentacoesHoje.length },
          { label: 'Saídas Hoje', value: saidasHoje.length },
          { label: 'Faturamento Hoje', value: `R$ ${faturamentoHoje}` },
          { label: 'Ticket Médio', value: saidasHoje.length > 0 ? `R$ ${(faturamentoHoje / saidasHoje.length).toFixed(0)}` : 'R$ 0' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="stat-value mt-1 text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <Filter className="h-4 w-4 text-muted-foreground self-center" />
        <Input placeholder="Período" type="date" className="w-auto" />
        <Input placeholder="Até" type="date" className="w-auto" />
        <Input placeholder="Placa" className="w-32" />
        <Button variant="secondary" size="sm">Filtrar</Button>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Faturamento Semanal</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,18%)" />
            <XAxis dataKey="dia" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} />
            <Tooltip contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,14%,18%)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="faturamento" fill="hsl(210,100%,52%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Movimentações Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left p-3">Placa</th>
                <th className="text-left p-3">Modelo</th>
                <th className="text-left p-3">Entrada</th>
                <th className="text-left p-3">Saída</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Pagamento</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoesHoje.map((m) => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="p-3 font-mono font-medium">{m.placa}</td>
                  <td className="p-3 text-muted-foreground">{m.modelo}</td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">{new Date(m.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">{m.saida ? new Date(m.saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="p-3 font-mono">{m.valorTotal ? `R$ ${m.valorTotal}` : '—'}</td>
                  <td className="p-3 text-xs">{m.formaPagamento?.toUpperCase() || '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.statusMovimentacao === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                      {m.statusMovimentacao === 'ativo' ? 'Ativo' : 'Finalizado'}
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
