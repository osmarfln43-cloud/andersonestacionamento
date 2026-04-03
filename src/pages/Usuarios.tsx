import { UserCog, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const demoUsuarios = [
  { id: '1', nome: 'Admin Master', email: 'admin@mepark.com', perfil: 'admin', status: 'ativo' },
  { id: '2', nome: 'Gerente Centro', email: 'gerente@mepark.com', perfil: 'gerente', status: 'ativo' },
  { id: '3', nome: 'Operador 1', email: 'op1@mepark.com', perfil: 'operador', status: 'ativo' },
  { id: '4', nome: 'Operador 2', email: 'op2@mepark.com', perfil: 'operador', status: 'inativo' },
  { id: '5', nome: 'Financeiro', email: 'fin@mepark.com', perfil: 'financeiro', status: 'ativo' },
];

const perfilColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive',
  gerente: 'bg-primary/10 text-primary',
  operador: 'bg-accent/10 text-accent',
  financeiro: 'bg-warning/10 text-warning',
};

export default function Usuarios() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <UserCog className="h-6 w-6 text-primary" /> Usuários
          </h1>
          <p className="text-sm text-muted-foreground">{demoUsuarios.length} usuários cadastrados</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Usuário</Button>
      </div>

      <div className="space-y-3">
        {demoUsuarios.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card-hover p-4 flex items-center gap-4"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {u.nome.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{u.nome}</p>
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
    </div>
  );
}
