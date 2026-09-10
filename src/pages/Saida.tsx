import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { LogOut, Search, QrCode, Banknote, Clock, ArrowLeft, Check, Copy, Car, Trash2, Printer, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMovimentacoesAtivas, useMovimentacoesFinalizadasHoje, useRegistrarSaida, useConfiguracoes, useExcluirMovimentacao, buscarMovimentacaoPorTicket } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { calculateParkingBilling } from "@/lib/billing";
import { formatBillingRuleLabel } from "@/lib/receipt";
import ReceiptPDF, { ReceiptData } from "@/components/ReceiptPDF";
import BarcodeScanner from "@/components/BarcodeScanner";

type MovData = {
  id: string; placa: string; modelo: string | null; cor: string | null;
  entrada: string; saida: string | null; tempo_total: string | null;
  valor_hora: number; valor_total: number | null; forma_pagamento: string | null;
  tipo_cliente: string; status_movimentacao: string; foto_url?: string | null; categoria?: string | null;
  ticket_codigo?: string | null;
};

export default function Saida() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPix, setShowPix] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [finalizadoData, setFinalizadoData] = useState<MovData | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [ticketMov, setTicketMov] = useState<MovData | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [receiptKey, setReceiptKey] = useState(0);
  const { data: veiculosAtivos = [] } = useMovimentacoesAtivas();
  const { data: finalizadosHoje = [] } = useMovimentacoesFinalizadasHoje();
  const { data: config } = useConfiguracoes();
  const registrarSaida = useRegistrarSaida();
  const excluirMovimentacao = useExcluirMovimentacao();
  const { toast } = useToast();

  // Auto-select vehicle from query param
  useEffect(() => {
    const placaParam = searchParams.get('placa');
    if (placaParam && veiculosAtivos.length > 0) {
      const found = veiculosAtivos.find(v => v.placa === placaParam.toUpperCase());
      if (found) {
        setSelectedId(found.id);
        setBusca(placaParam.toUpperCase());
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, veiculosAtivos]);

  const filteredAtivos = busca.length > 0
    ? veiculosAtivos.filter(v => v.placa.includes(busca.toUpperCase()) || (v.modelo || '').toLowerCase().includes(busca.toLowerCase()))
    : veiculosAtivos;
  const filteredFinalizados = busca.length > 0
    ? finalizadosHoje.filter(v => v.placa.includes(busca.toUpperCase()) || (v.modelo || '').toLowerCase().includes(busca.toLowerCase()))
    : finalizadosHoje;

  const selected = selectedId
    ? veiculosAtivos.find(v => v.id === selectedId) || finalizadoData || ticketMov
    : null;

  const handleTicketCode = useCallback(async (codigo: string) => {
    try {
      const mov = await buscarMovimentacaoPorTicket(codigo);
      if (!mov) {
        toast({ title: "Ticket não encontrado", description: `Código ${codigo}`, variant: "destructive" });
        return;
      }
      setScannerOpen(false);
      if (mov.status_movimentacao === 'finalizado') {
        toast({ title: "Ticket já finalizado", description: `${mov.placa} — saída em ${mov.saida ? new Date(mov.saida).toLocaleString('pt-BR') : ''}`, variant: "destructive" });
        setBusca(mov.placa);
        return;
      }
      setTicketMov(mov as any);
      setFinalizado(false);
      setShowPix(false);
      setFinalizadoData(null);
      setSelectedId(mov.id);
      toast({ title: "🎫 Ticket lido", description: `${mov.placa} — ${mov.modelo || 'N/I'}` });
    } catch (err: any) {
      toast({ title: "Erro ao ler ticket", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  const calcularValor = (mov: any) => {
    const valorDiaria = mov?.categoria === 'moto'
      ? Number(config?.valor_maximo_diario_moto ?? 15)
      : Number(config?.valor_maximo_diario ?? 35);

    return calculateParkingBilling({
      entrada: mov.entrada,
      valorHora: Number(mov.valor_hora),
      valorDiaria,
      toleranciaMinutos: Number(config?.tolerancia_minutos ?? 15),
    });
  };

  const handlePagamento = (tipo: 'pix' | 'dinheiro') => {
    if (!selectedId || !selected) return;
    const billing = calcularValor(selected);
    registrarSaida.mutate(
      { id: selectedId, forma_pagamento: tipo },
      {
        onSuccess: (data) => {
          setFinalizadoData(data as any);
          setFinalizado(true);
          if (tipo === 'pix') setShowPix(true);
          toast({ title: "✓ Saída registrada", description: `${(selected as any)?.placa} — ${tipo.toUpperCase()}` });
          // Build receipt for print
          const saida = (data as any)?.saida || new Date().toISOString();
          setReceiptData({
            placa: (selected as any).placa,
            modelo: (selected as any).modelo || 'N/I',
            cor: (selected as any).cor || '',
            tipo_cliente: (selected as any).tipo_cliente,
            entrada: (selected as any).entrada,
            saida,
            tempoTotal: formatBillingRuleLabel(billing.regraAplicada) || (data as any)?.tempo_total || `${billing.hours}h ${billing.mins}min`,
            valorTotal: Number((data as any)?.valor_total ?? billing.total),
            formaPagamento: tipo.toUpperCase(),
            nomeEstacionamento: config?.nome_estacionamento,
            endereco: config?.endereco || undefined,
            telefone: config?.telefone || undefined,
            chavePix: config?.chave_pix || undefined,
            tipoChavePix: config?.tipo_chave_pix || undefined,
            nomeBeneficiario: config?.nome_beneficiario || undefined,
            mensagemComprovante: config?.mensagem_comprovante || undefined,
            valorHora: Number((selected as any).valor_hora),
            tipo: 'saida',
            horarioAbertura: config?.horario_abertura || undefined,
            horarioFechamento: config?.horario_fechamento || undefined,
            diasFuncionamento: config?.dias_funcionamento || undefined,
            disclaimerComprovante: config?.disclaimer_comprovante || undefined,
            qrCodeUrl: config?.qr_code_url || undefined,
            cnpj: config?.cnpj || undefined,
            regraAplicada: billing.regraAplicada,
          });
          setReceiptKey(k => k + 1);
        },
        onError: (err: any) => {
          toast({ title: "Erro", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const valorPix = finalizado && finalizadoData?.valor_total != null
    ? Number(finalizadoData.valor_total)
    : selected
      ? calcularValor(selected).total
      : 0;

  const pixCode = `00020126580014br.gov.bcb.pix0136${config?.chave_pix || 'anderson@estacionamento.com.br'}5204000053039865404${valorPix.toFixed(2)}5802BR5925ANDERSON ESTACIONAMENTOS6008SAOPAULO`;
  const [horaAtual, setHoraAtual] = useState(() => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [dataAtual] = useState(() => new Date().toLocaleDateString('pt-BR'));

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detail view
  if (selected) {
    const calc = calcularValor(selected);
    const displayData = finalizadoData || selected;

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => { setSelectedId(null); setShowPix(false); setFinalizado(false); setFinalizadoData(null); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        {/* Header with clock */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <LogOut className="h-5 w-5 text-warning" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight leading-tight font-display">Saída de Veículo</h1>
          </div>
          <div className="glass-card w-full shrink-0 px-3 py-2 text-center sm:w-auto sm:px-4 sm:text-right">
            <p className="text-base sm:text-lg md:text-xl font-mono font-bold text-primary tabular-nums whitespace-nowrap">{horaAtual}</p>
            <p className="text-[10px] text-muted-foreground whitespace-nowrap">{dataAtual}</p>
          </div>
        </div>

        {/* Vehicle info row */}
        <div className="glass-card p-4 md:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Placa</Label>
              <div className="h-11 rounded-lg bg-secondary/50 flex items-center justify-center">
                <span className="font-mono font-bold text-lg tracking-wider">{(displayData as any).placa}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Entrada</Label>
              <div className="h-11 rounded-lg bg-secondary/50 flex items-center px-3">
                <span className="text-xs font-mono">{new Date((displayData as any).entrada).toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Veículo</Label>
              <div className="h-11 rounded-lg bg-secondary/50 flex items-center px-3">
                <span className="text-xs">{(displayData as any).modelo || 'N/I'} {(displayData as any).cor ? `• ${(displayData as any).cor}` : ''}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Tipo</Label>
              <div className="h-11 rounded-lg bg-secondary/50 flex items-center px-3">
                <span className="text-xs font-medium">
                  {(displayData as any).categoria === 'moto' ? '🏍️ Moto' : '🚗 Carro'}
                  {' • '}
                  {(displayData as any).tipo_cliente === 'mensalista' ? '📋 Mensalista' : '🅿️ Avulso'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timing & Value */}
        <div className="glass-card p-4 md:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Saída</Label>
              <div className="h-11 rounded-lg bg-secondary/50 flex items-center px-3">
                <span className="text-xs font-mono">{finalizado && (displayData as any).saida ? new Date((displayData as any).saida).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Permanência</Label>
              <div className="h-11 rounded-lg bg-secondary/50 flex items-center px-3">
                <span className="text-sm font-semibold">{finalizado ? (displayData as any).tempo_total : `${calc.hours}h ${calc.mins}min`}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Valor/Hora</Label>
              <div className="h-11 rounded-lg bg-secondary/50 flex items-center px-3">
                <span className="text-sm font-mono">R$ {Number((displayData as any).valor_hora)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px] text-accent">Valor Total</Label>
              <div className="h-11 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <span className="text-lg font-display font-bold text-accent">R$ {finalizado ? Number((displayData as any).valor_total) : calc.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment buttons or result */}
        {!finalizado ? (
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => handlePagamento('pix')} className="h-14 text-sm font-semibold gap-3 rounded-xl" disabled={registrarSaida.isPending}>
              <QrCode className="h-5 w-5" /> Pagar PIX
            </Button>
            <Button onClick={() => handlePagamento('dinheiro')} variant="secondary" className="h-14 text-sm font-semibold gap-3 rounded-xl border border-border" disabled={registrarSaida.isPending}>
              <Banknote className="h-5 w-5" /> Pagar Dinheiro
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="glass-card p-5">
              <div className="text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                  <Check className="h-7 w-7 text-accent" />
                </div>
                <p className="text-lg font-semibold">Saída Registrada</p>
                <div className="grid grid-cols-2 gap-3 text-sm max-w-sm mx-auto">
                  <div className="text-left text-muted-foreground">Permanência:</div>
                  <div className="text-right font-semibold">{(displayData as any).tempo_total || `${calc.hours}h ${calc.mins}min`}</div>
                  <div className="text-left text-muted-foreground">Regra aplicada:</div>
                  <div className="text-right font-semibold text-primary">{calc.regraAplicada}</div>
                  <div className="text-left text-muted-foreground">Pagamento:</div>
                  <div className="text-right font-semibold uppercase">{(displayData as any).forma_pagamento || ''}</div>
                  <div className="text-left text-muted-foreground">Valor Total:</div>
                  <div className="text-right text-xl font-display font-bold text-accent">R$ {Number((displayData as any).valor_total ?? calc.total).toFixed(2)}</div>
                </div>
              </div>

              {showPix && (
                <div className="text-center space-y-3 mt-4 pt-4 border-t border-border/50">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                    <QrCode className="h-3.5 w-3.5" /> QR Code PIX
                  </div>
                  <div className="bg-foreground p-4 rounded-2xl inline-block mx-auto">
                    <QRCodeSVG value={pixCode} size={180} level="H" />
                  </div>
                  <p className="text-xs text-muted-foreground">Escaneie com o app do banco</p>
                  <button onClick={() => { navigator.clipboard.writeText(pixCode); toast({ title: "Código copiado!" }); }}
                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs text-muted-foreground transition-colors">
                    <Copy className="h-3 w-3" /> Copiar código PIX
                  </button>
                </div>
              )}
            </div>

            <Button
              onClick={() => setReceiptKey(k => k + 1)}
              className="w-full h-12 text-sm font-semibold gap-2 rounded-xl"
              variant="secondary"
            >
              <Printer className="h-5 w-5" /> Reimprimir Comprovante
            </Button>
          </div>
        )}

        {/* Hidden receipt for printing */}
        <ReceiptPDF key={receiptKey} data={receiptData} onDone={() => {}} />
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <LogOut className="h-5 w-5 text-warning" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight leading-tight font-display">Saída / Fechamento</h1>
            <p className="text-[11px] text-muted-foreground">Registre saídas de veículos e motos</p>
          </div>
        </div>
        <div className="glass-card w-full shrink-0 px-3 py-2 text-center sm:w-auto sm:px-4 sm:text-right">
          <p className="text-base sm:text-lg md:text-xl font-mono font-bold text-primary tabular-nums whitespace-nowrap">{horaAtual}</p>
          <p className="text-[10px] text-muted-foreground whitespace-nowrap">{dataAtual}</p>
        </div>
      </div>

      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa ou modelo..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10 h-11 text-sm" autoFocus />
        </div>
      </div>

      <Tabs defaultValue="ativos" className="space-y-4">
        <TabsList className="bg-secondary/50 border border-border/50 p-1 h-auto">
          <TabsTrigger value="ativos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-4 text-xs">
            ⏱ No Pátio ({filteredAtivos.length})
          </TabsTrigger>
          <TabsTrigger value="finalizados" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground py-2 px-4 text-xs">
            ✓ Saída Hoje ({filteredFinalizados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativos">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredAtivos.map((v, i) => {
              const calc = calcularValor(v);
              return (
                <button key={v.id}
                  onClick={() => { setSelectedId(v.id); setFinalizado(false); setShowPix(false); setFinalizadoData(null); }}
                  className={`glass-card-hover p-4 text-left w-full animate-in stagger-${Math.min(i + 1, 8)}`} style={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono text-lg font-bold tracking-wide">{v.placa}</p>
                    <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                  </div>
                  <p className="text-xs text-muted-foreground">{v.modelo} {v.cor ? `• ${v.cor}` : ''}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /><span>{calc.hours}h {calc.mins}min</span>
                    </div>
                    <span className="text-base font-display font-bold text-accent">R$ {calc.total}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 text-center mt-2 italic">clique aqui para registrar a saída</p>
                </button>
              );
            })}
          </div>
          {filteredAtivos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Car className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhum veículo no pátio</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="finalizados">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredFinalizados.map((v: any, i) => (
              <div key={v.id} className={`glass-card p-4 animate-in stagger-${Math.min(i + 1, 8)}`} style={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-lg font-bold tracking-wide">{v.placa}</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-semibold uppercase">{v.forma_pagamento}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir saída?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja excluir o registro de saída do veículo <strong>{v.placa}</strong>? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                              excluirMovimentacao.mutate(v.id, {
                                onSuccess: () => toast({ title: "✓ Registro excluído", description: `${v.placa} removido` }),
                                onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
                              });
                            }}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{v.modelo} {v.cor ? `• ${v.cor}` : ''}</p>
                <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Permanência</span>
                    <span className="font-medium">{v.tempo_total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Valor</span>
                    <span className="text-base font-display font-bold text-accent">R$ {Number(v.valor_total || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredFinalizados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <LogOut className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhuma saída hoje</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
