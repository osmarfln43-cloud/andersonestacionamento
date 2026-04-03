import { Car, Clock, Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { useState } from "react";

export default function Patio() {
  const [busca, setBusca] = useState("");
  const { veiculosAtivos } = useStore();

  const filtered = busca.length > 0
    ? veiculosAtivos.filter(v => v.placa.includes(busca.toUpperCase()) || v.modelo.toLowerCase().includes(busca.toLowerCase()))
    : veiculosAtivos;

  const totalEstimado = veiculosAtivos.reduce((sum, v) => {
    const diffH = (Date.now() - new Date(v.entrada).getTime()) / 3600000;
    return sum + Math.max(Math.ceil(diffH), 1) * v.valorHora;
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>
            Pátio
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{veiculosAtivos.length} veículos estacionados agora</p>
        </div>
        <div className="flex gap-3">
          <div className="glass-card px-5 py-3 flex items-center gap-3">
            <Car className="h-4 w-4 text-primary" />
            <div>
              <p className="stat-label">Ocupação</p>
              <p className="text-lg font-display font-bold text-foreground">{veiculosAtivos.length}/50</p>
            </div>
          </div>
          <div className="glass-card px-5 py-3 flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-accent" />
            <div>
              <p className="stat-label">Receita Estimada</p>
              <p className="text-lg font-display font-bold text-accent">R$ {totalEstimado}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa ou modelo..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((v, i) => {
          const diffMs = Date.now() - new Date(v.entrada).getTime();
          const h = Math.floor(diffMs / 3600000);
          const m = Math.round((diffMs % 3600000) / 60000);
          const valor = Math.max(Math.ceil(diffMs / 3600000), 1) * v.valorHora;

          return (
            <div
              key={v.id}
              className={`glass-card-hover p-5 animate-in stagger-${Math.min(i + 1, 8)}`}
              style={{ opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-11 w-11 rounded-xl bg-primary/[0.08] flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
              </div>
              <p className="font-mono text-xl font-bold text-foreground tracking-wide">{v.placa}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{v.modelo}</p>
              <p className="text-xs text-muted-foreground">{v.cor}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{h}h {m}min</span>
                </div>
                <span className="text-base font-display font-bold text-accent">R$ {valor}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Car className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">Pátio vazio</p>
          <p className="text-sm">Nenhum veículo estacionado no momento</p>
        </div>
      )}
    </div>
  );
}
