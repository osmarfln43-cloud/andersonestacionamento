import { Car, Clock, Search, TrendingUp, LogIn, LogOut, Check, X, Pencil } from "lucide-react";
import { useMovimentacoesAtivas, useMovimentacoesHoje, useMovimentacoesFinalizadasHoje } from "@/hooks/useDatabase";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calculateParkingBilling } from "@/lib/billing";
import { useConfiguracoes } from "@/hooks/useDatabase";

type StatDialog = 'patio' | 'entradas' | 'saidas' | 'estimado' | null;

export default function Patio() {
  const [busca, setBusca] = useState("");
  const { data: veiculosAtivos = [], isLoading } = useMovimentacoesAtivas();
  const { data: movHoje = [] } = useMovimentacoesHoje();
  const { data: finalizadosHoje = [] } = useMovimentacoesFinalizadasHoje();
  const { data: config } = useConfiguracoes();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editMov, setEditMov] = useState<any>(null);
  const [editModelo, setEditModelo] = useState("");
  const [editCor, setEditCor] = useState("");
  const [saving, setSaving] = useState(false);
  const [statDialog, setStatDialog] = useState<StatDialog>(null);

  const entradasHoje = movHoje.length;
  const saidasHoje = finalizadosHoje.length;
  const noPatio = veiculosAtivos.length;

  const filtered = busca.length > 0
    ? veiculosAtivos.filter(v => v.placa.includes(busca.toUpperCase()) || (v.modelo || '').toLowerCase().includes(busca.toLowerCase()))
    : veiculosAtivos;

  const buscaPlaca = busca.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const placaEncontrada = buscaPlaca.length >= 3 ? veiculosAtivos.find(v => v.placa.includes(buscaPlaca)) : null;
  const placaNaoEncontrada = buscaPlaca.length >= 7 && !placaEncontrada;

  const calcularEstimativa = (v: any) => {
    const valorDiaria = v?.categoria === 'moto'
      ? Number(config?.valor_maximo_diario_moto ?? 15)
      : Number(config?.valor_maximo_diario ?? 35);

    return calculateParkingBilling({
      entrada: v.entrada,
      valorHora: Number(v.valor_hora),
      valorDiaria,
      toleranciaMinutos: Number(config?.tolerancia_minutos ?? 15),
    });
  };

  const totalEstimado = veiculosAtivos.reduce((sum, v) => sum + calcularEstimativa(v).total, 0);

  const openEdit = (mov: any) => {
    setEditMov(mov);
    setEditModelo(mov.modelo || '');
    setEditCor(mov.cor || '');
  };

  const handleSaveEdit = async () => {
    if (!editMov) return;
    setSaving(true);
    try {
      // Update movimentacao
      const { error } = await supabase.from('movimentacoes').update({
        modelo: editModelo.trim() || null,
        cor: editCor.trim() || null,
      }).eq('id', editMov.id);
      if (error) throw error;

      // Also update the veiculos table if linked
      if (editMov.veiculo_id) {
        await supabase.from('veiculos').update({
          modelo: editModelo.trim() || 'N/I',
          cor: editCor.trim() || null,
        }).eq('id', editMov.veiculo_id);
      } else {
        // Update by placa
        await supabase.from('veiculos').update({
          modelo: editModelo.trim() || 'N/I',
          cor: editCor.trim() || null,
        }).eq('placa', editMov.placa);
      }

      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      toast({ title: "Veículo atualizado!" });
      setEditMov(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-mono uppercase tracking-wider flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" /> Pátio
        </h1>
        <span className="text-sm font-mono text-muted-foreground">{noPatio} veículos</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { icon: Car, label: "NO PÁTIO AGORA", value: noPatio, color: "text-primary", key: 'patio' as StatDialog },
          { icon: LogIn, label: "ENTRADAS TOTAL DO DIA", value: entradasHoje, color: "text-accent", key: 'entradas' as StatDialog },
          { icon: LogOut, label: "SAÍDAS FINALIZADAS DO DIA", value: saidasHoje, color: "text-warning", key: 'saidas' as StatDialog },
          { icon: TrendingUp, label: "ESTIMADO", value: `R$ ${totalEstimado}`, color: "text-accent", key: 'estimado' as StatDialog },
        ].map((s, i) => (
          <div key={i} className="pdv-card p-3 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all" onClick={() => setStatDialog(s.key)}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="stat-label">{s.label}</span>
            </div>
            <p className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="pdv-card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Consultar placa..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pdv-input w-full pl-10 text-base" />
        </div>
        {buscaPlaca.length >= 7 && (
          <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded ${placaEncontrada ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}`}>
            {placaEncontrada ? (
              <><Check className="h-4 w-4" /><span className="text-sm font-bold">✓ {buscaPlaca} NO PÁTIO — {placaEncontrada.modelo}</span></>
            ) : (
              <><X className="h-4 w-4" /><span className="text-sm font-bold">{buscaPlaca} NÃO ENCONTRADO</span></>
            )}
          </div>
        )}
      </div>

      {isLoading && <p className="text-center text-muted-foreground py-8 font-mono">Carregando...</p>}

      {/* Vehicles table */}
      <div className="pdv-card overflow-hidden">
        <table className="pdv-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Cor</th>
              <th>Entrada</th>
              <th>Tempo</th>
              <th>Estimado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !isLoading && (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Pátio vazio</td></tr>
            )}
            {filtered.map((v, i) => {
              const diffMs = Date.now() - new Date(v.entrada).getTime();
              const h = Math.floor(diffMs / 3600000);
              const m = Math.round((diffMs % 3600000) / 60000);
              const valor = calcularEstimativa(v).total;

              return (
                <tr key={v.id} className={v.categoria === 'moto' ? 'pdv-moto-row' : 'pdv-carro-row'}>
                  <td>{String(i + 1).padStart(3, '0')}</td>
                  <td className="font-bold text-base">{v.placa}</td>
                  <td className="font-bold">{(v.modelo || 'N/I').toUpperCase()}</td>
                  <td>{(v.cor || '').toUpperCase()}</td>
                  <td>{new Date(v.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{h}h{String(m).padStart(2, '0')}</td>
                  <td className="font-bold text-accent">R$ {valor}</td>
                  <td>
                    <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Editar veículo">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stat Detail Dialogs */}
      <Dialog open={statDialog === 'patio'} onOpenChange={() => setStatDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Car className="h-5 w-5 text-primary" /> Veículos no Pátio ({noPatio})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {veiculosAtivos.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum veículo no pátio</p>}
            {veiculosAtivos.map(v => {
              const diffMs = Date.now() - new Date(v.entrada).getTime();
              const h = Math.floor(diffMs / 3600000);
              const m = Math.round((diffMs % 3600000) / 60000);
              const valor = calcularEstimativa(v).total;
              return (
                <div key={v.id} className="pdv-card p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold font-mono text-base">{v.placa}</p>
                    <p className="text-sm text-muted-foreground">{(v.modelo || 'N/I').toUpperCase()} {(v.cor || '').toUpperCase()} • {v.categoria === 'moto' ? '🏍️ Moto' : '🚗 Carro'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">{h}h{String(m).padStart(2, '0')}</p>
                    <p className="font-bold text-accent font-mono">R$ {valor}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={statDialog === 'entradas'} onOpenChange={() => setStatDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LogIn className="h-5 w-5 text-accent" /> Entradas Hoje ({entradasHoje})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {movHoje.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhuma entrada hoje</p>}
            {movHoje.map(v => (
              <div key={v.id} className="pdv-card p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold font-mono text-base">{v.placa}</p>
                  <p className="text-sm text-muted-foreground">{(v.modelo || 'N/I').toUpperCase()} {(v.cor || '').toUpperCase()} • {v.categoria === 'moto' ? '🏍️ Moto' : '🚗 Carro'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">{new Date(v.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${v.status_movimentacao === 'ativo' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {v.status_movimentacao === 'ativo' ? 'NO PÁTIO' : 'FINALIZADO'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={statDialog === 'saidas'} onOpenChange={() => setStatDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LogOut className="h-5 w-5 text-warning" /> Saídas Hoje ({saidasHoje})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {finalizadosHoje.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhuma saída hoje</p>}
            {finalizadosHoje.map(v => (
              <div key={v.id} className="pdv-card p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold font-mono text-base">{v.placa}</p>
                  <p className="text-sm text-muted-foreground">{(v.modelo || 'N/I').toUpperCase()} {(v.cor || '').toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">{v.saida ? new Date(v.saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--'}</p>
                  <p className="font-bold text-accent font-mono">R$ {Number(v.valor_total || 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{v.forma_pagamento || '--'}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={statDialog === 'estimado'} onOpenChange={() => setStatDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-accent" /> Estimativa — R$ {totalEstimado}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <p className="text-sm text-muted-foreground mb-3">Valor estimado por veículo ainda no pátio:</p>
            {veiculosAtivos.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum veículo no pátio</p>}
            {veiculosAtivos.map(v => {
              const diffMs = Date.now() - new Date(v.entrada).getTime();
              const h = Math.floor(diffMs / 3600000);
              const m = Math.round((diffMs % 3600000) / 60000);
              const valor = calcularEstimativa(v).total;
              return (
                <div key={v.id} className="pdv-card p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold font-mono">{v.placa}</p>
                    <p className="text-xs text-muted-foreground">{h}h{String(m).padStart(2, '0')} • R$ {Number(v.valor_hora)}/h</p>
                  </div>
                  <p className="font-bold text-accent font-mono text-lg">R$ {valor}</p>
                </div>
              );
            })}
            <div className="border-t pt-3 flex justify-between font-bold font-mono text-lg">
              <span>TOTAL</span>
              <span className="text-accent">R$ {totalEstimado}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editMov} onOpenChange={() => setEditMov(null)}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>Editar Veículo — {editMov?.placa}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="stat-label">Modelo</Label>
              <Input value={editModelo} onChange={e => setEditModelo(e.target.value)} placeholder="Ex: Honda Civic" />
            </div>
            <div className="space-y-2">
              <Label className="stat-label">Cor</Label>
              <Input value={editCor} onChange={e => setEditCor(e.target.value)} placeholder="Ex: Preto" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditMov(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Salvando...' : 'Atualizar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
