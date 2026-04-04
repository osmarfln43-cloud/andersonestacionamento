import { CalendarCheck, Search, Plus, AlertTriangle, DollarSign, Users, Clock, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMensalistas, useClientes, useVeiculos } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Mensalistas() {
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ cliente_id: '', veiculo_id: '', plano: 'Mensal Integral', valor_mensal: '', vencimento: '', status: 'ativo' });
  const [saving, setSaving] = useState(false);

  const { data: mensalistas = [], isLoading } = useMensalistas();
  const { data: clientes = [] } = useClientes();
  const { data: veiculos = [] } = useVeiculos();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filtered = mensalistas.filter((m: any) =>
    (m.clientes?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (m.veiculos?.placa || '').includes(busca.toUpperCase())
  );

  const ativos = mensalistas.filter((m: any) => m.status === 'ativo').length;
  const atrasados = mensalistas.filter((m: any) => m.status === 'atrasado').length;
  const receita = mensalistas.filter((m: any) => m.status === 'ativo').reduce((s: number, m: any) => s + Number(m.valor_mensal), 0);

  const openNew = () => { setForm({ cliente_id: '', veiculo_id: '', plano: 'Mensal Integral', valor_mensal: '', vencimento: '', status: 'ativo' }); setEditId(null); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.cliente_id || !form.valor_mensal || !form.vencimento) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { ...form, valor_mensal: Number(form.valor_mensal), veiculo_id: form.veiculo_id || null };
      if (editId) {
        const { error } = await supabase.from('mensalistas').update(payload).eq('id', editId);
        if (error) throw error;
        toast({ title: "Mensalista atualizado!" });
      } else {
        const { error } = await supabase.from('mensalistas').insert(payload);
        if (error) throw error;
        toast({ title: "Mensalista cadastrado!" });
      }
      queryClient.invalidateQueries({ queryKey: ['mensalistas'] });
      setDialogOpen(false);
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este mensalista?')) return;
    const { error } = await supabase.from('mensalistas').delete().eq('id', id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Mensalista excluído" });
    queryClient.invalidateQueries({ queryKey: ['mensalistas'] });
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-primary" />
            </div>
            Mensalistas
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{mensalistas.length} contratos</p>
        </div>
        <Button className="gap-2 h-11 px-6 rounded-xl" onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo Mensalista
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5"><div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-accent" /><p className="stat-label">Ativos</p></div><p className="stat-value text-accent">{ativos}</p></div>
        <div className="glass-card p-5"><div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-destructive" /><p className="stat-label">Em Atraso</p></div><p className="stat-value text-destructive">{atrasados}</p></div>
        <div className="glass-card p-5"><div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-accent" /><p className="stat-label">Receita Recorrente</p></div><p className="stat-value text-accent">R$ {receita.toLocaleString()}</p></div>
        <div className="glass-card p-5"><div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-primary" /><p className="stat-label">Total</p></div><p className="stat-value text-primary">{mensalistas.length}</p></div>
      </div>

      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou placa..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base border-0 bg-transparent" />
        </div>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum mensalista encontrado</p>
        ) : filtered.map((m: any) => (
          <div key={m.id} className="glass-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {(m.clientes?.nome || '?').charAt(0)}
                </div>
                <span className="font-medium text-foreground text-sm">{m.clientes?.nome || '—'}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setForm({ cliente_id: m.cliente_id, veiculo_id: m.veiculo_id || '', plano: m.plano, valor_mensal: String(m.valor_mensal), vencimento: m.vencimento, status: m.status }); setEditId(m.id); setDialogOpen(true); }} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span className="text-muted-foreground">Placa:</span>
              <span className="font-mono font-bold text-foreground">{m.veiculos?.placa || '—'}</span>
              <span className="text-muted-foreground">Plano:</span>
              <span className="text-foreground">{m.plano}</span>
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-bold text-foreground">R$ {Number(m.valor_mensal)}</span>
              <span className="text-muted-foreground">Vencimento:</span>
              <span className="font-mono text-foreground">{m.vencimento}</span>
              <span className="text-muted-foreground">Status:</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg w-fit ${m.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>{m.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="glass-card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 stat-label">Cliente</th>
                <th className="text-left p-4 stat-label">Placa</th>
                <th className="text-left p-4 stat-label">Plano</th>
                <th className="text-left p-4 stat-label">Valor</th>
                <th className="text-left p-4 stat-label">Vencimento</th>
                <th className="text-left p-4 stat-label">Status</th>
                <th className="text-right p-4 stat-label">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum mensalista encontrado</td></tr>
              ) : filtered.map((m: any) => (
                <tr key={m.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {(m.clientes?.nome || '?').charAt(0)}
                      </div>
                      <span className="font-medium text-foreground text-sm">{m.clientes?.nome || '—'}</span>
                    </div>
                  </td>
                  <td className="p-4"><span className="font-mono font-bold text-foreground tracking-wide">{m.veiculos?.placa || '—'}</span></td>
                  <td className="p-4"><span className="text-sm text-muted-foreground">{m.plano}</span></td>
                  <td className="p-4"><span className="font-display font-bold text-foreground">R$ {Number(m.valor_mensal)}</span></td>
                  <td className="p-4"><span className="text-sm font-mono text-muted-foreground">{m.vencimento}</span></td>
                  <td className="p-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${m.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>{m.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setForm({ cliente_id: m.cliente_id, veiculo_id: m.veiculo_id || '', plano: m.plano, valor_mensal: String(m.valor_mensal), vencimento: m.vencimento, status: m.status }); setEditId(m.id); setDialogOpen(true); }} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" style={{ top: '5%', transform: 'translateX(-50%)' }}>
          <DialogHeader><DialogTitle>{editId ? 'Editar Mensalista' : 'Novo Mensalista'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="stat-label">Cliente *</Label>
                <Select value={form.cliente_id} onValueChange={v => setForm(p => ({ ...p, cliente_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clientes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Veículo</Label>
                <Select value={form.veiculo_id} onValueChange={v => setForm(p => ({ ...p, veiculo_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {veiculos.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.placa} - {v.modelo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Plano</Label>
                <Select value={form.plano} onValueChange={v => setForm(p => ({ ...p, plano: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensal Integral">Mensal Integral</SelectItem>
                    <SelectItem value="Mensal Noturno">Mensal Noturno</SelectItem>
                    <SelectItem value="Mensal VIP">Mensal VIP</SelectItem>
                    <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Valor Mensal (R$) *</Label>
                <Input type="number" value={form.valor_mensal} onChange={e => setForm(p => ({ ...p, valor_mensal: e.target.value }))} placeholder="350" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Vencimento *</Label>
                <Input type="date" value={form.vencimento} onChange={e => setForm(p => ({ ...p, vencimento: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : editId ? 'Atualizar' : 'Cadastrar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
