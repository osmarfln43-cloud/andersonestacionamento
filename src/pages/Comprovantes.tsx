import { Printer, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMovimentacoesHoje } from "@/hooks/useDatabase";
import { useState } from "react";

export default function Comprovantes() {
  const { data: movimentacoesHoje = [] } = useMovimentacoesHoje();
  const [busca, setBusca] = useState("");

  const saidasHoje = movimentacoesHoje.filter(m => m.status_movimentacao === 'finalizado');
  const filtered = busca
    ? saidasHoje.filter(m => m.placa.includes(busca.toUpperCase()))
    : saidasHoje;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Printer className="h-5 w-5 text-primary" />
          </div>
          Comprovantes
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Histórico e reimpressão de comprovantes</p>
      </div>

      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base border-0 bg-transparent" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => (
          <div key={m.id} className="glass-card-hover p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono font-bold text-foreground">{m.placa}</p>
              <p className="text-xs text-muted-foreground">{m.modelo} • {(m.forma_pagamento || '').toUpperCase()} • {new Date(m.entrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
            </div>
            <p className="font-display font-bold text-foreground">R$ {Number(m.valor_total)}</p>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl"><Printer className="h-3.5 w-3.5" /> Reimprimir</Button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Nenhum comprovante encontrado</p>}
      </div>
    </div>
  );
}
