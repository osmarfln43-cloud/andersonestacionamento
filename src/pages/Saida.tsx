import { useState } from "react";
import { LogOut, Search, QrCode, Banknote, Printer, Clock, ArrowLeft, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, Movimentacao } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

export default function Saida() {
  const [busca, setBusca] = useState("");
  const [selected, setSelected] = useState<Movimentacao | null>(null);
  const [showPix, setShowPix] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
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
      if (tipo === 'pix') setShowPix(true);
      toast({ title: "✓ Saída registrada", description: `${selected.placa} — ${tipo.toUpperCase()}` });
    }
  };

  const pixCode = `00020126580014br.gov.bcb.pix0136mepark@estacionamento.com.br5204000053039865404${selected ? calcularValor(selected).total.toFixed(2) : '0.00'}5802BR5913ME PARK AI6008SAOPAULO`;

  // Vehicle list view
  if (!selected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <LogOut className="h-5 w-5 text-warning" />
            </div>
            Saída / Fechamento
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Selecione um veículo para registrar a saída</p>
        </div>

        <div className="glass-card p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por placa ou modelo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-11 h-12 text-base"
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v, i) => {
            const calc = calcularValor(v);
            return (
              <button
                key={v.id}
                onClick={() => { setSelected(v); setFinalizado(false); setShowPix(false); setShowReceipt(false); }}
                className={`glass-card-hover p-5 text-left w-full animate-in stagger-${Math.min(i + 1, 8)}`}
                style={{ opacity: 0 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/[0.08] flex items-center justify-center">
                    <span className="text-primary font-mono font-bold text-sm">{v.placa.slice(0, 3)}</span>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
                </div>
                <p className="font-mono text-xl font-bold text-foreground tracking-wide">{v.placa}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{v.modelo} • {v.cor}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{calc.hours}h {calc.mins}min</span>
                  </div>
                  <span className="text-lg font-display font-bold text-accent">R$ {calc.total}</span>
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <LogOut className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhum veículo encontrado</p>
            <p className="text-sm">Tente buscar por outra placa ou modelo</p>
          </div>
        )}
      </div>
    );
  }

  // Detail view
  const calc = calcularValor(selected);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => { setSelected(null); setShowPix(false); setShowReceipt(false); setFinalizado(false); }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar à lista
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-8 animate-in" style={{ opacity: 0 }}>
            <div className="flex items-center gap-5 mb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/[0.08] flex items-center justify-center">
                <span className="text-primary font-mono font-bold text-xl">{selected.placa.slice(0, 3)}</span>
              </div>
              <div>
                <p className="text-3xl font-mono font-bold text-foreground tracking-wider">{selected.placa}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{selected.modelo} • {selected.cor}</p>
              </div>
              <div className={`ml-auto px-4 py-2 rounded-xl text-xs font-semibold ${
                finalizado ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'
              }`}>
                {finalizado ? '✓ Finalizado' : '⏱ Em aberto'}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Entrada', value: new Date(selected.entrada).toLocaleString('pt-BR'), mono: true },
                { label: 'Saída', value: finalizado && selected.saida ? new Date(selected.saida).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR'), mono: true },
                { label: 'Permanência', value: finalizado ? selected.tempoTotal! : `${calc.hours}h ${calc.mins}min` },
                { label: 'Tipo', value: selected.tipoCliente === 'mensalista' ? 'Mensalista' : 'Avulso' },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-xl bg-secondary/40">
                  <p className="stat-label mb-1.5">{item.label}</p>
                  <p className={`text-sm font-semibold text-foreground ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-primary/[0.06] to-accent/[0.04] border border-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Valor Total</p>
                  <p className="text-sm text-muted-foreground mt-0.5">R$ {selected.valorHora}/hora × {Math.max(Math.ceil((Date.now() - new Date(selected.entrada).getTime()) / 3600000), 1)}h</p>
                </div>
                <p className="text-4xl font-display font-bold text-accent">
                  R$ {finalizado ? selected.valorTotal : calc.total}
                </p>
              </div>
            </div>

            {/* Payment Buttons */}
            {!finalizado && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button
                  onClick={() => handlePagamento('pix')}
                  className="h-16 text-base font-semibold gap-3 rounded-xl bg-primary hover:bg-primary/90"
                >
                  <QrCode className="h-6 w-6" /> Pagar com PIX
                </Button>
                <Button
                  onClick={() => handlePagamento('dinheiro')}
                  variant="secondary"
                  className="h-16 text-base font-semibold gap-3 rounded-xl border border-border hover:border-accent/30"
                >
                  <Banknote className="h-6 w-6" /> Dinheiro
                </Button>
              </div>
            )}

            {finalizado && (
              <div className="flex gap-3 mt-6">
                <Button onClick={() => setShowReceipt(!showReceipt)} variant="outline" className="flex-1 h-12 gap-2 rounded-xl">
                  <Printer className="h-4 w-4" /> {showReceipt ? 'Ocultar' : 'Ver'} Comprovante
                </Button>
                <Button variant="secondary" className="h-12 gap-2 rounded-xl">
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — QR / Receipt */}
        <div className="lg:col-span-2 space-y-6">
          {/* QR Code PIX */}
          {finalizado && showPix && (
            <div className="glass-card p-8 text-center animate-in stagger-1" style={{ opacity: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium mb-6">
                <QrCode className="h-3.5 w-3.5" /> PIX
              </div>
              <div className="bg-foreground p-5 rounded-2xl inline-block mx-auto">
                <QRCodeSVG value={pixCode} size={200} level="H" />
              </div>
              <p className="text-xs text-muted-foreground mt-5 mb-3">Escaneie com o app do banco</p>
              <button
                onClick={() => { navigator.clipboard.writeText(pixCode); toast({ title: "Código copiado!" }); }}
                className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs text-muted-foreground transition-colors"
              >
                <Copy className="h-3 w-3" /> Copiar código PIX
              </button>
            </div>
          )}

          {/* Thermal Receipt Preview */}
          {finalizado && showReceipt && (
            <div className="animate-in stagger-2" style={{ opacity: 0 }}>
              <div className="receipt-paper w-full max-w-[300px] mx-auto text-xs leading-relaxed">
                <div className="p-5 space-y-3">
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold">ME PARK ESTACIONAMENTO</p>
                    <p className="text-[10px]">Rua Principal, 100 - Centro</p>
                    <p className="text-[10px]">CNPJ: 12.345.678/0001-00</p>
                    <div className="border-b border-dashed border-gray-400 my-3" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span>Placa:</span><span className="font-bold">{selected.placa}</span></div>
                    <div className="flex justify-between"><span>Veículo:</span><span>{selected.modelo}</span></div>
                    <div className="flex justify-between"><span>Cor:</span><span>{selected.cor}</span></div>
                    <div className="border-b border-dashed border-gray-400 my-3" />
                    <div className="flex justify-between"><span>Entrada:</span><span>{new Date(selected.entrada).toLocaleString('pt-BR')}</span></div>
                    <div className="flex justify-between"><span>Saída:</span><span>{selected.saida ? new Date(selected.saida).toLocaleString('pt-BR') : '—'}</span></div>
                    <div className="flex justify-between"><span>Tempo:</span><span className="font-bold">{selected.tempoTotal}</span></div>
                    <div className="border-b border-dashed border-gray-400 my-3" />
                    <div className="flex justify-between"><span>Valor/hora:</span><span>R$ {selected.valorHora},00</span></div>
                    <div className="flex justify-between text-sm font-bold"><span>TOTAL:</span><span>R$ {selected.valorTotal},00</span></div>
                    <div className="flex justify-between"><span>Pagamento:</span><span className="font-bold uppercase">{selected.formaPagamento}</span></div>
                  </div>

                  {selected.formaPagamento === 'pix' && (
                    <div className="text-center pt-2">
                      <div className="border-b border-dashed border-gray-400 mb-3" />
                      <p className="text-[10px] mb-2">Escaneie para pagar via PIX:</p>
                      <div className="flex justify-center">
                        <QRCodeSVG value={pixCode} size={120} level="M" />
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-3">
                    <div className="border-b border-dashed border-gray-400 mb-3" />
                    <p className="text-[10px]">Obrigado pela preferência!</p>
                    <p className="text-[10px] text-gray-500">ME PARK Centro</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment done feedback */}
          {finalizado && !showPix && (
            <div className="glass-card p-8 text-center animate-in stagger-1" style={{ opacity: 0 }}>
              <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-accent" />
              </div>
              <p className="text-lg font-semibold text-foreground">Pagamento em Dinheiro</p>
              <p className="text-sm text-muted-foreground mt-1">Registrado com sucesso</p>
              <div className="mt-4 p-4 rounded-xl bg-secondary/40">
                <p className="stat-label">Valor recebido</p>
                <p className="text-2xl font-display font-bold text-accent mt-1">R$ {selected.valorTotal}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
