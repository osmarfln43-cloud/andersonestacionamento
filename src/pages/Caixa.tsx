import { useMemo, useState } from "react";
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Car, Clock, Plus, Trash2, Banknote, QrCode, CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line,
} from "recharts";
import {
  useDespesas, useSalvarDespesa, useExcluirDespesa, useMovimentacoesHistorico, CATEGORIAS_DESPESA,
} from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import {
  PERIODOS, PeriodoId, resolvePeriodo, aggregate, fechamentos, formatBRL,
} from "@/lib/cashflow";

const CATEGORIA_LABEL: Record<string, string> = {
  funcionarios: "Funcionários",
  aluguel: "Aluguel",
  energia: "Energia",
  agua: "Água",
  manutencao: "Manutenção",
  impostos: "Impostos",
  outros: "Outros",
};

const hojeISO = () => new Date().toISOString().slice(0, 10);

export default function Caixa() {
  const { toast } = useToast();
  const { data: movimentacoes = [] } = useMovimentacoesHistorico();
  const { data: despesas = [] } = useDespesas();
  const salvarDespesa = useSalvarDespesa();
  const excluirDespesa = useExcluirDespesa();

  const [periodo, setPeriodo] = useState<PeriodoId>("mes");
  const [de, setDe] = useState(hojeISO());
  const [ate, setAte] = useState(hojeISO());
  const [tipoFechamento, setTipoFechamento] = useState<"diario" | "mensal" | "semestral" | "anual">("diario");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    descricao: "", categoria: "outros", valor: "", data: hojeISO(), forma_pagamento: "dinheiro", observacao: "",
  });

  const { inicio, fim } = useMemo(() => resolvePeriodo(periodo, { de, ate }), [periodo, de, ate]);
  const stats = useMemo(
    () => aggregate(movimentacoes as any, despesas as any, inicio, fim),
    [movimentacoes, despesas, inicio, fim],
  );
  const linhasFechamento = useMemo(
    () => fechamentos(movimentacoes as any, despesas as any, tipoFechamento, inicio, fim),
    [movimentacoes, despesas, tipoFechamento, inicio, fim],
  );

  const totalFechamento = linhasFechamento.reduce(
    (acc, r) => ({
      receita: acc.receita + r.receita,
      despesa: acc.despesa + r.despesa,
      lucro: acc.lucro + r.lucro,
      veiculos: acc.veiculos + r.veiculos,
    }),
    { receita: 0, despesa: 0, lucro: 0, veiculos: 0 },
  );

  const handleSalvar = async () => {
    const valor = Number(form.valor.replace(",", "."));
    if (!form.descricao.trim() || !valor || valor <= 0) {
      toast({ title: "Preencha descrição e valor", variant: "destructive" });
      return;
    }
    try {
      await salvarDespesa.mutateAsync({ ...form, valor });
      toast({ title: "✓ Despesa lançada", description: `${form.descricao} — ${formatBRL(valor)}` });
      setForm({ descricao: "", categoria: "outros", valor: "", data: hojeISO(), forma_pagamento: "dinheiro", observacao: "" });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
  };

  const tempoMedio = `${Math.floor(stats.tempoMedioMin / 60)}h ${Math.round(stats.tempoMedioMin % 60)}min`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight font-display">Fluxo de Caixa</h1>
            <p className="text-xs text-muted-foreground">
              {inicio.toLocaleDateString("pt-BR")} até {fim.toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold"><Plus className="h-4 w-4" /> Lançar despesa</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nova despesa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Conta de energia" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_DESPESA.map((c) => (
                        <SelectItem key={c} value={c}>{CATEGORIA_LABEL[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor (R$)</Label>
                  <Input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} inputMode="decimal" placeholder="0,00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Pagamento</Label>
                  <Select value={form.forma_pagamento} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Observação</Label>
                <Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={2} />
              </div>
              <Button className="w-full font-bold" onClick={handleSalvar} disabled={salvarDespesa.isPending}>
                {salvarDespesa.isPending ? "Salvando..." : "Salvar despesa"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Períodos */}
      <div className="glass-card p-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <Button key={p.id} size="sm" variant={periodo === p.id ? "default" : "outline"}
              className="text-xs font-semibold" onClick={() => setPeriodo(p.id)}>
              {p.label}
            </Button>
          ))}
        </div>
        {periodo === "personalizado" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">De</Label>
              <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Até</Label>
              <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-success"><TrendingUp className="h-4 w-4" /><span className="stat-label text-[11px]">Receitas</span></div>
          <p className="text-xl md:text-2xl font-bold font-mono text-success tabular-nums">{formatBRL(stats.receita)}</p>
          <p className="text-[11px] text-muted-foreground">{stats.veiculosAtendidos} veículos pagos</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-destructive"><TrendingDown className="h-4 w-4" /><span className="stat-label text-[11px]">Despesas</span></div>
          <p className="text-xl md:text-2xl font-bold font-mono text-destructive tabular-nums">{formatBRL(stats.despesa)}</p>
          <p className="text-[11px] text-muted-foreground">{stats.despesasPeriodo.length} lançamentos</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-primary"><PiggyBank className="h-4 w-4" /><span className="stat-label text-[11px]">Lucro</span></div>
          <p className={`text-xl md:text-2xl font-bold font-mono tabular-nums ${stats.lucro >= 0 ? "text-primary" : "text-destructive"}`}>
            {formatBRL(stats.lucro)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Margem {stats.receita > 0 ? ((stats.lucro / stats.receita) * 100).toFixed(1) : "0,0"}%
          </p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-warning"><Car className="h-4 w-4" /><span className="stat-label text-[11px]">Ticket médio</span></div>
          <p className="text-xl md:text-2xl font-bold font-mono text-warning tabular-nums">{formatBRL(stats.ticketMedio)}</p>
          <p className="text-[11px] text-muted-foreground">{stats.entradasPeriodo} entradas no período</p>
        </div>
      </div>

      {/* Detalhamento */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="glass-card p-4 space-y-2">
          <span className="stat-label text-[11px]">Recebimentos</span>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><Banknote className="h-4 w-4 text-success" /> Dinheiro</span>
            <span className="font-mono font-bold">{formatBRL(stats.receitaDinheiro)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><QrCode className="h-4 w-4 text-primary" /> PIX</span>
            <span className="font-mono font-bold">{formatBRL(stats.receitaPix)}</span>
          </div>
        </div>
        <div className="glass-card p-4 space-y-2">
          <span className="stat-label text-[11px]">Tipo de cliente</span>
          <div className="flex items-center justify-between text-sm">
            <span>Avulso</span><span className="font-mono font-bold">{formatBRL(stats.receitaAvulso)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Mensalista</span><span className="font-mono font-bold">{formatBRL(stats.receitaMensalista)}</span>
          </div>
        </div>
        <div className="glass-card p-4 space-y-2">
          <span className="stat-label text-[11px]">Operação</span>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Permanência média</span>
            <span className="font-mono font-bold">{tempoMedio}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Média de veículos/dia</span>
            <span className="font-mono font-bold">{stats.ocupacaoMediaDia.toFixed(1)}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Pico: {stats.picos.length ? stats.picos.map((p) => `${String(p.hora).padStart(2, "0")}h (${p.qtd})`).join(" · ") : "—"}
          </div>
        </div>
      </div>

      <Tabs defaultValue="graficos" className="space-y-3">
        <TabsList className="bg-secondary/50 border border-border/50 p-1 h-auto">
          <TabsTrigger value="graficos" className="text-xs">Gráficos</TabsTrigger>
          <TabsTrigger value="fechamento" className="text-xs">Fechamento</TabsTrigger>
          <TabsTrigger value="despesas" className="text-xs">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="graficos" className="space-y-3">
          <div className="glass-card p-4">
            <p className="text-sm font-bold mb-3">Receitas x Despesas x Lucro</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.serie}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                  <Legend />
                  <Bar name="Receita" dataKey="receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar name="Despesa" dataKey="despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar name="Lucro" dataKey="lucro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm font-bold mb-3">Veículos atendidos</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.serie}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="veiculos" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fechamento" className="space-y-3">
          <div className="glass-card p-3 flex flex-wrap gap-2">
            {(["diario", "mensal", "semestral", "anual"] as const).map((t) => (
              <Button key={t} size="sm" variant={tipoFechamento === t ? "default" : "outline"}
                className="text-xs font-semibold capitalize" onClick={() => setTipoFechamento(t)}>
                <CalendarRange className="h-3.5 w-3.5 mr-1" /> {t}
              </Button>
            ))}
          </div>
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr className="text-left">
                  <th className="px-3 py-2 stat-label text-[11px]">Período</th>
                  <th className="px-3 py-2 stat-label text-[11px] text-right">Veículos</th>
                  <th className="px-3 py-2 stat-label text-[11px] text-right">Receita</th>
                  <th className="px-3 py-2 stat-label text-[11px] text-right">Despesa</th>
                  <th className="px-3 py-2 stat-label text-[11px] text-right">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {linhasFechamento.map((r) => (
                  <tr key={r.label} className="border-t border-border/50">
                    <td className="px-3 py-2 font-mono">{r.label}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.veiculos}</td>
                    <td className="px-3 py-2 text-right font-mono text-success">{formatBRL(r.receita)}</td>
                    <td className="px-3 py-2 text-right font-mono text-destructive">{formatBRL(r.despesa)}</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${r.lucro >= 0 ? "text-primary" : "text-destructive"}`}>
                      {formatBRL(r.lucro)}
                    </td>
                  </tr>
                ))}
                {linhasFechamento.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Nenhum movimento no período</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-secondary/40 font-bold">
                  <td className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right font-mono">{totalFechamento.veiculos}</td>
                  <td className="px-3 py-2 text-right font-mono text-success">{formatBRL(totalFechamento.receita)}</td>
                  <td className="px-3 py-2 text-right font-mono text-destructive">{formatBRL(totalFechamento.despesa)}</td>
                  <td className={`px-3 py-2 text-right font-mono ${totalFechamento.lucro >= 0 ? "text-primary" : "text-destructive"}`}>
                    {formatBRL(totalFechamento.lucro)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="despesas" className="space-y-3">
          {stats.despesasPorCategoria.length > 0 && (
            <div className="glass-card p-4 space-y-2">
              <span className="stat-label text-[11px]">Despesas por categoria</span>
              {stats.despesasPorCategoria.map((c) => (
                <div key={c.categoria} className="flex items-center justify-between text-sm">
                  <span>{CATEGORIA_LABEL[c.categoria] || c.categoria}</span>
                  <span className="font-mono font-bold text-destructive">{formatBRL(c.valor)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="glass-card divide-y divide-border/50">
            {stats.despesasPeriodo.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma despesa no período</p>
            )}
            {(despesas as any[])
              .filter((d) => stats.despesasPeriodo.some((p: any) => p.id === d.id))
              .map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{d.descricao}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {CATEGORIA_LABEL[d.categoria] || d.categoria} · {new Date(`${d.data}T12:00:00`).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-destructive">{formatBRL(d.valor)}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                      onClick={() => excluirDespesa.mutate(d.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
