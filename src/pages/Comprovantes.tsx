import { Printer, Search, Eye, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useConfiguracoes } from "@/hooks/useDatabase";
import ReceiptPDF, { type ReceiptData } from "@/components/ReceiptPDF";
import { QRCodeSVG } from "qrcode.react";

function useTodasMovimentacoes() {
  return useQuery({
    queryKey: ['movimentacoes', 'todas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .order('entrada', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
}

export default function Comprovantes() {
  const { data: movimentacoes = [] } = useTodasMovimentacoes();
  const { data: config } = useConfiguracoes();
  const [busca, setBusca] = useState("");
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [viewMov, setViewMov] = useState<any>(null);

  const filtered = busca
    ? movimentacoes.filter(m => m.placa.includes(busca.toUpperCase()))
    : movimentacoes;

  const buildReceipt = (m: any): ReceiptData => ({
    placa: m.placa,
    modelo: m.modelo || "N/I",
    cor: m.cor || "",
    tipo_cliente: m.tipo_cliente,
    entrada: m.entrada,
    saida: m.saida || undefined,
    tempoTotal: m.tempo_total || undefined,
    valorTotal: m.valor_total ?? undefined,
    formaPagamento: m.forma_pagamento || undefined,
    valorHora: m.valor_hora,
    nomeEstacionamento: config?.nome_estacionamento,
    endereco: config?.endereco,
    telefone: config?.telefone,
    chavePix: config?.chave_pix,
    nomeBeneficiario: config?.nome_beneficiario,
    mensagemComprovante: config?.mensagem_comprovante,
    tipo: m.saida ? "saida" : "entrada",
  });

  const pixCode = config?.chave_pix
    ? `00020126580014br.gov.bcb.pix0136${config.chave_pix}5204000053039865802BR5913ME PARK AI6008SAOPAULO`
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Printer className="h-5 w-5 text-primary" />
          </div>
          Comprovantes
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Histórico e visualização de comprovantes</p>
      </div>

      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base border-0 bg-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left - Table */}
        <div className="lg:col-span-3 glass-card overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h3 className="section-title">Comprovantes ({filtered.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 stat-label">Placa</th>
                  <th className="text-left p-4 stat-label hidden md:table-cell">Veículo</th>
                  <th className="text-left p-4 stat-label">Data</th>
                  <th className="text-left p-4 stat-label">Pagamento</th>
                  <th className="text-left p-4 stat-label">Valor</th>
                  <th className="text-left p-4 stat-label">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Nenhum comprovante</td></tr>
                ) : filtered.map((m) => (
                  <tr key={m.id} className={`border-b border-border/30 hover:bg-secondary/20 transition-colors cursor-pointer ${viewMov?.id === m.id ? 'bg-primary/[0.04]' : ''}`} onClick={() => setViewMov(m)}>
                    <td className="p-4 font-mono font-bold text-foreground tracking-wide">{m.placa}</td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{m.modelo}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{new Date(m.entrada).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 text-xs font-semibold uppercase text-foreground">{m.forma_pagamento || (m.status_movimentacao === 'ativo' ? 'Em aberto' : '—')}</td>
                    <td className="p-4 font-display font-bold text-accent">{m.status_movimentacao === 'ativo' ? '—' : `R$ ${Number(m.valor_total || 0).toFixed(2)}`}</td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewMov(m); }} className="gap-1.5 rounded-xl h-9 px-3">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right - Receipt Preview */}
        <div className="lg:col-span-2">
          {viewMov ? (
            <div className="sticky top-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="section-title">Visualização</span>
                <button onClick={() => setViewMov(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Thermal receipt visual */}
              <div className="bg-[#f5f0e8] text-[#1a1a1a] rounded-xl shadow-xl overflow-hidden max-w-[320px] mx-auto" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                <div className="p-6 space-y-3 text-xs leading-relaxed">
                  {/* Header */}
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold tracking-wide">{config?.nome_estacionamento || 'ME PARK ESTACIONAMENTO'}</p>
                    <div className="border-b border-dashed border-gray-400 my-3" />
                    <p className="text-[10px] leading-snug">NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS. HORARIO DE FUNCIONAMENTO DE SEGUNDA A SEXTA DAS 08:00 ATE AS 20:00</p>
                    <div className="border-b border-dashed border-gray-400 my-3" />
                  </div>

                  {/* Plate */}
                  <div className="text-center py-2">
                    <p className="text-2xl font-bold tracking-widest">{viewMov.placa}</p>
                    <p className="text-xs font-bold mt-1">({(viewMov.modelo || 'N/I').toUpperCase()} {(viewMov.cor || '').toUpperCase()})</p>
                  </div>
                  <div className="border-b border-dashed border-gray-400" />

                  {/* Details */}
                  <div className="space-y-1.5 py-1">
                    <div className="flex justify-between"><span>Entrada:</span><span>{new Date(viewMov.entrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })}</span></div>
                    {viewMov.saida && <div className="flex justify-between"><span>Saida:</span><span>{new Date(viewMov.saida).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })}</span></div>}
                    {viewMov.tempo_total && <div className="flex justify-between"><span>Permanencia:</span><span>{viewMov.tempo_total}</span></div>}
                    <div className="flex justify-between"><span>Tabela:</span><span>{viewMov.tipo_cliente === 'mensalista' ? 'Mensalista' : 'Avulso'}</span></div>
                    {viewMov.forma_pagamento && <div className="flex justify-between font-bold"><span>Pagamento:</span><span>{viewMov.forma_pagamento.toUpperCase()}</span></div>}
                    <div className="flex justify-between"><span>Valor/hora:</span><span>R$ {Number(viewMov.valor_hora || 10).toFixed(2)}</span></div>
                  </div>
                  <div className="border-b border-dashed border-gray-400" />

                  {/* Total */}
                  {viewMov.valor_total != null && (
                    <>
                      <div className="text-center py-2">
                        <p className="text-sm font-bold">Total</p>
                        <p className="text-xl font-bold">R$ {Number(viewMov.valor_total).toFixed(2)}</p>
                      </div>
                      <div className="border-b border-dashed border-gray-400" />
                    </>
                  )}

                  {/* QR Code */}
                  {pixCode && (
                    <>
                      <div className="flex justify-center py-3">
                        <QRCodeSVG value={pixCode} size={120} level="M" />
                      </div>
                      <div className="border-b border-dashed border-gray-400" />
                    </>
                  )}

                  {/* Footer */}
                  <div className="text-center space-y-1 pt-1">
                    <p className="font-bold text-[10px]">{config?.mensagem_comprovante || 'ME PARK AGRADECE A PREFERENCIA'}</p>
                    {config?.endereco && <p className="text-[10px]">{config.endereco.toUpperCase()}</p>}
                    {config?.telefone && <p className="text-[10px]">TEL: {config.telefone}</p>}
                  </div>
                </div>
              </div>

              {/* Print button */}
              <Button onClick={() => setReceiptData(buildReceipt(viewMov))} className="w-full h-12 gap-2 rounded-xl">
                <Printer className="h-4 w-4" /> Imprimir Comprovante
              </Button>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Selecione um comprovante para visualizar</p>
            </div>
          )}
        </div>
      </div>

      <ReceiptPDF data={receiptData} onDone={() => setReceiptData(null)} />
    </div>
  );
}
