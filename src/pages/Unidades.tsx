import { Building2, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const demoUnidades = [
  { id: '1', nome: 'ME PARK Centro', endereco: 'Rua Principal, 100 - Centro', vagas: 50, ocupacao: 72, valorHora: 12 },
  { id: '2', nome: 'ME PARK Shopping', endereco: 'Av. Shopping, 500 - Vila Nova', vagas: 120, ocupacao: 85, valorHora: 15 },
  { id: '3', nome: 'ME PARK Aeroporto', endereco: 'Rod. Aeroporto, km 5', vagas: 200, ocupacao: 45, valorHora: 20 },
];

export default function Unidades() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" /> Unidades
          </h1>
          <p className="text-sm text-muted-foreground">{demoUnidades.length} unidades cadastradas</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Unidade</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoUnidades.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card-hover p-5 space-y-4"
          >
            <div>
              <h3 className="font-bold text-foreground">{u.nome}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{u.endereco}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/30 rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Vagas</p>
                <p className="font-mono font-bold text-foreground">{u.vagas}</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Ocupação</p>
                <p className="font-mono font-bold text-accent">{u.ocupacao}%</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground">R$/hora</p>
                <p className="font-mono font-bold text-foreground">R$ {u.valorHora}</p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${u.ocupacao}%` }} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
