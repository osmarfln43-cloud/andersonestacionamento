import { FileText, Download, DollarSign, Car, Clock, TrendingUp, Calendar, Search, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { useMemo, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useConfiguracoes } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const COLORS = [
  'hsl(217, 91%, 60%)', // blue
  'hsl(160, 65%, 48%)', // green
  'hsl(340, 82%, 52%)', // pink
  'hsl(45, 93%, 47%)',  // amber
  'hsl(280, 67%, 55%)', // purple
  'hsl(16, 90%, 55%)',  // orange
];

const tooltipStyle = {
  background: 'hsl(0, 0%, 100%)',
  border: '1px solid hsl(200, 20%, 82%)',
  borderRadius: 4,
  fontSize: 12,
  padding: '8px 12px',
  color: 'hsl(0, 0%, 10%)',
};

type Periodo = 'hoje' | '15dias' | '30dias' | '6meses' | '1ano' | 'custom';

const periodoLabel: Record<Periodo, string> = {
  hoje: 'Hoje',
  '15dias': 'Últimos 15 Dias',
  '30dias': 'Últimos 30 Dias',
  '6meses': 'Últimos 6 Meses',
  '1ano': 'Último Ano',
  custom: 'Personalizado',
};

function getDateRange(periodo: Periodo) {
  const now = new Date();
  const ate = new Date(now);
  ate.setHours(23, 59, 59, 999);
  const de = new Date(now);
  de.setHours(0, 0, 0, 0);
  switch (periodo) {
    case 'hoje': break;
    case '15dias': de.setDate(de.getDate() - 15); break;
    case '30dias': de.setDate(de.getDate() - 30); break;
    case '6meses': de.setMonth(de.getMonth() - 6); break;
    case '1ano': de.setFullYear(de.getFullYear() - 1); break;
    default: break;
  }
  return { de, ate };
}

function useMovimentacoesPeriodo(periodo: Periodo, customDe?: string, customAte?: string) {
  return useQuery({
    queryKey: ['movimentacoes', 'relatorio', periodo, customDe, customAte],
    queryFn: async () => {
      let deDate: string, ateDate: string;
      if (periodo === 'custom' && customDe && customAte) {
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
  const [periodo, setPeriodo] = useState<Periodo>('30dias');
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
  const carrosCount = filtrados.filter(m => (m as any).categoria === 'carro').length;
  const motosCount = filtrados.filter(m => (m as any).categoria === 'moto').length;

  // Faturamento por dia (bar chart)
  const chartDataDia = useMemo(() => {
    const days: Record<string, { dia: string; faturamento: number; veiculos: number; carros: number; motos: number }> = {};
    finalizados.forEach(m => {
      const isLong = periodo === '6meses' || periodo === '1ano';
      const d = isLong
        ? new Date(m.entrada).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        : new Date(m.entrada).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!days[d]) days[d] = { dia: d, faturamento: 0, veiculos: 0, carros: 0, motos: 0 };
      days[d].faturamento += Number(m.valor_total) || 0;
      days[d].veiculos += 1;
      if ((m as any).categoria === 'moto') days[d].motos += 1;
      else days[d].carros += 1;
    });
    return Object.values(days).sort((a, b) => {
      const [da, ma] = a.dia.split('/').map(Number);
      const [db, mb] = b.dia.split('/').map(Number);
      if (isNaN(da)) return 0;
      return (ma * 100 + da) - (mb * 100 + db);
    });
  }, [finalizados, periodo]);

  // Pagamento pie chart
  const pagamentoData = useMemo(() => [
    { name: 'PIX', value: pixTotal, color: COLORS[0] },
    { name: 'Dinheiro', value: dinheiroTotal, color: COLORS[1] },
  ].filter(d => d.value > 0), [pixTotal, dinheiroTotal]);

  // Categoria pie chart
  const categoriaData = useMemo(() => [
    { name: 'Carros', value: carrosCount, color: COLORS[0] },
    { name: 'Motos', value: motosCount, color: COLORS[3] },
  ].filter(d => d.value > 0), [carrosCount, motosCount]);

  // Hourly distribution
  const horaData = useMemo(() => {
    const hours: Record<number, number> = {};
    filtrados.forEach(m => {
      const h = new Date(m.entrada).getHours();
      hours[h] = (hours[h] || 0) + 1;
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hora: `${i.toString().padStart(2, '0')}h`,
      veiculos: hours[i] || 0,
    }));
  }, [filtrados]);

  // Top plates
  const topPlacas = useMemo(() => {
    const freq: Record<string, { placa: string; vezes: number; totalGasto: number; modelo: string; categoria: string }> = {};
    filtrados.forEach(m => {
      if (!freq[m.placa]) freq[m.placa] = { placa: m.placa, vezes: 0, totalGasto: 0, modelo: m.modelo || '—', categoria: (m as any).categoria || 'carro' };
      freq[m.placa].vezes += 1;
      freq[m.placa].totalGasto += Number(m.valor_total) || 0;
    });
    return Object.values(freq).sort((a, b) => b.vezes - a.vezes).slice(0, 10);
  }, [filtrados]);

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
      const drawLine = (yPos: number) => { doc.setDrawColor(200); doc.setLineWidth(0.3); doc.line(margin, yPos, w - margin, yPos); };
      const checkPage = (needed: number) => { if (y + needed > 280) { doc.addPage(); y = margin; } };

      drawText(config?.nome_estacionamento || 'ANDERSON ESTACIONAMENTOS', margin, y, 18, 'bold');
      y += 6;
      drawText('RELATÓRIO COMPLETO', margin, y, 10, 'normal', [100, 100, 100]);
      y += 5;
      const periodoText = periodo === 'custom' ? `${customDe} a ${customAte}` : periodoLabel[periodo];
      drawText(`Período: ${periodoText}  |  Emitido: ${new Date().toLocaleString('pt-BR')}`, margin, y, 8, 'normal', [140, 140, 140]);
      y += 8; drawLine(y); y += 8;

      const stats = [
        ['Total Entradas', `${filtrados.length}`],
        ['Finalizadas', `${finalizados.length}`],
        ['Carros', `${carrosCount}`],
        ['Motos', `${motosCount}`],
        ['Faturamento', `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Ticket Médio', `R$ ${ticketMedio.toFixed(2)}`],
        ['PIX', `R$ ${pixTotal.toFixed(2)} (${pixCount}x)`],
        ['Dinheiro', `R$ ${dinheiroTotal.toFixed(2)} (${dinheiroCount}x)`],
      ];
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
      y += 4; drawLine(y); y += 8;

      if (chartRef.current) {
        checkPage(80);
        drawText('GRÁFICO DE FATURAMENTO', margin, y, 13, 'bold');
        y += 6;
        try {
          const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff', logging: false });
          const imgData = canvas.toDataURL('image/png');
          const imgH = (canvas.height * contentW) / canvas.width;
          doc.addImage(imgData, 'PNG', margin, y, contentW, Math.min(imgH, 70));
          y += Math.min(imgH, 70) + 6;
        } catch { drawText('(Gráfico indisponível)', margin, y, 9); y += 8; }
        drawLine(y); y += 8;
      }

      checkPage(20);
      drawText('MOVIMENTAÇÕES', margin, y, 13, 'bold'); y += 8;
      const mCols = [margin, margin + 20, margin + 55, margin + 90, margin + 115, margin + 140, margin + 162];
      doc.setFillColor(30, 30, 40);
      doc.rect(margin, y - 4, contentW, 8, 'F');
      ['PLACA', 'ENTRADA', 'SAÍDA', 'TEMPO', 'VALOR', 'PGTO', 'CAT.'].forEach((h, i) => {
        drawText(h, mCols[i] + 1, y, 6, 'bold', [255, 255, 255]);
      });
      y += 6;
      filtrados.forEach((m, i) => {
        checkPage(8);
        if (i % 2 === 0) { doc.setFillColor(248, 248, 252); doc.rect(margin, y - 3.5, contentW, 7, 'F'); }
        drawText(m.placa, mCols[0] + 1, y, 7, 'bold');
        drawText(new Date(m.entrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }), mCols[1] + 1, y, 6);
        drawText(m.saida ? new Date(m.saida).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—', mCols[2] + 1, y, 6);
        drawText(m.tempo_total || '—', mCols[3] + 1, y, 6);
        drawText(m.valor_total ? `R$ ${Number(m.valor_total).toFixed(2)}` : '—', mCols[4] + 1, y, 7, 'bold');
        drawText((m.forma_pagamento || '—').toUpperCase(), mCols[5] + 1, y, 6);
        drawText(((m as any).categoria || 'carro').toUpperCase(), mCols[6] + 1, y, 6);
        y += 7;
      });

      y += 6; drawLine(y); y += 6;
      drawText(config?.mensagem_comprovante || 'ANDERSON ESTACIONAMENTOS AGRADECE A PREFERÊNCIA', margin, y, 7, 'bold', [100, 100, 100]);
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(160, 160, 160); doc.text(`Página ${i} de ${totalPages}`, w - margin, 290, { align: 'right' }); }
      doc.save(`relatorio-${periodo}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: '✓ Relatório exportado', description: 'PDF gerado com sucesso' });
    } catch (err: any) {
      toast({ title: 'Erro ao exportar', description: err.message, variant: 'destructive' });
    } finally { setExporting(false); }
  }, [filtrados, finalizados, faturamento, ticketMedio, pixTotal, dinheiroTotal, pixCount, dinheiroCount, carrosCount, motosCount, chartRef, periodo, customDe, customAte, config, toast]);

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
          <p className="text-sm text-muted-foreground mt-2">Análises detalhadas com gráficos e dados completos</p>
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
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          {(['hoje', '15dias', '30dias', '6meses', '1ano', 'custom'] as Periodo[]).map(p => (
            <button
              key={p}
              onClick={() => { setPeriodo(p); if (p !== 'custom') { setCustomDe(''); setCustomAte(''); } }}
              className={`h-11 rounded-xl text-xs sm:text-sm font-medium transition-all border-2 ${
                periodo === p ? 'border-primary bg-primary/[0.06] text-primary' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {periodoLabel[p]}
            </button>
          ))}
        </div>
        {periodo === 'custom' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><p className="stat-label mb-1.5">Data Início</p><Input type="date" value={customDe} onChange={e => setCustomDe(e.target.value)} className="h-11" /></div>
            <div><p className="stat-label mb-1.5">Data Fim</p><Input type="date" value={customAte} onChange={e => setCustomAte(e.target.value)} className="h-11" /></div>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <div className="col-span-2 md:col-span-1">
            <p className="stat-label mb-1.5">Filtrar Placa</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ABC1D23" value={filtroPlaca} onChange={e => setFiltroPlaca(e.target.value)} className="h-11 font-mono pl-9" />
            </div>
          </div>
          <div className="flex items-end">
            <Button onClick={() => { setCustomDe(''); setCustomAte(''); setFiltroPlaca(''); setPeriodo('30dias'); }} variant="outline" className="w-full h-11 rounded-xl">Limpar</Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { icon: Car, label: 'Total', value: filtrados.length, color: 'text-primary' },
          { icon: Car, label: 'Finalizadas', value: finalizados.length, color: 'text-accent' },
          { icon: Clock, label: 'Em Aberto', value: ativos.length, color: 'text-warning' },
          { icon: Car, label: 'Carros', value: carrosCount, color: 'text-primary' },
          { icon: Bike, label: 'Motos', value: motosCount, color: 'text-foreground' },
          { icon: DollarSign, label: 'Faturamento', value: `R$ ${faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-accent' },
          { icon: TrendingUp, label: 'Ticket Médio', value: `R$ ${ticketMedio.toFixed(2)}`, color: 'text-foreground' },
          { icon: DollarSign, label: 'PIX / Dinheiro', value: `${pixCount}/${dinheiroCount}`, color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center gap-1.5 mb-1"><s.icon className="h-3.5 w-3.5 text-muted-foreground" /><p className="stat-label text-[10px]">{s.label}</p></div>
            <p className={`stat-value text-lg ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Faturamento + Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6" ref={chartRef}>
          <h3 className="section-title mb-6">📊 Faturamento por Dia — {periodoLabel[periodo]}</h3>
          {chartDataDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartDataDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 10 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `R$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`R$ ${value.toFixed(2)}`, name === 'faturamento' ? 'Faturamento' : name]} />
                <Bar dataKey="faturamento" name="Faturamento" fill={COLORS[0]} radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="carros" name="Carros" fill={COLORS[1]} radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="motos" name="Motos" fill={COLORS[3]} radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados para o período</p>
          )}
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h3 className="section-title mb-4">💳 Forma de Pagamento</h3>
          {pagamentoData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pagamentoData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} strokeWidth={0}>
                    {pagamentoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {pagamentoData.map(p => (
                  <div key={p.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}: R$ {p.value.toFixed(2)}
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground text-center py-16">Sem dados</p>}

          <h3 className="section-title mb-4 mt-6">🚗 Categoria</h3>
          {categoriaData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoriaData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} strokeWidth={0}>
                    {categoriaData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-1">
                {categoriaData.map(c => (
                  <div key={c.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}: {c.value}
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>}
        </div>
      </div>

      {/* Charts Row 2: Hora + Top Placas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h3 className="section-title mb-6">⏰ Distribuição por Horário</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={horaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,14%)" vertical={false} />
              <XAxis dataKey="hora" tick={{ fill: 'hsl(218,12%,50%)', fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fill: 'hsl(218,12%,50%)', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="veiculos" name="Veículos" fill={COLORS[4]} radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="section-title mb-4">🏆 Top 10 Placas Mais Frequentes</h3>
          {topPlacas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-2 stat-label">#</th>
                    <th className="text-left py-2 px-2 stat-label">Placa</th>
                    <th className="text-left py-2 px-2 stat-label">Modelo</th>
                    <th className="text-left py-2 px-2 stat-label">Cat.</th>
                    <th className="text-left py-2 px-2 stat-label">Vezes</th>
                    <th className="text-left py-2 px-2 stat-label">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topPlacas.map((p, i) => (
                    <tr key={p.placa} className="border-b border-border/20 hover:bg-secondary/20">
                      <td className="py-2 px-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 px-2 font-mono font-bold text-foreground">{p.placa}</td>
                      <td className="py-2 px-2 text-muted-foreground text-xs">{p.modelo}</td>
                      <td className="py-2 px-2"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${p.categoria === 'moto' ? 'bg-amber-500/10 text-amber-400' : 'bg-primary/10 text-primary'}`}>{p.categoria}</span></td>
                      <td className="py-2 px-2 font-bold text-accent">{p.vezes}</td>
                      <td className="py-2 px-2 font-mono text-foreground">R$ {p.totalGasto.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border/50">
          <h3 className="section-title">📋 Movimentações Detalhadas ({filtrados.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-3 stat-label">Placa</th>
                <th className="text-left p-3 stat-label hidden md:table-cell">Modelo</th>
                <th className="text-left p-3 stat-label hidden md:table-cell">Cat.</th>
                <th className="text-left p-3 stat-label">Entrada</th>
                <th className="text-left p-3 stat-label">Saída</th>
                <th className="text-left p-3 stat-label hidden md:table-cell">Tempo</th>
                <th className="text-left p-3 stat-label">Valor</th>
                <th className="text-left p-3 stat-label hidden md:table-cell">Pgto</th>
                <th className="text-left p-3 stat-label">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Nenhuma movimentação encontrada</td></tr>
              ) : filtrados.map((m) => (
                <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="p-3 font-mono font-bold text-foreground tracking-wide">{m.placa}</td>
                  <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{m.modelo || '—'}</td>
                  <td className="p-3 hidden md:table-cell">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${(m as any).categoria === 'moto' ? 'bg-amber-500/10 text-amber-400' : 'bg-primary/10 text-primary'}`}>
                      {(m as any).categoria || 'carro'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{new Date(m.entrada).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{m.saida ? new Date(m.saida).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                  <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">{m.tempo_total || '—'}</td>
                  <td className="p-3 font-display font-bold text-foreground">{m.valor_total ? `R$ ${Number(m.valor_total).toFixed(2)}` : '—'}</td>
                  <td className="p-3 text-xs uppercase font-semibold text-muted-foreground hidden md:table-cell">{m.forma_pagamento || '—'}</td>
                  <td className="p-3">
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
