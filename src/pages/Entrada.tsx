import { useState } from "react";
import { LogIn, Search, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Entrada() {
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [tipo, setTipo] = useState<'avulso' | 'mensalista'>('avulso');
  const { registrarEntrada } = useStore();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim() || !modelo.trim()) {
      toast({ title: "Preencha placa e modelo", variant: "destructive" });
      return;
    }
    registrarEntrada({ placa: placa.toUpperCase(), modelo, cor, tipoCliente: tipo, observacao });
    toast({ title: "Entrada registrada!", description: `${placa.toUpperCase()} - ${modelo}` });
    setPlaca(""); setModelo(""); setCor(""); setObservacao("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <LogIn className="h-6 w-6 text-primary" /> Entrada de Veículo
        </h1>
        <p className="text-sm text-muted-foreground">Registre a entrada de um veículo no estacionamento</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass-card p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="placa">Placa *</Label>
            <Input
              id="placa"
              placeholder="ABC1D23"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              className="font-mono text-lg uppercase"
              maxLength={7}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo *</Label>
            <Input id="modelo" placeholder="Honda Civic" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cor">Cor</Label>
            <Input id="cor" placeholder="Preto" value={cor} onChange={(e) => setCor(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Cliente</Label>
            <div className="flex gap-2">
              {(['avulso', 'mensalista'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all border ${
                    tipo === t
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="obs">Observação</Label>
          <Input id="obs" placeholder="Opcional" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1 h-12 text-base gap-2">
            <Car className="h-5 w-5" /> Registrar Entrada
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <Clock className="h-3 w-3" />
          <span>Data/hora registrada automaticamente: {new Date().toLocaleString('pt-BR')}</span>
        </div>
      </motion.form>
    </div>
  );
}

function Clock(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
