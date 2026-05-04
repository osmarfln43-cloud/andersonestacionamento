import { Printer, Search, Eye, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConfiguracoes } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import ReceiptPDF, { type ReceiptData } from "@/components/ReceiptPDF";
import { QRCodeSVG } from "qrcode.react";
import { calculateParkingBilling } from "@/lib/billing";
import { formatBillingRuleLabel } from "@/lib/receipt";

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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [viewMov, setViewMov] = useState<any>(null);

  const getBillingDetails = (mov: any) => {
    if (!mov?.saida) return null;

    const valorDiaria = mov.categoria === 'moto'
      ? Number((config as any)?.valor_maximo_diario_moto ?? 15)
      : Number((config as any)?.valor_maximo_diario ?? 35);

    const billing = calculateParkingBilling({
      entrada: mov.entrada,
      valorHora: Number(mov.valor_hora || 10),
      valorDiaria,
      toleranciaMinutos: Number((config as any)?.tolerancia_minutos ?? 15),
      now: new Date(mov.saida),
    });

    return {
      billing,
      label: formatBillingRuleLabel(billing.regraAplicada),
    };
  };

  const handleDelete = async (id: string, placa: string) => {
    if (!confirm(`Excluir comprovante de ${placa}?`)) return;
    const { error } = await supabase.from('movimentacoes').delete().eq('id', id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    if (viewMov?.id === id) setViewMov(null);
    queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
    toast({ title: "✓ Comprovante excluído" });
  };

  const filtered = busca
    ? movimentacoes.filter(m => m.placa.includes(busca.toUpperCase()))
    : movimentacoes;

  const buildReceipt = (m: any): ReceiptData => {
    const billingDetails = getBillingDetails(m);

    return {
      placa: m.placa,
      modelo: m.modelo || "N/I",
      cor: m.cor || "",
      tipo_cliente: m.tipo_cliente,
      entrada: m.entrada,
      saida: m.saida || undefined,
      tempoTotal: billingDetails?.label || m.tempo_total || undefined,
      valorTotal: m.valor_total ?? undefined,
      formaPagamento: m.forma_pagamento || undefined,
      valorHora: m.valor_hora,
      nomeEstacionamento: config?.nome_estacionamento || 'ANDERSON ESTACIONAMENTOS',
      endereco: config?.endereco || 'RUA ESTEVE JUNIOR - CENTRO',
      telefone: config?.telefone || undefined,
      chavePix: config?.chave_pix || undefined,
      nomeBeneficiario: config?.nome_beneficiario || undefined,
      mensagemComprovante: config?.mensagem_comprovante || 'ANDERSON ESTACIONAMENTOS AGRADECE A PREFERÊNCIA',
      tipo: m.saida ? "saida" : "entrada",
      horarioAbertura: (config as any)?.horario_abertura || '07:00',
      horarioFechamento: (config as any)?.horario_fechamento || '19:00',
      diasFuncionamento: (config as any)?.dias_funcionamento || 'Segunda a Sexta',
      disclaimerComprovante: (config as any)?.disclaimer_comprovante || 'NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO',
      qrCodeUrl: (config as any)?.qr_code_url || undefined,
      cnpj: config?.cnpj || undefined,
      regraAplicada: billingDetails?.billing.regraAplicada || undefined,
    };
  };

  const pixCode = config?.chave_pix
    ? `00020126580014br.gov.bcb.pix0136${config.chave_pix}5204000053039865802BR5925ANDERSON ESTACIONAMENTOS6008SAOPAULO`
    : "";

  const viewBillingDetails = viewMov?.saida ? getBillingDetails(viewMov) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Printer className="h-5 w-5 text-primary" />
          </div>
          Comprovantes
        </h1>
        <p className="text-sm text-muted-foreground mt-2">2ª via, históricos e visualização de comprovantes</p>
      </div>

      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base border-0 bg-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
                    <td className="p-4 flex gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewMov(m); }} className="gap-1.5 rounded-xl h-9 px-3">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(m.id, m.placa); }} className="gap-1.5 rounded-xl h-9 px-3 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2">
          {viewMov ? (
            <div className="sticky top-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="section-title">Visualização</span>
                <button onClick={() => setViewMov(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-[#f5f0e8] text-[#1a1a1a] rounded-xl shadow-xl overflow-hidden max-w-[320px] mx-auto" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                <div className="p-6 space-y-3 text-xs leading-relaxed">
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold tracking-wide">{config?.nome_estacionamento || 'ANDERSON ESTACIONAMENTOS'}</p>
                    <div className="border-b border-dashed border-gray-400 my-3" />
                    <p className="text-[10px] leading-snug">{(config as any)?.disclaimer_comprovante || 'NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO'}. HORARIO DE FUNCIONAMENTO {((config as any)?.dias_funcionamento || 'SEGUNDA A SEXTA').toUpperCase()} DAS {(config as any)?.horario_abertura || '07:00'} ATE AS {(config as any)?.horario_fechamento || '19:00'}</p>
                    <div className="border-b border-dashed border-gray-400 my-3" />
                  </div>

                  <div className="text-center py-2">
                    <p className="text-2xl font-bold tracking-widest">{viewMov.placa}</p>
                    <p className="text-xs font-bold mt-1">({(viewMov.modelo || 'N/I').toUpperCase()} {(viewMov.cor || '').toUpperCase()})</p>
                  </div>
                  {viewMov.foto_url && (
                    <div className="flex justify-center py-2">
                      <img src={viewMov.foto_url} alt={`Foto ${viewMov.placa}`} className="w-full max-w-[200px] h-auto rounded-lg border border-gray-300" />
                    </div>
                  )}
                  <div className="border-b border-dashed border-gray-400" />

                  <div className="space-y-1.5 py-1">
                    <div className="flex justify-between"><span>Entrada:</span><span>{new Date(viewMov.entrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })}</span></div>
                    {viewMov.saida && <div className="flex justify-between"><span>Saida:</span><span>{new Date(viewMov.saida).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })}</span></div>}
                    {(viewBillingDetails?.label || viewMov.tempo_total) && <div className="flex justify-between"><span>Permanencia:</span><span>{viewBillingDetails?.label || viewMov.tempo_total}</span></div>}
                    <div className="flex justify-between"><span>Tabela:</span><span>{viewMov.tipo_cliente === 'mensalista' ? 'Mensalista' : 'Avulso'}</span></div>
                    {viewBillingDetails?.label && <div className="flex justify-between"><span>Cobranca:</span><span>{viewBillingDetails.label}</span></div>}
                    {viewMov.forma_pagamento && <div className="flex justify-between font-bold"><span>Pagamento:</span><span>{viewMov.forma_pagamento.toUpperCase()}</span></div>}
                    <div className="flex justify-between"><span>Valor/hora:</span><span>R$ {Number(viewMov.valor_hora || 10).toFixed(2)}</span></div>
                  </div>
                  <div className="border-b border-dashed border-gray-400" />

                  {viewMov.valor_total != null && (
                    <>
                      <div className="text-center py-2">
                        <p className="text-sm font-bold">Total</p>
                        <p className="text-xl font-bold">R$ {Number(viewMov.valor_total).toFixed(2)}</p>
                      </div>
                      <div className="border-b border-dashed border-gray-400" />
                    </>
                  )}

                  {!viewMov.saida && (
                    <>
                      <div className="text-center py-1">
                        <p className="text-sm font-bold tracking-wide">PAGAMENTO DINHEIRO OU PIX</p>
                      </div>
                      {(config as any)?.qr_code_url ? (
                        <div className="flex justify-center py-3">
                          <img src={(config as any).qr_code_url} alt="QR Code" className="w-[120px] h-[120px] object-contain" />
                        </div>
                      ) : pixCode ? (
                        <div className="flex justify-center py-3">
                          <QRCodeSVG value={pixCode} size={120} level="M" />
                        </div>
                      ) : null}
                      <div className="text-center py-1">
                        <p className="text-sm font-bold tracking-wide">PAGAMENTO DINHEIRO OU PIX</p>
                      </div>
                      <div className="border-b border-dashed border-gray-400" />
                    </>
                  )}

                  <div className="text-center space-y-1 pt-1">
                    <p className="font-bold text-[10px]">{config?.mensagem_comprovante || 'ANDERSON ESTACIONAMENTOS AGRADECE A PREFERENCIA'}</p>
                    {config?.endereco && <p className="text-[10px]">{config.endereco.toUpperCase()}</p>}
                    {config?.telefone && <p className="text-[10px]">MEU CONTATO: {config.telefone}</p>}
                  </div>
                </div>
              </div>

              <Button onClick={() => setReceiptData(buildReceipt(viewMov))} className="w-full h-12 gap-2 rounded-xl">
                <Printer className="h-4 w-4" /> Imprimir Comprovante <span className="text-[10px] font-normal opacity-70">2ª via</span>
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
