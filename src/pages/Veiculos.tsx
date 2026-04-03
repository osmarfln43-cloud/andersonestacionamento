import { CarFront, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";

const demoVeiculos = [
  { id: '1', placa: 'ABC1D23', modelo: 'Honda Civic', cor: 'Preto', marca: 'Honda', cliente: 'Carlos Silva' },
  { id: '2', placa: 'XYZ4E56', modelo: 'Toyota Corolla', cor: 'Branco', marca: 'Toyota', cliente: 'Maria Santos' },
  { id: '3', placa: 'MNO7F89', modelo: 'VW Golf', cor: 'Prata', marca: 'VW', cliente: 'João Oliveira' },
  { id: '4', placa: 'JKL2G34', modelo: 'Fiat Argo', cor: 'Vermelho', marca: 'Fiat', cliente: 'Ana Costa' },
  { id: '5', placa: 'DEF5H67', modelo: 'Hyundai HB20', cor: 'Azul', marca: 'Hyundai', cliente: 'Pedro Lima' },
];

export default function Veiculos() {
  const [busca, setBusca] = useState("");
  const filtered = demoVeiculos.filter(v => v.placa.includes(busca.toUpperCase()) || v.modelo.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <CarFront className="h-6 w-6 text-primary" /> Veículos
          </h1>
          <p className="text-sm text-muted-foreground">{demoVeiculos.length} veículos cadastrados</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Veículo</Button>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa ou modelo..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card-hover p-5"
          >
            <p className="font-mono text-lg font-bold text-foreground">{v.placa}</p>
            <p className="text-sm text-muted-foreground mt-1">{v.marca} {v.modelo}</p>
            <p className="text-xs text-muted-foreground">Cor: {v.cor}</p>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Proprietário</p>
              <p className="text-sm text-foreground">{v.cliente}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
