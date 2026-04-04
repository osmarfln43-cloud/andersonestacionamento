import { Printer, Search, FileText, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useConfiguracoes } from "@/hooks/useDatabase";
import ReceiptPDF, { type ReceiptData } from "@/components/ReceiptPDF";

function useTodasMovimentacoes() {
  return useQuery({
    queryKey: ['movimentacoes', 'todas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .eq('status_movimentacao', 'finalizado')
        .order('saida', { ascending: false });
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

  const filtered = busca
    ? movimentacoes.filter(m => m.placa.includes(busca.toUpperCase()))
    : movimentacoes;

  const handleView = (m: any) => {
    setReceiptData({
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Printer className="h-5 w-5 text-primary" />
          </div>
          Comprovantes
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Histórico e reimpressão de comprovantes</p>
      </div>

      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base border-0 bg-transparent" />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h3 className="section-title">Todos os Comprovantes ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 stat-label">Placa</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Veículo</th>
                <th className="text-left p-4 stat-label">Entrada</th>
                <th className="text-left p-4 stat-label">Saída</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Tempo</th>
                <th className="text-left p-4 stat-label">Pagamento</th>
                <th className="text-left p-4 stat-label">Valor</th>
                <th className="text-left p-4 stat-label">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">Nenhum comprovante encontrado</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground tracking-wide">{m.placa}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{m.modelo} {m.cor ? `• ${m.cor}` : ''}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{new Date(m.entrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{m.saida ? new Date(m.saida).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                  <td className="p-4 text-xs text-muted-foreground hidden md:table-cell">{m.tempo_total || '—'}</td>
                  <td className="p-4 text-xs font-semibold uppercase text-foreground">{m.forma_pagamento || '—'}</td>
                  <td className="p-4 font-display font-bold text-accent">R$ {Number(m.valor_total || 0).toFixed(2)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleView(m)} className="gap-1.5 rounded-xl h-9 px-3">
                        <Eye className="h-4 w-4" /> Ver
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleView(m)} className="gap-1.5 rounded-xl h-9 px-3">
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiptPDF data={receiptData} onDone={() => setReceiptData(null)} />
    </div>
  );
}
