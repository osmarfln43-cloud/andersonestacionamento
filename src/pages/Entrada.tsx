import { useState } from "react";
import { LogIn, Car, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegistrarEntrada } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";

export default function Entrada() {
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [tipo, setTipo] = useState<'avulso' | 'mensalista'>('avulso');
  const registrarEntrada = useRegistrarEntrada();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim() || !modelo.trim()) {
      toast({ title: "Preencha placa e modelo", variant: "destructive" });
      return;
    }
    registrarEntrada.mutate(
      { placa: placa.toUpperCase(), modelo, cor, tipo_cliente: tipo, observacao },
      {
        onSuccess: () => {
          toast({ title: "✓ Entrada registrada", description: `${placa.toUpperCase()} – ${modelo}` });
          setPlaca(""); setModelo(""); setCor(""); setObservacao("");
        },
        onError: (err: any) => {
          toast({ title: "Erro ao registrar", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <LogIn className="h-5 w-5 text-accent" />
          </div>
          Entrada de Veículo
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Registre a entrada rapidamente</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6 animate-in" style={{ opacity: 0 }}>
        <div className="space-y-2">
          <Label className="stat-label">Placa do Veículo</Label>
          <Input
            placeholder="ABC1D23"
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            className="h-16 text-3xl font-mono font-bold tracking-[0.15em] text-center uppercase bg-secondary border-border focus:border-primary"
            maxLength={7}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="stat-label">Modelo</Label>
            <Input placeholder="Ex: Honda Civic" value={modelo} onChange={(e) => setModelo(e.target.value)} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label className="stat-label">Cor</Label>
            <Input placeholder="Ex: Preto" value={cor} onChange={(e) => setCor(e.target.value)} className="h-12" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="stat-label">Tipo de Cliente</Label>
          <div className="grid grid-cols-2 gap-3">
            {(['avulso', 'mensalista'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`h-12 rounded-xl text-sm font-medium transition-all border-2 ${
                  tipo === t
                    ? 'border-primary bg-primary/[0.06] text-primary'
                    : 'border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {t === 'avulso' ? '🅿️ Avulso' : '📋 Mensalista'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="stat-label">Observação (opcional)</Label>
          <Input placeholder="Alguma observação..." value={observacao} onChange={(e) => setObservacao(e.target.value)} className="h-12" />
        </div>

        <Button type="submit" className="w-full h-14 text-base font-semibold gap-2 rounded-xl" disabled={registrarEntrada.isPending}>
          <Zap className="h-5 w-5" /> {registrarEntrada.isPending ? 'Registrando...' : 'Registrar Entrada'}
        </Button>

        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} – registro automático</span>
        </div>
      </form>
    </div>
  );
}
