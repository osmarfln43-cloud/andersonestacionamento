import { useState } from "react";
import { ShieldCheck, Users, KeyRound, Plus, Search, Shield, Pencil, Trash2, Check, X, Eye, Printer, FileDown, DollarSign, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

const perfis = [
  { nome: 'Admin', descricao: 'Acesso total ao sistema', permissoes: ['dashboard', 'entrada', 'saida', 'patio', 'clientes', 'veiculos', 'mensalistas', 'financeiro', 'relatorios', 'comprovantes', 'admin', 'configuracoes'], color: 'bg-destructive/10 text-destructive' },
  { nome: 'Gerente', descricao: 'Gerencia operação', permissoes: ['dashboard', 'entrada', 'saida', 'patio', 'clientes', 'veiculos', 'mensalistas', 'financeiro', 'relatorios', 'comprovantes'], color: 'bg-primary/10 text-primary' },
  { nome: 'Operador', descricao: 'Opera entradas e saídas', permissoes: ['entrada', 'saida', 'patio', 'comprovantes'], color: 'bg-accent/10 text-accent' },
  { nome: 'Financeiro', descricao: 'Relatórios e financeiro', permissoes: ['dashboard', 'financeiro', 'relatorios', 'mensalistas'], color: 'bg-warning/10 text-warning' },
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
  { key: 'admin', label: 'Área Admin', icon: ShieldCheck },
  { key: 'configuracoes', label: 'Configurações', icon: Shield },
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
  const { data: usuarios = [], isLoading } = useProfiles();
  const queryClient = useQueryClient();

  const filtered = usuarios.filter((u: any) =>
    (u.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (u.email || '').includes(busca)
  );

  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter((u: any) => u.status === 'ativo').length,
    admins: usuarios.filter((u: any) => u.perfil === 'admin').length,
    operadores: usuarios.filter((u: any) => u.perfil === 'operador').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          Área Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Gerencie usuários e permissões do sistema</p>
      </div>

      <Tabs defaultValue="usuarios" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50 p-1 h-auto">
          <TabsTrigger value="usuarios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2.5 px-4">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2.5 px-4">
            <KeyRound className="h-4 w-4" /> Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="glass-card p-3 flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar usuário..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10 h-11 border-0 bg-transparent" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total, color: 'text-foreground' },
              { label: 'Ativos', value: stats.ativos, color: 'text-accent' },
              { label: 'Admins', value: stats.admins, color: 'text-destructive' },
              { label: 'Operadores', value: stats.operadores, color: 'text-primary' },
            ].map((s) => (
              <div key={s.label} className="glass-card p-5">
                <p className="stat-label">{s.label}</p>
                <p className={`stat-value mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 stat-label">Usuário</th>
                    <th className="text-left p-4 stat-label">Perfil</th>
                    <th className="text-left p-4 stat-label">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Nenhum usuário</td></tr>
                  ) : filtered.map((u: any) => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {(u.nome || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{u.nome || '—'}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${perfilColors[u.perfil] || 'bg-secondary text-muted-foreground'}`}>
                          {u.perfil}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-lg ${u.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

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
      </Tabs>
    </div>
  );
}
