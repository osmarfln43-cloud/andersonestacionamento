import { UserCog, Shield, Trash2, MoreVertical, Power } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const perfilColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive',
  gerente: 'bg-primary/10 text-primary',
  operador: 'bg-accent/10 text-accent',
  financeiro: 'bg-warning/10 text-warning',
};

const perfilLabels: Record<string, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  operador: 'Operador',
  financeiro: 'Financeiro',
};

export default function Usuarios() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });

  const handleToggleStatus = (u: any) => {
    const newStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
    updateProfile.mutate(
      { id: u.id, updates: { status: newStatus } },
      { onSuccess: () => toast.success(`Usuário ${newStatus === 'ativo' ? 'ativado' : 'desativado'}`) }
    );
  };

  const handleChangePerfil = (u: any, newPerfil: string) => {
    updateProfile.mutate(
      { id: u.id, updates: { perfil: newPerfil } },
      { onSuccess: () => toast.success(`Perfil alterado para ${perfilLabels[newPerfil]}`) }
    );
  };

  const handleDelete = (u: any) => {
    if (!confirm(`Excluir o usuário "${u.nome}"? Esta ação não pode ser desfeita.`)) return;
    deleteProfile.mutate(u.id, {
      onSuccess: () => toast.success('Usuário excluído'),
      onError: () => toast.error('Erro ao excluir usuário'),
    });
  };

  if (profile?.perfil !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <UserCog className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Acesso Restrito</p>
        <p className="text-sm mt-1">Apenas administradores podem ver usuários</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <UserCog className="h-6 w-6 text-primary" /> Usuários
        </h1>
        <p className="text-sm text-muted-foreground">{usuarios.length} usuários cadastrados</p>
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {usuarios.map((u: any, i: number) => {
            const isSelf = u.user_id === user?.id;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex items-center gap-4"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {(u.nome || '?').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{u.nome || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${perfilColors[u.perfil] || ''}`}>
                  <Shield className="h-3 w-3" />
                  {u.perfil}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  {u.status}
                </span>

                {!isSelf && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleStatus(u)}>
                        <Power className="h-4 w-4 mr-2" />
                        {u.status === 'ativo' ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Shield className="h-4 w-4 mr-2" />
                          Alterar Perfil
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {(['admin', 'gerente', 'operador', 'financeiro'] as const).map((p) => (
                              <DropdownMenuItem
                                key={p}
                                disabled={u.perfil === p}
                                onClick={() => handleChangePerfil(u, p)}
                              >
                                {perfilLabels[p]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(u)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
