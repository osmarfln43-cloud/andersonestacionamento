import { Printer, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function Comprovantes() {
  const { saidasHoje } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Printer className="h-6 w-6 text-primary" /> Comprovantes
        </h1>
        <p className="text-sm text-muted-foreground">Histórico e reimpressão de comprovantes</p>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa..." className="pl-10" />
        </div>
      </div>

      <div className="space-y-3">
        {saidasHoje.map((m) => (
          <div key={m.id} className="glass-card-hover p-4 flex items-center gap-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-mono font-medium text-foreground">{m.placa}</p>
              <p className="text-xs text-muted-foreground">{m.modelo} • {m.formaPagamento?.toUpperCase()}</p>
            </div>
            <p className="font-mono text-sm text-foreground">R$ {m.valorTotal}</p>
            <Button variant="outline" size="sm" className="gap-1"><Printer className="h-3 w-3" /> Reimprimir</Button>
          </div>
        ))}
        {saidasHoje.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum comprovante hoje</p>}
      </div>
    </div>
  );
}
