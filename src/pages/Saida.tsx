import { useState } from "react";
import { LogOut, Search, DollarSign, QrCode, Banknote, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, Movimentacao } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

export default function Saida() {
  const [busca, setBusca] = useState("");
  const [selected, setSelected] = useState<Movimentacao | null>(null);
  const [showPix, setShowPix] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const { veiculosAtivos, registrarSaida } = useStore();
  const { toast } = useToast();

  const filtered = busca.length > 0
    ? veiculosAtivos.filter(v => v.placa.includes(busca.toUpperCase()) || v.modelo.toLowerCase().includes(busca.toLowerCase()))
    : veiculosAtivos;

  const calcularValor = (mov: Movimentacao) => {
    const diffMs = Date.now() - new Date(mov.entrada).getTime();
    const diffH = diffMs / 3600000;
    return { hours: Math.floor(diffH), mins: Math.round((diffH % 1) * 60), total: Math.max(Math.ceil(diffH), 1) * mov.valorHora };
  };

  const handlePagamento = (tipo: 'pix' | 'dinheiro') => {
    if (!selected) return;
    const result = registrarSaida(selected.id, tipo);
    if (result) {
      setSelected({ ...selected, ...result });
      setFinalizado(true);
      toast({ title: "Saída registrada!", description: `${selected.placa} - ${tipo.toUpperCase()}` });
    }
  };

  const pixCode = `00020126580014br.gov.bcb.pix0136mepark@estacionamento.com.br5204000053039865404${selected ? calcularValor(selected).total.toFixed(2) : '0.00'}5802BR5913ME PARK AI6008SAOPAULO`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <LogOut className="h-6 w-6 text-warning" /> Saída / Fechamento
        </h1>
        <p className="text-sm text-muted-foreground">Busque um veículo para registrar a saída</p>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa ou modelo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {!selected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((v) => {
            const calc = calcularValor(v);
            return (
              <motion.button
                key={v.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => { setSelected(v); setFinalizado(false); setShowPix(false); }}
                className="glass-card-hover p-4 text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-mono font-bold text-sm">{v.placa.slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-foreground">{v.placa}</p>
                    <p className="text-xs text-muted-foreground">{v.modelo} • {v.cor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-accent">R$ {calc.total}</p>
                    <p className="text-xs text-muted-foreground">{calc.hours}h {calc.mins}min</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-2 text-center py-8">Nenhum veículo encontrado no pátio</p>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Button variant="ghost" onClick={() => { setSelected(null); setShowPix(false); setFinalizado(false); }} className="text-sm text-muted-foreground">
              ← Voltar
            </Button>

            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-mono font-bold text-lg">{selected.placa.slice(0, 3)}</span>
                </div>
                <div>
                  <p className="text-xl font-mono font-bold text-foreground">{selected.placa}</p>
                  <p className="text-sm text-muted-foreground">{selected.modelo} • {selected.cor}</p>
                </div>
                <div className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                  finalizado ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'
                }`}>
                  {finalizado ? 'Finalizado' : 'Em aberto'}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Entrada', value: new Date(selected.entrada).toLocaleString('pt-BR') },
                  { label: 'Saída', value: finalizado && selected.saida ? new Date(selected.saida).toLocaleString('pt-BR') : 'Agora' },
                  { label: 'Tempo', value: finalizado ? selected.tempoTotal : `${calcularValor(selected).hours}h ${calcularValor(selected).mins}min` },
                  { label: 'Valor Total', value: `R$ ${finalizado ? selected.valorTotal : calcularValor(selected).total}`, highlight: true },
                ].map((item) => (
                  <div key={item.label} className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className={`font-mono font-bold text-sm mt-1 ${(item as any).highlight ? 'text-accent' : 'text-foreground'}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {!finalizado && (
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => { setShowPix(true); handlePagamento('pix'); }} className="flex-1 h-12 gap-2 bg-primary hover:bg-primary/90">
                    <QrCode className="h-5 w-5" /> PIX
                  </Button>
                  <Button onClick={() => handlePagamento('dinheiro')} variant="secondary" className="flex-1 h-12 gap-2">
                    <Banknote className="h-5 w-5" /> Dinheiro
                  </Button>
                </div>
              )}

              {finalizado && showPix && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 p-6 bg-secondary/30 rounded-xl">
                  <p className="text-sm font-medium text-foreground">QR Code PIX</p>
                  <div className="bg-foreground p-4 rounded-xl">
                    <QRCodeSVG value={pixCode} size={180} />
                  </div>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Escaneie o QR Code com seu app do banco para efetuar o pagamento
                  </p>
                </motion.div>
              )}

              {finalizado && (
                <Button variant="outline" className="w-full gap-2">
                  <Printer className="h-4 w-4" /> Imprimir Comprovante
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
