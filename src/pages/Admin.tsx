import { useState } from "react";
import { ShieldCheck, Users, KeyRound, Search, Shield, Check, X, Eye, Printer, FileDown, DollarSign, LogOut, Plus, Pencil, Mail, Copy, CheckCircle, History, Trash2, Edit, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

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
  { nome: 'Admin', value: 'admin', descricao: 'Acesso total ao sistema', permissoes: ['dashboard', 'entrada', 'saida', 'patio', 'clientes', 'veiculos', 'mensalistas', 'financeiro', 'relatorios', 'comprovantes', 'admin', 'configuracoes', 'usuarios', 'exportar_pdf', 'importar', 'deletar'], color: 'bg-destructive/10 text-destructive' },
  { nome: 'Gerente', value: 'gerente', descricao: 'Gerencia operação', permissoes: ['dashboard', 'entrada', 'saida', 'patio', 'clientes', 'veiculos', 'mensalistas', 'financeiro', 'relatorios', 'comprovantes'], color: 'bg-primary/10 text-primary' },
  { nome: 'Operador', value: 'operador', descricao: 'Opera entradas e saídas', permissoes: ['entrada', 'saida', 'patio', 'comprovantes'], color: 'bg-accent/10 text-accent' },
  { nome: 'Financeiro', value: 'financeiro', descricao: 'Relatórios e financeiro', permissoes: ['dashboard', 'financeiro', 'relatorios', 'mensalistas'], color: 'bg-warning/10 text-warning' },
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
  { key: 'usuarios', label: 'Gerenciar Usuários', icon: Users },
];

const perfilColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive',
  gerente: 'bg-primary/10 text-primary',
  operador: 'bg-accent/10 text-accent',
  financeiro: 'bg-warning/10 text-warning',
};

export default function Admin() {
  const [busca, setBusca] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editPerfil, setEditPerfil] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editNome, setEditNome] = useState("");
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNome, setInviteNome] = useState("");
  const [invitePerfil, setInvitePerfil] = useState("operador");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { data: usuarios = [], isLoading } = useProfiles();
  const { profile: myProfile } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = myProfile?.perfil === 'admin';

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

  const openEdit = (user: any) => {
    setEditingUser(user);
    setEditPerfil(user.perfil);
    setEditStatus(user.status);
    setEditNome(user.nome || '');
  };

  const saveUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ perfil: editPerfil, status: editStatus, nome: editNome })
        .eq('id', editingUser.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: "✓ Usuário atualizado", description: `${editNome} → ${editPerfil}` });
      setEditingUser(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const inviteUser = async () => {
    if (!inviteEmail || !inviteNome) return;
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail, nome: inviteNome, perfil: invitePerfil },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setInviteResult({ email: data.email, tempPassword: data.tempPassword });
      toast({ title: "✓ Usuário convidado!", description: `${inviteNome} (${inviteEmail})` });
    } catch (err: any) {
      toast({ title: "Erro ao convidar", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const copyCredentials = () => {
    if (!inviteResult) return;
    navigator.clipboard.writeText(`Email: ${inviteResult.email}\nSenha temporária: ${inviteResult.tempPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeInvite = () => {
    setInviteOpen(false);
    setInviteEmail("");
    setInviteNome("");
    setInvitePerfil("operador");
    setInviteResult(null);
    setCopied(false);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ShieldCheck className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Acesso Restrito</p>
        <p className="text-sm mt-1">Apenas administradores podem acessar esta área</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          Área Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Gerencie usuários e permissões do sistema</p>
      </div>

      <Tabs defaultValue="usuarios" className="space-y-6">
       <TabsList className="bg-secondary/50 border border-border/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="usuarios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2.5 px-4">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2.5 px-4">
            <KeyRound className="h-4 w-4" /> Permissões
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2.5 px-4">
            <History className="h-4 w-4" /> Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="glass-card p-3 flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar usuário..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10 h-11 border-0 bg-transparent" />
              </div>
            </div>
            <Button onClick={() => setInviteOpen(true)} className="h-11 gap-2 rounded-xl">
              <Mail className="h-4 w-4" /> Convidar
            </Button>
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
                    <th className="text-right p-4 stat-label">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum usuário</td></tr>
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
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)} className="gap-1.5 text-xs h-8">
                          <Pencil className="h-3 w-3" /> Editar
                        </Button>
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

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Editar Usuário
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label className="stat-label text-[11px]">Nome</Label>
                <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="h-11" />
              </div>

              <div className="space-y-2">
                <Label className="stat-label text-[11px]">Email</Label>
                <Input value={editingUser.email || ''} readOnly className="h-11 bg-secondary/50 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <Label className="stat-label text-[11px]">Perfil / Cargo</Label>
                <div className="grid grid-cols-2 gap-2">
                  {perfis.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setEditPerfil(p.value)}
                      className={`h-12 rounded-xl text-xs font-semibold transition-all border-2 flex items-center justify-center gap-2 ${
                        editPerfil === p.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      {p.nome}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {perfis.find(p => p.value === editPerfil)?.descricao}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="stat-label text-[11px]">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ativo', 'inativo'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditStatus(s)}
                      className={`h-11 rounded-xl text-xs font-semibold transition-all border-2 ${
                        editStatus === s
                          ? s === 'ativo' ? 'border-accent bg-accent/10 text-accent' : 'border-destructive bg-destructive/10 text-destructive'
                          : 'border-border bg-secondary text-muted-foreground'
                      }`}
                    >
                      {s === 'ativo' ? '✓ Ativo' : '✕ Inativo'}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={saveUser} disabled={saving} className="w-full h-12 gap-2 rounded-xl">
                {saving ? 'Salvando...' : '✓ Salvar Alterações'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => !open && closeInvite()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Convidar Usuário
            </DialogTitle>
          </DialogHeader>

          {inviteResult ? (
            <div className="space-y-4 pt-2">
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-accent flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Usuário criado com sucesso!
                </p>
                <p className="text-xs text-muted-foreground">Envie as credenciais abaixo para o novo usuário:</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 space-y-2 font-mono text-sm">
                <p><span className="text-muted-foreground">Email:</span> {inviteResult.email}</p>
                <p><span className="text-muted-foreground">Senha:</span> {inviteResult.tempPassword}</p>
              </div>
              <Button onClick={copyCredentials} variant="outline" className="w-full h-11 gap-2 rounded-xl">
                {copied ? <><CheckCircle className="h-4 w-4 text-accent" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar Credenciais</>}
              </Button>
              <Button onClick={closeInvite} className="w-full h-11 rounded-xl">
                Fechar
              </Button>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label className="stat-label text-[11px]">Nome</Label>
                <Input value={inviteNome} onChange={(e) => setInviteNome(e.target.value)} placeholder="Nome do usuário" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label text-[11px]">Email</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label text-[11px]">Perfil / Cargo</Label>
                <div className="grid grid-cols-2 gap-2">
                  {perfis.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setInvitePerfil(p.value)}
                      className={`h-12 rounded-xl text-xs font-semibold transition-all border-2 flex items-center justify-center gap-2 ${
                        invitePerfil === p.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      {p.nome}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={inviteUser} disabled={inviting || !inviteEmail || !inviteNome} className="w-full h-12 gap-2 rounded-xl">
                {inviting ? 'Convidando...' : '✉ Enviar Convite'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
