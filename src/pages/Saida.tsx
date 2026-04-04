import { useState } from "react";
import { LogOut, Search, QrCode, Banknote, Printer, Clock, ArrowLeft, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMovimentacoesAtivas, useRegistrarSaida, useConfiguracoes } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import ReceiptPDF, { type ReceiptData } from "@/components/ReceiptPDF";

type MovData = {
  id: string;
  placa: string;
  modelo: string | null;
  cor: string | null;
  entrada: string;
  saida: string | null;
  tempo_total: string | null;
  valor_hora: number;
  valor_total: number | null;
  forma_pagamento: string | null;
  tipo_cliente: string;
  status_movimentacao: string;
};

export default function Saida() {
  const [busca, setBusca] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPix, setShowPix] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [finalizadoData, setFinalizadoData] = useState<MovData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const { data: veiculosAtivos = [] } = useMovimentacoesAtivas();
  const { data: config } = useConfiguracoes();
  const registrarSaida = useRegistrarSaida();
  const { toast } = useToast();

  const filtered = busca.length > 0
    ? veiculosAtivos.filter(v => v.placa.includes(busca.toUpperCase()) || (v.modelo || '').toLowerCase().includes(busca.toLowerCase()))
    : veiculosAtivos;

  const selected = selectedId ? veiculosAtivos.find(v => v.id === selectedId) || finalizadoData : null;

  const calcularValor = (mov: any) => {
    const diffMs = Date.now() - new Date(mov.entrada).getTime();
    const diffH = diffMs / 3600000;
    return { hours: Math.floor(diffH), mins: Math.round((diffH % 1) * 60), total: Math.max(Math.ceil(diffH), 1) * Number(mov.valor_hora) };
  };

  const triggerReceiptPDF = (data: MovData) => {
    setReceiptData({
      placa: data.placa,
      modelo: data.modelo || "N/I",
      cor: data.cor || "",
      tipo_cliente: data.tipo_cliente,
      entrada: data.entrada,
      saida: data.saida || undefined,
      tempoTotal: data.tempo_total || undefined,
      valorTotal: data.valor_total ?? undefined,
      formaPagamento: data.forma_pagamento || undefined,
      valorHora: data.valor_hora,
      nomeEstacionamento: config?.nome_estacionamento,
      endereco: config?.endereco,
      telefone: config?.telefone,
      chavePix: config?.chave_pix,
      tipoChavePix: config?.tipo_chave_pix,
      nomeBeneficiario: config?.nome_beneficiario,
      mensagemComprovante: config?.mensagem_comprovante,
      tipo: "saida",
    });
  };

  const handlePagamento = (tipo: 'pix' | 'dinheiro') => {
    if (!selectedId) return;
    registrarSaida.mutate(
      { id: selectedId, forma_pagamento: tipo },
      {
        onSuccess: (data) => {
          setFinalizadoData(data as any);
          setFinalizado(true);
          if (tipo === 'pix') setShowPix(true);
          toast({ title: "✓ Saída registrada", description: `${(selected as any)?.placa} — ${tipo.toUpperCase()}` });
          // Auto-generate PDF receipt
          triggerReceiptPDF(data as any);
        },
        onError: (err: any) => {
          toast({ title: "Erro", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const pixCode = `00020126580014br.gov.bcb.pix0136${config?.chave_pix || 'mepark@estacionamento.com.br'}5204000053039865404${selected ? calcularValor(selected).total.toFixed(2) : '0.00'}5802BR5913ME PARK AI6008SAOPAULO`;

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
            <Input placeholder="Buscar por placa ou modelo..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base" autoFocus />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v, i) => {
            const calc = calcularValor(v);
            return (
              <button
                key={v.id}
                onClick={() => { setSelectedId(v.id); setFinalizado(false); setShowPix(false); setShowReceipt(false); setFinalizadoData(null); }}
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
                    <Clock className="h-3 w-3" /><span>{calc.hours}h {calc.mins}min</span>
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
          </div>
        )}
      </div>
    );
  }

  const calc = calcularValor(selected);
  const displayData = finalizadoData || selected;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => { setSelectedId(null); setShowPix(false); setShowReceipt(false); setFinalizado(false); setFinalizadoData(null); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-8 animate-in" style={{ opacity: 0 }}>
            <div className="flex items-center gap-5 mb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/[0.08] flex items-center justify-center">
                <span className="text-primary font-mono font-bold text-xl">{(displayData as any).placa.slice(0, 3)}</span>
              </div>
              <div>
                <p className="text-3xl font-mono font-bold text-foreground tracking-wider">{(displayData as any).placa}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{(displayData as any).modelo} • {(displayData as any).cor}</p>
              </div>
              <div className={`ml-auto px-4 py-2 rounded-xl text-xs font-semibold ${finalizado ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'}`}>
                {finalizado ? '✓ Finalizado' : '⏱ Em aberto'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Entrada', value: new Date((displayData as any).entrada).toLocaleString('pt-BR'), mono: true },
                { label: 'Saída', value: finalizado && (displayData as any).saida ? new Date((displayData as any).saida).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR'), mono: true },
                { label: 'Permanência', value: finalizado ? (displayData as any).tempo_total : `${calc.hours}h ${calc.mins}min` },
                { label: 'Tipo', value: (displayData as any).tipo_cliente === 'mensalista' ? 'Mensalista' : 'Avulso' },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-xl bg-secondary/40">
                  <p className="stat-label mb-1.5">{item.label}</p>
                  <p className={`text-sm font-semibold text-foreground ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-primary/[0.06] to-accent/[0.04] border border-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Valor Total</p>
                  <p className="text-sm text-muted-foreground mt-0.5">R$ {Number((displayData as any).valor_hora)}/hora</p>
                </div>
                <p className="text-4xl font-display font-bold text-accent">
                  R$ {finalizado ? Number((displayData as any).valor_total) : calc.total}
                </p>
              </div>
            </div>

            {!finalizado && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button onClick={() => handlePagamento('pix')} className="h-16 text-base font-semibold gap-3 rounded-xl" disabled={registrarSaida.isPending}>
                  <QrCode className="h-6 w-6" /> PIX
                </Button>
                <Button onClick={() => handlePagamento('dinheiro')} variant="secondary" className="h-16 text-base font-semibold gap-3 rounded-xl border border-border" disabled={registrarSaida.isPending}>
                  <Banknote className="h-6 w-6" /> Dinheiro
                </Button>
              </div>
            )}

            {finalizado && (
              <div className="flex gap-3 mt-6">
                <Button onClick={() => triggerReceiptPDF(displayData as any)} variant="outline" className="flex-1 h-12 gap-2 rounded-xl">
                  <Printer className="h-4 w-4" /> Reimprimir Comprovante
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {finalizado && showPix && (
            <div className="glass-card p-8 text-center animate-in stagger-1" style={{ opacity: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium mb-6">
                <QrCode className="h-3.5 w-3.5" /> PIX
              </div>
              <div className="bg-foreground p-5 rounded-2xl inline-block mx-auto">
                <QRCodeSVG value={pixCode} size={200} level="H" />
              </div>
              <p className="text-xs text-muted-foreground mt-5 mb-3">Escaneie com o app do banco</p>
              <button onClick={() => { navigator.clipboard.writeText(pixCode); toast({ title: "Código copiado!" }); }} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs text-muted-foreground transition-colors">
                <Copy className="h-3 w-3" /> Copiar código PIX
              </button>
            </div>
          )}

          {finalizado && !showPix && (
            <div className="glass-card p-8 text-center animate-in stagger-1" style={{ opacity: 0 }}>
              <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-accent" />
              </div>
              <p className="text-lg font-semibold text-foreground">Pagamento em Dinheiro</p>
              <p className="text-sm text-muted-foreground mt-1">Registrado com sucesso</p>
              <div className="mt-4 p-4 rounded-xl bg-secondary/40">
                <p className="stat-label">Valor</p>
                <p className="text-2xl font-display font-bold text-accent mt-1">R$ {Number((displayData as any).valor_total)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ReceiptPDF data={receiptData} onDone={() => setReceiptData(null)} />
    </div>
  );
}
