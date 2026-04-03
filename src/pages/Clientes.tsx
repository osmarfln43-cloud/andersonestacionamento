import { Users, Search, Plus, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";

const demoClientes = [
  { id: '1', nome: 'Carlos Silva', cpf: '123.456.789-00', telefone: '(11) 99999-0001', tipo: 'mensalista', status: 'ativo' },
  { id: '2', nome: 'Maria Santos', cpf: '987.654.321-00', telefone: '(11) 99999-0002', tipo: 'eventual', status: 'ativo' },
  { id: '3', nome: 'João Oliveira', cpf: '456.789.123-00', telefone: '(11) 99999-0003', tipo: 'mensalista', status: 'ativo' },
  { id: '4', nome: 'Ana Costa', cpf: '321.654.987-00', telefone: '(11) 99999-0004', tipo: 'eventual', status: 'inativo' },
  { id: '5', nome: 'Pedro Lima', cpf: '654.987.321-00', telefone: '(11) 99999-0005', tipo: 'mensalista', status: 'ativo' },
];

export default function Clientes() {
  const [busca, setBusca] = useState("");
  const filtered = demoClientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.cpf.includes(busca));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" /> Clientes
          </h1>
          <p className="text-sm text-muted-foreground">{demoClientes.length} clientes cadastrados</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Cliente</Button>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CPF..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card-hover p-4 flex items-center gap-4"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {c.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{c.nome}</p>
              <p className="text-xs text-muted-foreground">{c.cpf}</p>
            </div>
            <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefone}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              c.tipo === 'mensalista' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
            }`}>{c.tipo}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              c.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
            }`}>{c.status}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
