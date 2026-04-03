import { useState } from "react";
import { ShieldCheck, Users, KeyRound, Building2, Plus, Search, Shield, Pencil, Trash2, Check, X, Eye, Printer, FileDown, DollarSign, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const demoUsuarios = [
  { id: '1', nome: 'Admin Master', email: 'admin@mepark.com', perfil: 'admin', unidade: 'Todas', status: 'ativo' },
  { id: '2', nome: 'Gerente Centro', email: 'gerente@mepark.com', perfil: 'gerente', unidade: 'ME PARK Centro', status: 'ativo' },
  { id: '3', nome: 'Operador Carlos', email: 'carlos@mepark.com', perfil: 'operador', unidade: 'ME PARK Centro', status: 'ativo' },
  { id: '4', nome: 'Operador Ana', email: 'ana@mepark.com', perfil: 'operador', unidade: 'ME PARK Shopping', status: 'ativo' },
  { id: '5', nome: 'Financeiro', email: 'financeiro@mepark.com', perfil: 'financeiro', unidade: 'Todas', status: 'ativo' },
  { id: '6', nome: 'Operador Inativo', email: 'inativo@mepark.com', perfil: 'operador', unidade: 'ME PARK Centro', status: 'inativo' },
];

const perfis = [
  {
    nome: 'Admin Master',
    descricao: 'Acesso total ao sistema',
    permissoes: ['dashboard', 'entrada', 'saida', 'patio', 'clientes', 'veiculos', 'mensalistas', 'financeiro', 'relatorios', 'comprovantes', 'admin', 'configuracoes'],
    color: 'bg-destructive/10 text-destructive',
  },
  {
    nome: 'Gerente',
    descricao: 'Gerencia sua unidade',
    permissoes: ['dashboard', 'entrada', 'saida', 'patio', 'clientes', 'veiculos', 'mensalistas', 'financeiro', 'relatorios', 'comprovantes'],
    color: 'bg-primary/10 text-primary',
  },
  {
    nome: 'Operador',
    descricao: 'Opera entradas e saídas',
    permissoes: ['entrada', 'saida', 'patio', 'comprovantes'],
    color: 'bg-accent/10 text-accent',
  },
  {
    nome: 'Financeiro',
    descricao: 'Acesso a relatórios e financeiro',
    permissoes: ['dashboard', 'financeiro', 'relatorios', 'mensalistas'],
    color: 'bg-warning/10 text-warning',
  },
];

const allPermissions = [
  { key: 'dashboard', label: 'Dashboard', icon: Eye },
  { key: 'entrada', label: 'Registrar Entrada', icon: Plus },
  { key: 'saida', label: 'Registrar Saída', icon: LogOut },
  { key: 'patio', label: 'Ver Pátio', icon: Eye },
  { key: 'clientes', label: 'Gerenciar Clientes', icon: Users },
  { key: 'veiculos', label: 'Gerenciar Veículos', icon: Eye },
  { key: 'mensalistas', label: 'Gerenciar Mensalistas', icon: Eye },
  { key: 'financeiro', label: 'Acesso Financeiro', icon: DollarSign },
  { key: 'relatorios', label: 'Ver Relatórios', icon: Eye },
  { key: 'comprovantes', label: 'Imprimir Comprovantes', icon: Printer },
  { key: 'exportar_pdf', label: 'Exportar PDF', icon: FileDown },
  { key: 'dar_desconto', label: 'Dar Desconto', icon: DollarSign },
  { key: 'admin', label: 'Área Admin', icon: ShieldCheck },
  { key: 'configuracoes', label: 'Configurações', icon: Shield },
];

const demoUnidades = [
  { id: '1', nome: 'ME PARK Centro', endereco: 'Rua Principal, 100 - Centro', vagas: 50, valorHora: 12 },
  { id: '2', nome: 'ME PARK Shopping', endereco: 'Av. Shopping, 500 - Vila Nova', vagas: 120, valorHora: 15 },
  { id: '3', nome: 'ME PARK Aeroporto', endereco: 'Rod. Aeroporto, km 5', vagas: 200, valorHora: 20 },
];

const perfilColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive',
  gerente: 'bg-primary/10 text-primary',
  operador: 'bg-accent/10 text-accent',
  financeiro: 'bg-warning/10 text-warning',
};

