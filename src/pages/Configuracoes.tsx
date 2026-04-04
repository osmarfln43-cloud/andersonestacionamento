import { Settings, Save, Clock, Receipt, CreditCard, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useConfiguracoes } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 space-y-5">
      <h3 className="section-title">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="stat-label">{label}</Label>
      {children}
    </div>
  );
}

export default function Configuracoes() {
  const { toast } = useToast();
  const { data: config, isLoading } = useConfiguracoes();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const save = async () => {
    if (!form.id) {
      const { error } = await supabase.from('configuracoes').insert(form);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from('configuracoes').update(form).eq('id', form.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    }
    queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
    toast({ title: "✓ Configurações salvas" });
  };

  const setField = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  if (isLoading) return <p className="text-center py-12 text-muted-foreground">Carregando...</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Gerencie todas as configurações do sistema e dos comprovantes</p>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50 p-1 h-auto flex-wrap">
          {[
            { label: 'Geral', value: 'geral' },
            { label: 'Horários', value: 'horarios' },
            { label: 'Cobrança', value: 'cobranca' },
            { label: 'PIX / QR Code', value: 'pix' },
            { label: 'Comprovante', value: 'comprovante' },
            { label: 'Impressão', value: 'impressao' },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 px-4"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* GERAL */}
        <TabsContent value="geral" className="space-y-6">
          <Section title="Dados da Empresa">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Nome do Estacionamento"><Input value={form.nome_estacionamento || ''} onChange={e => setField('nome_estacionamento', e.target.value)} className="h-12" /></Field>
              <Field label="CNPJ"><Input value={form.cnpj || ''} onChange={e => setField('cnpj', e.target.value)} className="h-12 font-mono" /></Field>
              <Field label="Endereço"><Input value={form.endereco || ''} onChange={e => setField('endereco', e.target.value)} className="h-12" /></Field>
              <Field label="Telefone"><Input value={form.telefone || ''} onChange={e => setField('telefone', e.target.value)} className="h-12" /></Field>
            </div>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar Configurações</Button>
        </TabsContent>

        {/* HORÁRIOS */}
        <TabsContent value="horarios" className="space-y-6">
          <Section title="Horário de Funcionamento">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Horário de Abertura">
                <Input type="time" value={form.horario_abertura || '07:00'} onChange={e => setField('horario_abertura', e.target.value)} className="h-12 font-mono" />
              </Field>
              <Field label="Horário de Fechamento">
                <Input type="time" value={form.horario_fechamento || '19:00'} onChange={e => setField('horario_fechamento', e.target.value)} className="h-12 font-mono" />
              </Field>
              <Field label="Dias de Funcionamento">
                <Input value={form.dias_funcionamento || 'Segunda a Sexta'} onChange={e => setField('dias_funcionamento', e.target.value)} className="h-12" placeholder="Ex: Segunda a Sexta, Segunda a Sábado" />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">Esses horários aparecerão no comprovante de entrada e saída.</p>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        {/* COBRANÇA */}
        <TabsContent value="cobranca" className="space-y-6">
          <Section title="Regras de Cobrança">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Valor por Hora (R$)"><Input type="number" value={form.valor_hora ?? ''} onChange={e => setField('valor_hora', Number(e.target.value))} className="h-12 font-mono" /></Field>
              <Field label="Tolerância (minutos)"><Input type="number" value={form.tolerancia_minutos ?? ''} onChange={e => setField('tolerancia_minutos', Number(e.target.value))} className="h-12 font-mono" /></Field>
              <Field label="Valor Mínimo (R$)"><Input type="number" value={form.valor_minimo ?? ''} onChange={e => setField('valor_minimo', Number(e.target.value))} className="h-12 font-mono" /></Field>
              <Field label="Valor Máximo Diário (R$)"><Input type="number" value={form.valor_maximo_diario ?? ''} onChange={e => setField('valor_maximo_diario', Number(e.target.value))} className="h-12 font-mono" /></Field>
            </div>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        {/* PIX / QR CODE */}
        <TabsContent value="pix" className="space-y-6">
          <Section title="Dados PIX (QR Code no Comprovante)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Chave PIX"><Input value={form.chave_pix || ''} onChange={e => setField('chave_pix', e.target.value)} className="h-12" /></Field>
              <Field label="Tipo da Chave">
                <Input value={form.tipo_chave_pix || ''} onChange={e => setField('tipo_chave_pix', e.target.value)} className="h-12" placeholder="email, cpf, telefone, aleatoria" />
              </Field>
              <Field label="Nome do Beneficiário"><Input value={form.nome_beneficiario || ''} onChange={e => setField('nome_beneficiario', e.target.value)} className="h-12" /></Field>
            </div>
            <p className="text-xs text-muted-foreground">A chave PIX será usada para gerar o QR Code no comprovante. Altere aqui para atualizar o QR Code.</p>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        {/* COMPROVANTE */}
        <TabsContent value="comprovante" className="space-y-6">
          <Section title="Textos do Comprovante">
            <div className="grid grid-cols-1 gap-5">
              <Field label="Aviso / Disclaimer (exibido abaixo do cabeçalho)">
                <Textarea 
                  value={form.disclaimer_comprovante || 'NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO'} 
                  onChange={e => setField('disclaimer_comprovante', e.target.value)} 
                  className="min-h-[80px] font-mono text-xs"
                  placeholder="Ex: NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS..."
                />
              </Field>
              <Field label="Mensagem de Rodapé">
                <Input value={form.mensagem_comprovante || ''} onChange={e => setField('mensagem_comprovante', e.target.value)} className="h-12" placeholder="Ex: ME PARK AGRADECE A PREFERÊNCIA" />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">Todos os textos serão exibidos no comprovante PDF. Altere aqui para personalizar.</p>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        {/* IMPRESSÃO */}
        <TabsContent value="impressao" className="space-y-6">
          <Section title="Configuração de Impressão">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Largura do Papel"><Input value={form.largura_papel || ''} onChange={e => setField('largura_papel', e.target.value)} className="h-12" placeholder="80mm" /></Field>
            </div>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
