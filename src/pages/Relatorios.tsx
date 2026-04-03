import { FileText, Download, Filter, TrendingUp, DollarSign, Car, Clock } from "lucide-react";
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

const tooltipStyle = {
  background: 'hsl(225, 22%, 9%)',
  border: '1px solid hsl(225, 15%, 16%)',
  borderRadius: 12,
  fontSize: 12,
  padding: '10px 14px',
  boxShadow: '0 8px 32px -8px hsl(0 0% 0% / 0.5)',
};

export default function Relatorios() {
  const { movimentacoesHoje, faturamentoHoje, saidasHoje } = useStore();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Análises e relatórios operacionais</p>
        </div>
        <Button className="gap-2 h-11 px-6 rounded-xl">
          <Download className="h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Car, label: 'Entradas Hoje', value: movimentacoesHoje.length, color: 'text-primary' },
          { icon: Car, label: 'Saídas Hoje', value: saidasHoje.length, color: 'text-accent' },
          { icon: DollarSign, label: 'Faturamento Hoje', value: `R$ ${faturamentoHoje}`, color: 'text-accent' },
          { icon: TrendingUp, label: 'Ticket Médio', value: saidasHoje.length > 0 ? `R$ ${(faturamentoHoje / saidasHoje.length).toFixed(0)}` : 'R$ 0', color: 'text-foreground' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <p className="stat-label">{s.label}</p>
            </div>
            <p className={`stat-value ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="section-title">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <p className="stat-label mb-1.5">De</p>
            <Input type="date" className="h-11" />
          </div>
          <div>
            <p className="stat-label mb-1.5">Até</p>
            <Input type="date" className="h-11" />
          </div>
          <div>
            <p className="stat-label mb-1.5">Placa</p>
            <Input placeholder="ABC1D23" className="h-11 font-mono" />
          </div>
          <div>
            <p className="stat-label mb-1.5">Cliente</p>
            <Input placeholder="Nome" className="h-11" />
          </div>
          <div className="flex items-end">
            <Button className="w-full h-11 rounded-xl">Filtrar</Button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card p-6">
        <h3 className="section-title mb-6">Faturamento Semanal</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
            <XAxis dataKey="dia" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `R$${v}`} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="faturamento" fill="hsl(217,91%,60%)" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h3 className="section-title">Movimentações de Hoje</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 stat-label">Placa</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Modelo</th>
                <th className="text-left p-4 stat-label">Entrada</th>
                <th className="text-left p-4 stat-label">Saída</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Tempo</th>
                <th className="text-left p-4 stat-label">Valor</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Pagamento</th>
                <th className="text-left p-4 stat-label">Status</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoesHoje.map((m) => (
                <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground tracking-wide">{m.placa}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{m.modelo}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{new Date(m.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{m.saida ? new Date(m.saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="p-4 text-xs text-muted-foreground hidden md:table-cell">{m.tempoTotal || '—'}</td>
                  <td className="p-4 font-display font-bold text-foreground">{m.valorTotal ? `R$ ${m.valorTotal}` : '—'}</td>
                  <td className="p-4 text-xs uppercase text-muted-foreground hidden md:table-cell">{m.formaPagamento || '—'}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${m.statusMovimentacao === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
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
