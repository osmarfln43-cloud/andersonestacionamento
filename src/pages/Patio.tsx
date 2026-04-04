import { Car, Clock, Search, TrendingUp, LogIn, LogOut, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMovimentacoesAtivas, useMovimentacoesHoje, useMovimentacoesFinalizadasHoje } from "@/hooks/useDatabase";
import { useState } from "react";

export default function Patio() {
  const [busca, setBusca] = useState("");
  const { data: veiculosAtivos = [], isLoading } = useMovimentacoesAtivas();
  const { data: movHoje = [] } = useMovimentacoesHoje();
  const { data: finalizadosHoje = [] } = useMovimentacoesFinalizadasHoje();

  const entradasHoje = movHoje.length;
  const saidasHoje = finalizadosHoje.length;
  const noPatio = veiculosAtivos.length;

  const filtered = busca.length > 0
    ? veiculosAtivos.filter(v => v.placa.includes(busca.toUpperCase()) || (v.modelo || '').toLowerCase().includes(busca.toLowerCase()))
    : veiculosAtivos;

  // Check if searched plate is in patio
  const buscaPlaca = busca.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const placaEncontrada = buscaPlaca.length >= 3 ? veiculosAtivos.find(v => v.placa.includes(buscaPlaca)) : null;
  const placaNaoEncontrada = buscaPlaca.length >= 7 && !placaEncontrada;

  const totalEstimado = veiculosAtivos.reduce((sum, v) => {
    const diffH = (Date.now() - new Date(v.entrada).getTime()) / 3600000;
    return sum + Math.max(Math.ceil(diffH), 1) * Number(v.valor_hora);
  }, 0);

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>
            Pátio
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{noPatio} veículos estacionados agora</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="glass-card p-3 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Car className="h-4 w-4 text-primary" />
            <p className="stat-label">No Pátio</p>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{noPatio}</p>
        </div>
        <div className="glass-card p-3 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <LogIn className="h-4 w-4 text-accent" />
            <p className="stat-label">Entradas Hoje</p>
          </div>
          <p className="text-2xl font-display font-bold text-accent">{entradasHoje}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <LogOut className="h-4 w-4 text-warning" />
            <p className="stat-label">Saídas Hoje</p>
          </div>
          <p className="text-2xl font-display font-bold text-warning">{saidasHoje}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <p className="stat-label">Receita Estimada</p>
          </div>
          <p className="text-2xl font-display font-bold text-accent">R$ {totalEstimado}</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Consultar placa no pátio..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base" />
        </div>
        {/* Plate status feedback */}
        {buscaPlaca.length >= 7 && (
          <div className={`mt-3 flex items-center gap-2 px-4 py-3 rounded-xl ${placaEncontrada ? 'bg-accent/10 border border-accent/20' : 'bg-destructive/10 border border-destructive/20'}`}>
            {placaEncontrada ? (
              <>
                <Check className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-semibold text-accent">✓ Veículo {buscaPlaca} está no pátio</p>
                  <p className="text-xs text-muted-foreground">{placaEncontrada.modelo} {placaEncontrada.cor ? `• ${placaEncontrada.cor}` : ''} — desde {new Date(placaEncontrada.entrada).toLocaleString('pt-BR')}</p>
                </div>
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-destructive" />
                <p className="text-sm font-semibold text-destructive">Veículo {buscaPlaca} não está no pátio</p>
              </>
            )}
          </div>
        )}
      </div>

      {isLoading && <p className="text-center text-muted-foreground py-8">Carregando...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((v, i) => {
          const diffMs = Date.now() - new Date(v.entrada).getTime();
          const h = Math.floor(diffMs / 3600000);
          const m = Math.round((diffMs % 3600000) / 60000);
          const valor = Math.max(Math.ceil(diffMs / 3600000), 1) * Number(v.valor_hora);

          return (
            <div key={v.id} className={`glass-card-hover p-5 animate-in stagger-${Math.min(i + 1, 8)}`} style={{ opacity: 0 }}>
              <div className="flex items-start justify-between mb-4">
                <div className="h-11 w-11 rounded-xl bg-primary/[0.08] flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
              </div>
              <p className="font-mono text-xl font-bold text-foreground tracking-wide">{v.placa}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{v.modelo}</p>
              {v.cor && <p className="text-xs text-muted-foreground">{v.cor}</p>}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /><span>{h}h {m}min</span>
                </div>
                <span className="text-base font-display font-bold text-accent">R$ {valor}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && filtered.length === 0 && !placaNaoEncontrada && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Car className="h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">Pátio vazio</p>
          <p className="text-sm">Nenhum veículo estacionado no momento</p>
        </div>
      )}
    </div>
  );
}
