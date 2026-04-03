import { CarFront, Search, Plus, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const demoVeiculos = [
  { id: '1', placa: 'ABC1D23', modelo: 'Honda Civic', cor: 'Preto', marca: 'Honda', cliente: 'Carlos Silva', entradas: 45 },
  { id: '2', placa: 'XYZ4E56', modelo: 'Toyota Corolla', cor: 'Branco', marca: 'Toyota', cliente: 'Maria Santos', entradas: 12 },
  { id: '3', placa: 'MNO7F89', modelo: 'VW Golf', cor: 'Prata', marca: 'VW', cliente: 'João Oliveira', entradas: 38 },
  { id: '4', placa: 'JKL2G34', modelo: 'Fiat Argo', cor: 'Vermelho', marca: 'Fiat', cliente: 'Ana Costa', entradas: 5 },
  { id: '5', placa: 'DEF5H67', modelo: 'Hyundai HB20', cor: 'Azul', marca: 'Hyundai', cliente: 'Pedro Lima', entradas: 67 },
  { id: '6', placa: 'GHI8I90', modelo: 'Chevrolet Onix', cor: 'Cinza', marca: 'Chevrolet', cliente: 'Fernanda Rocha', entradas: 8 },
];

export default function Veiculos() {
  const [busca, setBusca] = useState("");
  const filtered = demoVeiculos.filter(v => v.placa.includes(busca.toUpperCase()) || v.modelo.toLowerCase().includes(busca.toLowerCase()) || v.cliente.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CarFront className="h-5 w-5 text-primary" />
            </div>
            Veículos
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{demoVeiculos.length} veículos cadastrados</p>
        </div>
        <Button className="gap-2 h-11 px-6 rounded-xl">
          <Plus className="h-4 w-4" /> Novo Veículo
        </Button>
      </div>

      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa, modelo ou cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base border-0 bg-transparent" />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 stat-label">Placa</th>
                <th className="text-left p-4 stat-label">Veículo</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Cor</th>
                <th className="text-left p-4 stat-label hidden lg:table-cell">Proprietário</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Entradas</th>
                <th className="text-right p-4 stat-label">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="p-4">
                    <span className="font-mono font-bold text-foreground text-base tracking-wider">{v.placa}</span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-foreground">{v.marca} {v.modelo}</p>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{v.cor}</span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">{v.cliente}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="font-mono text-sm text-foreground">{v.entradas}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </button>
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
