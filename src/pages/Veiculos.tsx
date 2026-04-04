import { CarFront, Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useVeiculos, useClientes } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type VeiculoForm = {
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
  categoria: string;
  cliente_id: string;
  observacao: string;
};

const emptyForm: VeiculoForm = { placa: '', modelo: '', marca: '', cor: '', categoria: '', cliente_id: '', observacao: '' };

export default function Veiculos() {
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<VeiculoForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewVeiculo, setViewVeiculo] = useState<any>(null);

  const { data: veiculos = [], isLoading } = useVeiculos();
  const { data: clientes = [] } = useClientes();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filtered = veiculos.filter((v: any) =>
    v.placa.includes(busca.toUpperCase()) ||
    v.modelo.toLowerCase().includes(busca.toLowerCase()) ||
    (v.clientes?.nome || '').toLowerCase().includes(busca.toLowerCase())
  );

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (v: any) => {
    setForm({ placa: v.placa, modelo: v.modelo, marca: v.marca || '', cor: v.cor || '', categoria: v.categoria || '', cliente_id: v.cliente_id || '', observacao: v.observacao || '' });
    setEditId(v.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.placa.trim() || !form.modelo.trim()) { toast({ title: "Placa e modelo são obrigatórios", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { ...form, placa: form.placa.toUpperCase(), cliente_id: form.cliente_id || null };
      if (editId) {
        const { error } = await supabase.from('veiculos').update(payload).eq('id', editId);
        if (error) throw error;
        toast({ title: "Veículo atualizado!" });
      } else {
        const { error } = await supabase.from('veiculos').insert(payload);
        if (error) throw error;
        toast({ title: "Veículo cadastrado!" });
      }
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;
    const { error } = await supabase.from('veiculos').delete().eq('id', id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Veículo excluído" });
    queryClient.invalidateQueries({ queryKey: ['veiculos'] });
  };

  const setField = (k: keyof VeiculoForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CarFront className="h-5 w-5 text-primary" />
            </div>
            Veículos
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{veiculos.length} veículos cadastrados</p>
        </div>
        <Button className="gap-2 h-11 px-6 rounded-xl" onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo Veículo
        </Button>
      </div>

      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa, modelo ou proprietário..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base border-0 bg-transparent" />
        </div>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum veículo encontrado</p>
        ) : filtered.map((v: any) => (
          <div key={v.id} className="glass-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-foreground text-base tracking-wider">{v.placa}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setViewVeiculo(v)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></button>
                <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span className="text-muted-foreground">Veículo:</span>
              <span className="text-foreground">{v.marca ? `${v.marca} ` : ''}{v.modelo}</span>
              <span className="text-muted-foreground">Cor:</span>
              <span className="text-foreground">{v.cor || '—'}</span>
              <span className="text-muted-foreground">Proprietário:</span>
              <span className="text-foreground">{v.clientes?.nome || '—'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="glass-card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 stat-label">Placa</th>
                <th className="text-left p-4 stat-label">Veículo</th>
                <th className="text-left p-4 stat-label">Cor</th>
                <th className="text-left p-4 stat-label">Proprietário</th>
                <th className="text-right p-4 stat-label">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum veículo encontrado</td></tr>
              ) : filtered.map((v: any) => (
                <tr key={v.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="p-4"><span className="font-mono font-bold text-foreground text-base tracking-wider">{v.placa}</span></td>
                  <td className="p-4"><p className="text-sm text-foreground">{v.marca ? `${v.marca} ` : ''}{v.modelo}</p></td>
                  <td className="p-4"><span className="text-sm text-muted-foreground">{v.cor || '—'}</span></td>
                  <td className="p-4"><span className="text-sm text-muted-foreground">{v.clientes?.nome || '—'}</span></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewVeiculo(v)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="stat-label">Placa *</Label>
                <Input value={form.placa} onChange={e => setField('placa', e.target.value.toUpperCase())} placeholder="ABC1D23" maxLength={7} className="font-mono uppercase" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Modelo *</Label>
                <Input value={form.modelo} onChange={e => setField('modelo', e.target.value)} placeholder="Ex: Civic" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Marca</Label>
                <Input value={form.marca} onChange={e => setField('marca', e.target.value)} placeholder="Ex: Honda" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Cor</Label>
                <Input value={form.cor} onChange={e => setField('cor', e.target.value)} placeholder="Ex: Preto" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setField('categoria', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carro">Carro</SelectItem>
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="caminhonete">Caminhonete</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Proprietário</Label>
                <Select value={form.cliente_id} onValueChange={v => setField('cliente_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {clientes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="stat-label">Observação</Label>
                <Textarea value={form.observacao} onChange={e => setField('observacao', e.target.value)} placeholder="Observações..." rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : editId ? 'Atualizar' : 'Cadastrar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewVeiculo} onOpenChange={() => setViewVeiculo(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Veículo</DialogTitle>
          </DialogHeader>
          {viewVeiculo && (
            <div className="space-y-3 pt-2">
              {[
                ['Placa', viewVeiculo.placa],
                ['Modelo', viewVeiculo.modelo],
                ['Marca', viewVeiculo.marca],
                ['Cor', viewVeiculo.cor],
                ['Categoria', viewVeiculo.categoria],
                ['Proprietário', viewVeiculo.clientes?.nome],
                ['Observação', viewVeiculo.observacao],
              ].map(([label, value]) => (
                <div key={label as string} className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border/30 gap-0.5">
                  <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm text-foreground font-medium break-words">{(value as string) || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
