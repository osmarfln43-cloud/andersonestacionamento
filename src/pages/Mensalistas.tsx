import { CalendarCheck, Search, Plus, AlertTriangle, DollarSign, Users, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const demoMensalistas = [
  { id: '1', cliente: 'Carlos Silva', placa: 'ABC1D23', plano: 'Mensal Integral', valor: 350, vencimento: '15/04/2026', status: 'ativo' },
  { id: '2', cliente: 'João Oliveira', placa: 'MNO7F89', plano: 'Mensal Integral', valor: 350, vencimento: '10/04/2026', status: 'ativo' },
  { id: '3', cliente: 'Pedro Lima', placa: 'DEF5H67', plano: 'Mensal Noturno', valor: 200, vencimento: '05/04/2026', status: 'atrasado' },
  { id: '4', cliente: 'Fernanda Rocha', placa: 'RST1A23', plano: 'Mensal Integral', valor: 350, vencimento: '01/04/2026', status: 'atrasado' },
  { id: '5', cliente: 'Lucas Pereira', placa: 'UVW4B56', plano: 'Mensal VIP', valor: 500, vencimento: '20/04/2026', status: 'ativo' },
  { id: '6', cliente: 'Amanda Souza', placa: 'YZA7C89', plano: 'Mensal Integral', valor: 350, vencimento: '25/04/2026', status: 'ativo' },
];

export default function Mensalistas() {
  const [busca, setBusca] = useState("");
  const filtered = demoMensalistas.filter(m => m.cliente.toLowerCase().includes(busca.toLowerCase()) || m.placa.includes(busca.toUpperCase()));
  const ativos = demoMensalistas.filter(m => m.status === 'ativo').length;
  const atrasados = demoMensalistas.filter(m => m.status === 'atrasado').length;
  const receita = demoMensalistas.filter(m => m.status === 'ativo').reduce((s, m) => s + m.valor, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-primary" />
            </div>
            Mensalistas
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{demoMensalistas.length} contratos</p>
        </div>
        <Button className="gap-2 h-11 px-6 rounded-xl">
          <Plus className="h-4 w-4" /> Novo Mensalista
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-accent" />
            <p className="stat-label">Ativos</p>
          </div>
          <p className="stat-value text-accent">{ativos}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="stat-label">Em Atraso</p>
          </div>
          <p className="stat-value text-destructive">{atrasados}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-accent" />
            <p className="stat-label">Receita Recorrente</p>
          </div>
          <p className="stat-value text-accent">R$ {receita.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <p className="stat-label">Vencendo Hoje</p>
          </div>
          <p className="stat-value text-warning">1</p>
        </div>
      </div>

      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar mensalista por nome ou placa..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base border-0 bg-transparent" />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 stat-label">Cliente</th>
                <th className="text-left p-4 stat-label">Placa</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Plano</th>
                <th className="text-left p-4 stat-label">Valor</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Vencimento</th>
                <th className="text-left p-4 stat-label">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {m.cliente.charAt(0)}
                      </div>
                      <span className="font-medium text-foreground text-sm">{m.cliente}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono font-bold text-foreground tracking-wide">{m.placa}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{m.plano}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-display font-bold text-foreground">R$ {m.valor}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-sm font-mono text-muted-foreground">{m.vencimento}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit ${
                      m.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {m.status === 'atrasado' && <AlertTriangle className="h-3 w-3" />}
                      {m.status}
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
