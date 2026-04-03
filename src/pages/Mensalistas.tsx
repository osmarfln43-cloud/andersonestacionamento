import { CalendarCheck, Search, Plus, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";

const demoMensalistas = [
  { id: '1', cliente: 'Carlos Silva', placa: 'ABC1D23', plano: 'Mensal', valor: 350, vencimento: '15/04/2026', status: 'ativo' },
  { id: '2', cliente: 'João Oliveira', placa: 'MNO7F89', plano: 'Mensal', valor: 350, vencimento: '10/04/2026', status: 'ativo' },
  { id: '3', cliente: 'Pedro Lima', placa: 'DEF5H67', plano: 'Quinzenal', valor: 200, vencimento: '05/04/2026', status: 'atrasado' },
  { id: '4', cliente: 'Fernanda Rocha', placa: 'RST1A23', plano: 'Mensal', valor: 350, vencimento: '01/04/2026', status: 'atrasado' },
  { id: '5', cliente: 'Lucas Pereira', placa: 'UVW4B56', plano: 'Mensal', valor: 400, vencimento: '20/04/2026', status: 'ativo' },
];

export default function Mensalistas() {
  const [busca, setBusca] = useState("");
  const filtered = demoMensalistas.filter(m => m.cliente.toLowerCase().includes(busca.toLowerCase()) || m.placa.includes(busca.toUpperCase()));
  const ativos = demoMensalistas.filter(m => m.status === 'ativo').length;
  const atrasados = demoMensalistas.filter(m => m.status === 'atrasado').length;
  const receita = demoMensalistas.filter(m => m.status === 'ativo').reduce((s, m) => s + m.valor, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <CalendarCheck className="h-6 w-6 text-primary" /> Mensalistas
          </h1>
          <p className="text-sm text-muted-foreground">{demoMensalistas.length} mensalistas</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Mensalista</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ativos', value: ativos, color: 'text-accent' },
          { label: 'Atrasados', value: atrasados, color: 'text-destructive' },
          { label: 'Receita Recorrente', value: `R$ ${receita}`, color: 'text-accent' },
          { label: 'Total', value: demoMensalistas.length, color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className={`stat-value mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar mensalista..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card-hover p-4 flex items-center gap-4"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {m.cliente.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{m.cliente}</p>
              <p className="text-xs text-muted-foreground font-mono">{m.placa} • {m.plano}</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-foreground">R$ {m.valor}</p>
              <p className="text-xs text-muted-foreground">Venc: {m.vencimento}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
              m.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
            }`}>
              {m.status === 'atrasado' && <AlertTriangle className="h-3 w-3" />}
              {m.status}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
