import { FileText, Download, Filter, DollarSign, Car, Clock, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useConfiguracoes } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const tooltipStyle = {
  background: 'hsl(225, 22%, 9%)',
  border: '1px solid hsl(225, 15%, 16%)',
  borderRadius: 12,
  fontSize: 12,
  padding: '10px 14px',
  boxShadow: '0 8px 32px -8px hsl(0 0% 0% / 0.5)',
};

type Periodo = 'hoje' | 'semanal' | 'quinzenal' | 'mensal';

function getDateRange(periodo: Periodo) {
  const now = new Date();
  const ate = new Date(now);
  ate.setHours(23, 59, 59, 999);
  const de = new Date(now);
  de.setHours(0, 0, 0, 0);
  switch (periodo) {
    case 'hoje': break;
    case 'semanal': de.setDate(de.getDate() - 7); break;
    case 'quinzenal': de.setDate(de.getDate() - 15); break;
    case 'mensal': de.setDate(1); break;
  }
  return { de, ate };
}

function useMovimentacoesPeriodo(periodo: Periodo, customDe?: string, customAte?: string) {
  return useQuery({
    queryKey: ['movimentacoes', 'relatorio', periodo, customDe, customAte],
    queryFn: async () => {
      let deDate: string, ateDate: string;
      if (customDe && customAte) {
        deDate = new Date(customDe).toISOString();
        ateDate = new Date(customAte + 'T23:59:59').toISOString();
      } else {
        const range = getDateRange(periodo);
        deDate = range.de.toISOString();
        ateDate = range.ate.toISOString();
      }
      const { data, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .gte('entrada', deDate)
        .lte('entrada', ateDate)
        .order('entrada', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export default function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>('mensal');
  const [customDe, setCustomDe] = useState('');
  const [customAte, setCustomAte] = useState('');
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [exporting, setExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const { data: config } = useConfiguracoes();
  const { toast } = useToast();

  const { data: movimentacoes = [] } = useMovimentacoesPeriodo(
    periodo,
    customDe || undefined,
    customAte || undefined
  );

  const filtrados = filtroPlaca
    ? movimentacoes.filter(m => m.placa.includes(filtroPlaca.toUpperCase()))
    : movimentacoes;

  const finalizados = filtrados.filter(m => m.status_movimentacao === 'finalizado');
  const ativos = filtrados.filter(m => m.status_movimentacao === 'ativo');
  const faturamento = finalizados.reduce((sum, m) => sum + (Number(m.valor_total) || 0), 0);
  const ticketMedio = finalizados.length > 0 ? faturamento / finalizados.length : 0;
  const pixTotal = finalizados.filter(m => m.forma_pagamento === 'pix').reduce((s, m) => s + (Number(m.valor_total) || 0), 0);
  const dinheiroTotal = finalizados.filter(m => m.forma_pagamento === 'dinheiro').reduce((s, m) => s + (Number(m.valor_total) || 0), 0);
  const pixCount = finalizados.filter(m => m.forma_pagamento === 'pix').length;
  const dinheiroCount = finalizados.filter(m => m.forma_pagamento === 'dinheiro').length;

  const chartData = useMemo(() => {
    const days: Record<string, { dia: string; faturamento: number; veiculos: number }> = {};
    finalizados.forEach(m => {
      const d = new Date(m.entrada).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      days[d] = days[d] || { dia: d, faturamento: 0, veiculos: 0 };
      days[d].faturamento += Number(m.valor_total) || 0;
      days[d].veiculos += 1;
    });
    return Object.values(days).sort((a, b) => {
      const [da, ma] = a.dia.split('/').map(Number);
      const [db, mb] = b.dia.split('/').map(Number);
      return (ma * 100 + da) - (mb * 100 + db);
    });
  }, [finalizados]);

  const periodoLabel = { hoje: 'Hoje', semanal: 'Última Semana', quinzenal: 'Últimos 15 Dias', mensal: 'Este Mês' };

  const exportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const w = 210;
      const margin = 15;
      const contentW = w - margin * 2;
      let y = margin;

      const drawText = (text: string, x: number, yPos: number, size = 10, style: 'normal' | 'bold' = 'normal', color = [30, 30, 30]) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(text, x, yPos);
      };

      const drawLine = (yPos: number) => {
        doc.setDrawColor(200);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, w - margin, yPos);
      };

      const checkPage = (needed: number) => {
        if (y + needed > 280) {
          doc.addPage();
          y = margin;
        }
      };

      // === HEADER ===
      drawText(config?.nome_estacionamento || 'ANDERSON ESTACIONAMENTOS', margin, y, 18, 'bold');
      y += 6;
      drawText('RELATÓRIO FINANCEIRO COMPLETO', margin, y, 10, 'normal', [100, 100, 100]);
      y += 5;
      const periodoText = customDe ? `${customDe} a ${customAte}` : periodoLabel[periodo];
      drawText(`Período: ${periodoText}`, margin, y, 9, 'normal', [100, 100, 100]);
      y += 4;
      drawText(`Emitido: ${new Date().toLocaleString('pt-BR')}`, margin, y, 8, 'normal', [140, 140, 140]);
      y += 6;
      drawLine(y); y += 8;

      // === RESUMO FINANCEIRO ===
      drawText('RESUMO FINANCEIRO', margin, y, 13, 'bold');
      y += 8;

      const stats = [
        ['Total de Entradas', `${filtrados.length}`],
        ['Saídas Finalizadas', `${finalizados.length}`],
        ['Em Aberto', `${ativos.length}`],
        ['Faturamento Total', `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Ticket Médio', `R$ ${ticketMedio.toFixed(2)}`],
        ['Receita PIX', `R$ ${pixTotal.toFixed(2)} (${pixCount} pagamentos)`],
        ['Receita Dinheiro', `R$ ${dinheiroTotal.toFixed(2)} (${dinheiroCount} pagamentos)`],
      ];

      // Draw stats in 2 columns
      const colW = contentW / 2;
      stats.forEach((s, i) => {
        const col = i % 2;
        const xPos = margin + col * colW;
        if (col === 0) checkPage(12);
        doc.setFillColor(245, 245, 248);
        doc.roundedRect(xPos, y - 4, colW - 4, 11, 2, 2, 'F');
        drawText(s[0], xPos + 3, y, 7, 'normal', [100, 100, 100]);
        drawText(s[1], xPos + 3, y + 5, 10, 'bold');
        if (col === 1) y += 14;
      });
      if (stats.length % 2 !== 0) y += 14;
      y += 4;
      drawLine(y); y += 8;

      // === CHART (capture from DOM) ===
      if (chartRef.current) {
        checkPage(80);
        drawText('FATURAMENTO POR DIA', margin, y, 13, 'bold');
        y += 6;
        try {
          const canvas = await html2canvas(chartRef.current, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
          });
          const imgData = canvas.toDataURL('image/png');
          const imgH = (canvas.height * contentW) / canvas.width;
          doc.addImage(imgData, 'PNG', margin, y, contentW, Math.min(imgH, 70));
          y += Math.min(imgH, 70) + 6;
        } catch {
          drawText('(Gráfico indisponível)', margin, y, 9, 'normal', [150, 150, 150]);
          y += 8;
        }
        drawLine(y); y += 8;
      }

      // === BALANÇO DIÁRIO ===
      checkPage(20);
      drawText('BALANÇO DIÁRIO', margin, y, 13, 'bold');
      y += 8;

      if (chartData.length > 0) {
        // Table header
        const cols = [margin, margin + 25, margin + 70, margin + 110];
        doc.setFillColor(30, 30, 40);
        doc.rect(margin, y - 4, contentW, 8, 'F');
        drawText('DIA', cols[0] + 2, y, 8, 'bold', [255, 255, 255]);
        drawText('FATURAMENTO', cols[1] + 2, y, 8, 'bold', [255, 255, 255]);
        drawText('VEÍCULOS', cols[2] + 2, y, 8, 'bold', [255, 255, 255]);
        drawText('TICKET MÉDIO', cols[3] + 2, y, 8, 'bold', [255, 255, 255]);
        y += 6;

        chartData.forEach((row, i) => {
          checkPage(8);
          if (i % 2 === 0) {
            doc.setFillColor(248, 248, 252);
            doc.rect(margin, y - 3.5, contentW, 7, 'F');
          }
          const tm = row.veiculos > 0 ? (row.faturamento / row.veiculos).toFixed(2) : '0.00';
          drawText(row.dia, cols[0] + 2, y, 8);
          drawText(`R$ ${row.faturamento.toFixed(2)}`, cols[1] + 2, y, 8, 'bold');
          drawText(`${row.veiculos}`, cols[2] + 2, y, 8);
          drawText(`R$ ${tm}`, cols[3] + 2, y, 8);
          y += 7;
        });

        // Total row
        checkPage(10);
        doc.setFillColor(30, 30, 40);
        doc.rect(margin, y - 3.5, contentW, 8, 'F');
        drawText('TOTAL', cols[0] + 2, y, 9, 'bold', [255, 255, 255]);
        drawText(`R$ ${faturamento.toFixed(2)}`, cols[1] + 2, y, 9, 'bold', [255, 255, 255]);
        drawText(`${finalizados.length}`, cols[2] + 2, y, 9, 'bold', [255, 255, 255]);
        drawText(`R$ ${ticketMedio.toFixed(2)}`, cols[3] + 2, y, 9, 'bold', [255, 255, 255]);
        y += 10;
      }

      drawLine(y); y += 8;

      // === MOVIMENTAÇÕES DETALHADAS ===
      checkPage(20);
      drawText('MOVIMENTAÇÕES DETALHADAS', margin, y, 13, 'bold');
      y += 8;

      // Table header
      const mCols = [margin, margin + 20, margin + 55, margin + 90, margin + 115, margin + 140, margin + 162];
      doc.setFillColor(30, 30, 40);
      doc.rect(margin, y - 4, contentW, 8, 'F');
      ['PLACA', 'ENTRADA', 'SAÍDA', 'TEMPO', 'VALOR', 'PGTO', 'STATUS'].forEach((h, i) => {
        drawText(h, mCols[i] + 1, y, 6, 'bold', [255, 255, 255]);
      });
      y += 6;

      filtrados.forEach((m, i) => {
        checkPage(8);
        if (i % 2 === 0) {
          doc.setFillColor(248, 248, 252);
          doc.rect(margin, y - 3.5, contentW, 7, 'F');
        }
        drawText(m.placa, mCols[0] + 1, y, 7, 'bold');
        drawText(new Date(m.entrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }), mCols[1] + 1, y, 6);
        drawText(m.saida ? new Date(m.saida).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—', mCols[2] + 1, y, 6);
        drawText(m.tempo_total || '—', mCols[3] + 1, y, 6);
        drawText(m.valor_total ? `R$ ${Number(m.valor_total).toFixed(2)}` : '—', mCols[4] + 1, y, 7, 'bold');
        drawText((m.forma_pagamento || '—').toUpperCase(), mCols[5] + 1, y, 6);
        drawText(m.status_movimentacao === 'ativo' ? 'ATIVO' : 'FINAL.', mCols[6] + 1, y, 6);
        y += 7;
      });

      // === FOOTER ===
      y += 6;
      checkPage(20);
      drawLine(y); y += 6;
      drawText(config?.endereco?.toUpperCase() || '', margin, y, 7, 'normal', [140, 140, 140]);
      y += 4;
      drawText(config?.mensagem_comprovante || 'ANDERSON ESTACIONAMENTOS AGRADECE A PREFERENCIA', margin, y, 7, 'bold', [100, 100, 100]);

      // Page numbers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(`Página ${i} de ${totalPages}`, w - margin, 290, { align: 'right' });
      }

      doc.save(`relatorio-${periodo}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: '✓ Relatório exportado', description: 'PDF gerado com sucesso' });
    } catch (err: any) {
      toast({ title: 'Erro ao exportar', description: err.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }, [filtrados, finalizados, ativos, faturamento, ticketMedio, pixTotal, dinheiroTotal, pixCount, dinheiroCount, chartData, periodo, customDe, customAte, config]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Análises e relatórios operacionais completos</p>
        </div>
        <Button onClick={exportPDF} disabled={exporting} className="gap-2 rounded-xl h-12 px-6">
          <Download className="h-4 w-4" />
          {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>

      {/* Period Selector */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="section-title">Período</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {(['hoje', 'semanal', 'quinzenal', 'mensal'] as Periodo[]).map(p => (
            <button
              key={p}
              onClick={() => { setPeriodo(p); setCustomDe(''); setCustomAte(''); }}
              className={`h-11 rounded-xl text-sm font-medium transition-all border-2 ${
                periodo === p && !customDe ? 'border-primary bg-primary/[0.06] text-primary' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {periodoLabel[p]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><p className="stat-label mb-1.5">De</p><Input type="date" value={customDe} onChange={e => setCustomDe(e.target.value)} className="h-11" /></div>
          <div><p className="stat-label mb-1.5">Até</p><Input type="date" value={customAte} onChange={e => setCustomAte(e.target.value)} className="h-11" /></div>
          <div><p className="stat-label mb-1.5">Placa</p><Input placeholder="ABC1D23" value={filtroPlaca} onChange={e => setFiltroPlaca(e.target.value)} className="h-11 font-mono" /></div>
          <div className="flex items-end"><Button onClick={() => { setCustomDe(''); setCustomAte(''); setFiltroPlaca(''); setPeriodo('mensal'); }} variant="outline" className="w-full h-11 rounded-xl">Limpar</Button></div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { icon: Car, label: 'Total Entradas', value: filtrados.length, color: 'text-primary' },
          { icon: Car, label: 'Saídas', value: finalizados.length, color: 'text-accent' },
          { icon: Clock, label: 'Em Aberto', value: ativos.length, color: 'text-warning' },
          { icon: DollarSign, label: 'Faturamento', value: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-accent' },
          { icon: TrendingUp, label: 'Ticket Médio', value: `R$ ${ticketMedio.toFixed(2)}`, color: 'text-foreground' },
          { icon: DollarSign, label: 'PIX / Dinheiro', value: `${pixCount} / ${dinheiroCount}`, color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2"><s.icon className="h-4 w-4 text-muted-foreground" /><p className="stat-label">{s.label}</p></div>
            <p className={`stat-value ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="glass-card p-6" ref={chartRef}>
          <h3 className="section-title mb-6">Faturamento por Dia — {customDe ? 'Personalizado' : periodoLabel[periodo]}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="faturamento" name="Faturamento" fill="hsl(217,91%,60%)" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="veiculos" name="Veículos" fill="hsl(160,65%,48%)" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h3 className="section-title">Movimentações ({filtrados.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 stat-label">Placa</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Modelo</th>
                <th className="text-left p-4 stat-label">Entrada</th>
                <th className="text-left p-4 stat-label">Saída</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Tempo</th>
                <th className="text-left p-4 stat-label">Valor</th>
                <th className="text-left p-4 stat-label hidden md:table-cell">Pagamento</th>
                <th className="text-left p-4 stat-label">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhuma movimentação encontrada</td></tr>
              ) : filtrados.map((m) => (
                <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground tracking-wide">{m.placa}</td>
                  <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{m.modelo}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{new Date(m.entrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{m.saida ? new Date(m.saida).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                  <td className="p-4 text-xs text-muted-foreground hidden md:table-cell">{m.tempo_total || '—'}</td>
                  <td className="p-4 font-display font-bold text-foreground">{m.valor_total ? `R$ ${Number(m.valor_total).toFixed(2)}` : '—'}</td>
                  <td className="p-4 text-xs uppercase font-semibold text-muted-foreground hidden md:table-cell">{m.forma_pagamento || '—'}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${m.status_movimentacao === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                      {m.status_movimentacao === 'ativo' ? 'Ativo' : 'Finalizado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
