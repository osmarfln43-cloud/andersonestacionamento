import { Users, Search, Plus, Phone, Mail, Eye, Pencil, Trash2, X, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { useClientes } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type ClienteForm = {
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  tipo: string;
  status: string;
  endereco: string;
  observacao: string;
  valor_mensal: string;
  placa_veiculo: string;
  vencimento: Date | undefined;
};

const emptyForm: ClienteForm = { nome: '', cpf_cnpj: '', telefone: '', email: '', tipo: 'eventual', status: 'ativo', endereco: '', observacao: '', valor_mensal: '', placa_veiculo: '', vencimento: undefined };

export default function Clientes() {
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ClienteForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewCliente, setViewCliente] = useState<any>(null);

  const { data: clientes = [], isLoading } = useClientes();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filtered = clientes.filter((c: any) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.cpf_cnpj || '').includes(busca) ||
    (c.telefone || '').includes(busca)
  );

  const stats = {
    total: clientes.length,
    ativos: clientes.filter((c: any) => c.status === 'ativo').length,
    mensalistas: clientes.filter((c: any) => c.tipo === 'mensalista').length,
    eventuais: clientes.filter((c: any) => c.tipo === 'eventual').length,
  };

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setForm({ nome: c.nome, cpf_cnpj: c.cpf_cnpj || '', telefone: c.telefone || '', email: c.email || '', tipo: c.tipo, status: c.status, endereco: c.endereco || '', observacao: c.observacao || '', valor_mensal: '', placa_veiculo: '', vencimento: undefined });
    setEditId(c.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    if (form.tipo === 'mensalista' && !editId && (!form.valor_mensal || Number(form.valor_mensal) <= 0)) {
      toast({ title: "Informe o valor mensal", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const payload = { nome: form.nome, cpf_cnpj: form.cpf_cnpj || null, telefone: form.telefone || null, email: form.email || null, tipo: form.tipo, status: form.status, endereco: form.endereco || null, observacao: form.observacao || null };
      if (editId) {
        const { error } = await supabase.from('clientes').update(payload).eq('id', editId);
        if (error) throw error;
        toast({ title: "Cliente atualizado!" });
      } else {
        const { data: newCliente, error } = await supabase.from('clientes').insert(payload).select().single();
        if (error) throw error;
        // If mensalista, create vehicle + mensalista record
        if (form.tipo === 'mensalista' && newCliente) {
          let veiculoId: string | null = null;
          if (form.placa_veiculo.trim()) {
            const placaUpper = form.placa_veiculo.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const { data: veiculo } = await supabase.from('veiculos').insert({
              placa: placaUpper,
              modelo: 'N/I',
              cliente_id: newCliente.id,
            }).select().single();
            veiculoId = veiculo?.id || null;
          }
          const vencimento = form.vencimento || new Date(Date.now() + 30 * 86400000);
          await supabase.from('mensalistas').insert({
            cliente_id: newCliente.id,
            veiculo_id: veiculoId,
            valor_mensal: Number(form.valor_mensal),
            vencimento: vencimento.toISOString().split('T')[0],
            plano: 'Mensal Integral',
            status: 'ativo',
          });
          queryClient.invalidateQueries({ queryKey: ['veiculos'] });
        }
        toast({ title: "Cliente cadastrado!" });
      }
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['mensalistas'] });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cliente excluído" });
    queryClient.invalidateQueries({ queryKey: ['clientes'] });
  };

  const setField = (k: keyof ClienteForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{stats.total} clientes cadastrados</p>
        </div>
        <Button className="gap-2 h-11 px-6 rounded-xl" onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Ativos', value: stats.ativos, color: 'text-accent' },
          { label: 'Mensalistas', value: stats.mensalistas, color: 'text-primary' },
          { label: 'Eventuais', value: stats.eventuais, color: 'text-muted-foreground' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <p className="stat-label">{s.label}</p>
            <p className={`stat-value mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF ou telefone..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-11 h-12 text-base border-0 bg-transparent" />
        </div>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</p>
        ) : filtered.map((c: any) => (
          <div key={c.id} className="glass-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {c.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{c.nome}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.cpf_cnpj || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setViewCliente(c)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><Eye className="h-4 w-4" /></button>
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {c.telefone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefone}</span>}
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${c.tipo === 'mensalista' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{c.tipo}</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${c.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
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
                <th className="text-left p-4 stat-label">Contato</th>
                <th className="text-left p-4 stat-label">Tipo</th>
                <th className="text-left p-4 stat-label">Status</th>
                <th className="text-right p-4 stat-label">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado</td></tr>
              ) : filtered.map((c: any) => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {c.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{c.nome}</p>
                        <p className="text-xs text-muted-foreground font-mono">{c.cpf_cnpj || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {c.telefone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.telefone}</p>}
                      {c.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email}</p>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${c.tipo === 'mensalista' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{c.tipo}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-lg ${c.status === 'ativo' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewCliente(c)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto sm:top-[5%] sm:translate-y-0" style={{ top: '5%', transform: 'translateX(-50%)' }}>
          <DialogHeader className="sticky top-0 bg-background z-10 pb-2">
            <DialogTitle>{editId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="stat-label">Nome *</Label>
                <Input value={form.nome} onChange={e => setField('nome', e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">CPF/CNPJ</Label>
                <Input value={form.cpf_cnpj} onChange={e => setField('cpf_cnpj', e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Telefone</Label>
                <Input value={form.telefone} onChange={e => setField('telefone', e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">E-mail</Label>
                <Input value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setField('tipo', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eventual">Eventual</SelectItem>
                    <SelectItem value="mensalista">Mensalista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.tipo === 'mensalista' && !editId && (
                <>
                  <div className="space-y-2">
                    <Label className="stat-label">Valor Mensal (R$) *</Label>
                    <Input
                      type="number"
                      value={form.valor_mensal}
                      onChange={e => setField('valor_mensal', e.target.value)}
                      placeholder="Ex: 350.00"
                      className="h-12 font-mono text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="stat-label">Placa do Veículo</Label>
                    <Input
                      value={form.placa_veiculo}
                      onChange={e => setField('placa_veiculo', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
                      placeholder="ABC1D23"
                      className="h-12 font-mono text-lg tracking-widest uppercase"
                      maxLength={7}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="stat-label">Data de Vencimento *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-12 justify-start text-left font-mono text-base", !form.vencimento && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.vencimento ? format(form.vencimento, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data de vencimento"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                        <Calendar
                          mode="single"
                          selected={form.vencimento}
                          onSelect={(date) => setForm(prev => ({ ...prev, vencimento: date || undefined }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label className="stat-label">Status</Label>
                <Select value={form.status} onValueChange={v => setField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="stat-label">Endereço</Label>
                <Input value={form.endereco} onChange={e => setField('endereco', e.target.value)} placeholder="Endereço completo" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="stat-label">Observação</Label>
                <Textarea value={form.observacao} onChange={e => setField('observacao', e.target.value)} placeholder="Observações..." rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-background pb-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewCliente} onOpenChange={() => setViewCliente(null)}>
        <DialogContent className="max-w-md" style={{ top: '5%', transform: 'translateX(-50%)' }}>
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {viewCliente && (
            <div className="space-y-3 pt-2">
              {[
                ['Nome', viewCliente.nome],
                ['CPF/CNPJ', viewCliente.cpf_cnpj],
                ['Telefone', viewCliente.telefone],
                ['E-mail', viewCliente.email],
                ['Tipo', viewCliente.tipo],
                ['Status', viewCliente.status],
                ['Endereço', viewCliente.endereco],
                ['Observação', viewCliente.observacao],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm text-foreground font-medium">{(value as string) || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
