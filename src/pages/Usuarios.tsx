import { UserCog, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const perfilColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive',
  gerente: 'bg-primary/10 text-primary',
  operador: 'bg-accent/10 text-accent',
  financeiro: 'bg-warning/10 text-warning',
};

export default function Usuarios() {
  const { profile } = useAuth();
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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
          {usuarios.map((u: any, i: number) => (
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
              <div className="flex-1">
                <p className="font-medium text-foreground">{u.nome || '—'}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${perfilColors[u.perfil] || ''}`}>
                <Shield className="h-3 w-3" />
                {u.perfil}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                {u.status}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