export default function Admin() {
  const [busca, setBusca] = useState("");
  const { toast } = useToast();
  const filtered = demoUsuarios.filter(u => u.nome.toLowerCase().includes(busca.toLowerCase()) || u.email.includes(busca));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          Área Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Gerencie usuários, permissões e unidades do sistema</p>
      </div>

      <Tabs defaultValue="usuarios" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50 p-1 h-auto">
          <TabsTrigger value="usuarios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2.5 px-4">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2.5 px-4">
            <KeyRound className="h-4 w-4" /> Permissões
          </TabsTrigger>
          <TabsTrigger value="unidades" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2.5 px-4">
            <Building2 className="h-4 w-4" /> Unidades
          </TabsTrigger>
        </TabsList>

        {/* USUÁRIOS */}
        <TabsContent value="usuarios" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="glass-card p-3 flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar usuário..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10 h-11 border-0 bg-transparent" />
              </div>
            </div>
            <Button className="gap-2 h-11 px-6 rounded-xl" onClick={() => toast({ title: "Funcionalidade disponível com Lovable Cloud" })}>
              <Plus className="h-4 w-4" /> Novo Usuário
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: demoUsuarios.length, color: 'text-foreground' },
              { label: 'Ativos', value: demoUsuarios.filter(u => u.status === 'ativo').length, color: 'text-accent' },
              { label: 'Admins', value: demoUsuarios.filter(u => u.perfil === 'admin').length, color: 'text-destructive' },
              { label: 'Operadores', value: demoUsuarios.filter(u => u.perfil === 'operador').length, color: 'text-primary' },
            ].map((s) => (
              <div key={s.label} className="glass-card p-5">
                <p className="stat-label">{s.label}</p>
                <p className={`stat-value mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* User list */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 stat-label">Usuário</th>
                    <th className="text-left p-4 stat-label hidden md:table-cell">Unidade</th>
                    <th className="text-left p-4 stat-label">Perfil</th>
                    <th className="text-left p-4 stat-label">Status</th>
                    <th className="text-right p-4 stat-label">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {u.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{u.nome}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{u.unidade}</td>
                      <td className="p-4">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${perfilColors[u.perfil] || ''}`}>
                          {u.perfil}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-lg ${u.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* PERMISSÕES */}
        <TabsContent value="permissoes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {perfis.map((perfil) => (
              <div key={perfil.nome} className="glass-card p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${perfil.color}`}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{perfil.nome}</h3>
                    <p className="text-xs text-muted-foreground">{perfil.descricao}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="stat-label">Permissões</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {allPermissions.map((perm) => {
                      const has = perfil.permissoes.includes(perm.key);
                      return (
                        <div key={perm.key} className={`flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm ${has ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                          <div className={`h-5 w-5 rounded flex items-center justify-center ${has ? 'bg-accent/10' : 'bg-secondary'}`}>
                            {has ? <Check className="h-3 w-3 text-accent" /> : <X className="h-3 w-3 text-muted-foreground/30" />}
                          </div>
                          <span className="text-xs">{perm.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* UNIDADES */}
        <TabsContent value="unidades" className="space-y-6">
          <div className="flex justify-end">
            <Button className="gap-2 h-11 px-6 rounded-xl" onClick={() => toast({ title: "Funcionalidade disponível com Lovable Cloud" })}>
              <Plus className="h-4 w-4" /> Nova Unidade
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoUnidades.map((u) => (
              <div key={u.id} className="glass-card p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{u.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{u.endereco}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-secondary/40">
                    <p className="stat-label">Vagas</p>
                    <p className="text-xl font-display font-bold text-foreground mt-1">{u.vagas}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/40">
                    <p className="stat-label">R$/Hora</p>
                    <p className="text-xl font-display font-bold text-accent mt-1">R$ {u.valorHora}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1 rounded-lg"><Pencil className="h-3 w-3" /> Editar</Button>
                  <Button variant="outline" size="sm" className="gap-1 rounded-lg text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
