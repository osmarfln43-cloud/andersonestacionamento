import { Users, Search, Plus, Phone, Mail, ChevronRight, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const demoClientes = [
  { id: '1', nome: 'Carlos Silva', cpf: '123.456.789-00', telefone: '(11) 99999-0001', email: 'carlos@email.com', tipo: 'mensalista', status: 'ativo', veiculos: 2, movimentacoes: 45 },
  { id: '2', nome: 'Maria Santos', cpf: '987.654.321-00', telefone: '(11) 99999-0002', email: 'maria@email.com', tipo: 'eventual', status: 'ativo', veiculos: 1, movimentacoes: 12 },
  { id: '3', nome: 'João Oliveira', cpf: '456.789.123-00', telefone: '(11) 99999-0003', email: 'joao@email.com', tipo: 'mensalista', status: 'ativo', veiculos: 1, movimentacoes: 38 },
  { id: '4', nome: 'Ana Costa', cpf: '321.654.987-00', telefone: '(11) 99999-0004', email: 'ana@email.com', tipo: 'eventual', status: 'inativo', veiculos: 1, movimentacoes: 5 },
  { id: '5', nome: 'Pedro Lima', cpf: '654.987.321-00', telefone: '(11) 99999-0005', email: 'pedro@email.com', tipo: 'mensalista', status: 'ativo', veiculos: 3, movimentacoes: 67 },
  { id: '6', nome: 'Fernanda Rocha', cpf: '789.123.456-00', telefone: '(11) 99999-0006', email: 'fernanda@email.com', tipo: 'eventual', status: 'ativo', veiculos: 1, movimentacoes: 8 },
];

export default function Clientes() {
  const [busca, setBusca] = useState("");
  const filtered = demoClientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.cpf.includes(busca) || c.telefone.includes(busca));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{demoClientes.length} clientes cadastrados</p>
        </div>
        <Button className="gap-2 h-11 px-6 rounded-xl">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: demoClientes.length, color: 'text-foreground' },
          { label: 'Ativos', value: demoClientes.filter(c => c.status === 'ativo').length, color: 'text-accent' },
          { label: 'Mensalistas', value: demoClientes.filter(c => c.tipo === 'mensalista').length, color: 'text-primary' },
          { label: 'Eventuais', value: demoClientes.filter(c => c.tipo === 'eventual').length, color: 'text-muted-foreground' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <p className="stat-label">{s.label}</p>
            <p className={`stat-value mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF ou telefone..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base border-0 bg-transparent" />
        </div>
      </div>

      {/* Client Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 stat-label">Cliente</th>
                <th className="text-left p-4 stat-label hidden lg:table-cell">Contato</th>
                <th className="text-left p-4 stat-label">Tipo</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Veículos</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Movimentações</th>
                <th className="text-left p-4 stat-label">Status</th>
                <th className="text-right p-4 stat-label">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {c.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{c.nome}</p>
                        <p className="text-xs text-muted-foreground font-mono">{c.cpf}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.telefone}</p>
                      <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                      c.tipo === 'mensalista' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}>{c.tipo}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="font-mono text-sm text-foreground">{c.veiculos}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="font-mono text-sm text-foreground">{c.movimentacoes}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-lg ${
                      c.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                    }`}>{c.status}</span>
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
