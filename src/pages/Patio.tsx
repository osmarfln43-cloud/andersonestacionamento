import { Car, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Patio() {
  const [busca, setBusca] = useState("");
  const { veiculosAtivos } = useStore();

  const filtered = busca.length > 0
    ? veiculosAtivos.filter(v => v.placa.includes(busca.toUpperCase()) || v.modelo.toLowerCase().includes(busca.toLowerCase()))
    : veiculosAtivos;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Car className="h-6 w-6 text-accent" /> Pátio
          </h1>
          <p className="text-sm text-muted-foreground">{veiculosAtivos.length} veículos estacionados</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa ou modelo..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v, i) => {
          const diffMs = Date.now() - new Date(v.entrada).getTime();
          const h = Math.floor(diffMs / 3600000);
          const m = Math.round((diffMs % 3600000) / 60000);
          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-hover p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              </div>
              <p className="font-mono text-lg font-bold text-foreground">{v.placa}</p>
              <p className="text-sm text-muted-foreground">{v.modelo} • {v.cor}</p>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{h}h {m}min no pátio</span>
              </div>
              <div className="mt-2 text-right">
                <span className="text-sm font-mono font-bold text-accent">R$ {Math.max(Math.ceil(diffMs / 3600000), 1) * v.valorHora}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Car className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum veículo no pátio</p>
        </div>
      )}
    </div>
  );
}
