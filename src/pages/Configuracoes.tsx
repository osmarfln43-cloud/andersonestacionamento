import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useConfiguracoes } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import pixQrFallback from "@/assets/pix-qr-fallback.jpg";
import { Upload, ImageIcon, X } from "lucide-react";

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

function ReceiptPreview({ form }: { form: any }) {
  const nome = form.nome_estacionamento || 'ME PARK ESTACIONAMENTO';
  const disclaimer = form.disclaimer_comprovante || 'NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO';
  const dias = (form.dias_funcionamento || 'Segunda a Sexta').toUpperCase();
  const abertura = form.horario_abertura || '07:00';
  const fechamento = form.horario_fechamento || '19:00';
  const endereco = (form.endereco || '').toUpperCase();
  const mensagem = form.mensagem_comprovante || 'ME PARK AGRADECE A PREFERÊNCIA';
  const valorHora = Number(form.valor_hora || 10).toFixed(2);
  const chavePix = form.chave_pix || '';
  const pixCode = chavePix
    ? `00020126580014br.gov.bcb.pix0136${chavePix}5204000053039865802BR5913ME PARK AI6008SAOPAULO`
    : '';

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="bg-[#f5f0e8] text-[#1a1a1a] rounded-xl shadow-xl overflow-hidden max-w-[300px] mx-auto" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
      <div className="p-5 space-y-2.5 text-[10px] leading-relaxed">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-bold tracking-wide">{nome}</p>
          <div className="border-b border-dashed border-gray-400 my-2" />
          <p className="text-[8px] leading-snug">{disclaimer}. HORARIO DE FUNCIONAMENTO {dias} DAS {abertura} ATE AS {fechamento}</p>
          <div className="border-b border-dashed border-gray-400 my-2" />
        </div>

        {/* Plate */}
        <div className="text-center py-1">
          <p className="text-xl font-bold tracking-widest">ABC1D23</p>
          <p className="text-[9px] font-bold mt-0.5">(HONDA CIVIC PRETO)</p>
        </div>
        <div className="border-b border-dashed border-gray-400" />

        {/* Details */}
        <div className="space-y-1 py-1">
          <div className="flex justify-between"><span>Entrada:</span><span>{dateStr} as {timeStr}</span></div>
          <div className="flex justify-between"><span>Tabela:</span><span>Avulso</span></div>
          <div className="flex justify-between"><span>Valor/hora:</span><span>R$ {valorHora}</span></div>
        </div>
        <div className="border-b border-dashed border-gray-400" />

        {/* Payment highlight */}
        <div className="text-center py-1">
          <p className="text-xs font-bold tracking-wide">PAGAMENTO DINHEIRO OU PIX</p>
        </div>

        {/* QR Code - uploaded or generated */}
        <div className="flex justify-center py-2">
          {form.qr_code_url ? (
            <img src={form.qr_code_url} alt="QR Code PIX" className="w-[100px] h-[100px] object-contain" />
          ) : pixCode ? (
            <QRCodeSVG value={pixCode} size={100} level="M" />
          ) : (
            <img src={pixQrFallback} alt="QR Code" className="w-[100px] h-[100px] object-contain" />
          )}
        </div>

        {/* Payment highlight below */}
        <div className="text-center py-1">
          <p className="text-xs font-bold tracking-wide">PAGAMENTO DINHEIRO OU PIX</p>
        </div>
        <div className="border-b border-dashed border-gray-400" />

        {/* Footer */}
        <div className="text-center space-y-0.5 pt-1">
          <p className="font-bold text-[9px]">{mensagem}</p>
          {endereco && <p className="text-[8px]">{endereco}</p>}
        </div>
      </div>
    </div>
  );
}

export default function Configuracoes() {
  const { toast } = useToast();
  const { data: config, isLoading } = useConfiguracoes();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const save = async () => {
    const payload = {
      nome_estacionamento: form.nome_estacionamento || 'ME PARK ESTACIONAMENTO',
      cnpj: form.cnpj || null,
      endereco: form.endereco || null,
      telefone: form.telefone || null,
      valor_hora: Number(form.valor_hora ?? 10),
      tolerancia_minutos: Number(form.tolerancia_minutos ?? 15),
      valor_minimo: form.valor_minimo === '' || form.valor_minimo == null ? null : Number(form.valor_minimo),
      valor_maximo_diario: form.valor_maximo_diario === '' || form.valor_maximo_diario == null ? null : Number(form.valor_maximo_diario),
      chave_pix: form.chave_pix || null,
      tipo_chave_pix: form.tipo_chave_pix || null,
      nome_beneficiario: form.nome_beneficiario || null,
      mensagem_comprovante: form.mensagem_comprovante || 'ME PARK AGRADECE A PREFERÊNCIA',
      largura_papel: form.largura_papel || '80mm',
      horario_abertura: form.horario_abertura || '07:00',
      horario_fechamento: form.horario_fechamento || '19:00',
      dias_funcionamento: form.dias_funcionamento || 'Segunda a Sexta',
      disclaimer_comprovante: form.disclaimer_comprovante || 'NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO',
      qr_code_url: form.qr_code_url || null,
    } as any;

    if (!form.id) {
      const { error } = await (supabase.from('configuracoes') as any).insert(payload);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await (supabase.from('configuracoes') as any).update(payload).eq('id', form.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    }
    queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
    toast({ title: "✓ Configurações salvas" });
  };

  const setField = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleUploadQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `qrcode-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('qrcode-images').upload(filename, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('qrcode-images').getPublicUrl(filename);
      setField('qr_code_url', urlData.publicUrl);
      toast({ title: "✓ QR Code enviado!", description: "Salve as configurações para aplicar." });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) return <p className="text-center py-12 text-muted-foreground">Carregando...</p>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Gerencie todas as configurações do sistema e dos comprovantes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Form */}
        <div className="lg:col-span-2">
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
                    <Input value={form.dias_funcionamento || 'Segunda a Sexta'} onChange={e => setField('dias_funcionamento', e.target.value)} className="h-12" placeholder="Ex: Segunda a Sexta" />
                  </Field>
                </div>
              </Section>
              <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
            </TabsContent>

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

            <TabsContent value="pix" className="space-y-6">
              <Section title="Dados PIX (QR Code no Comprovante)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Chave PIX"><Input value={form.chave_pix || ''} onChange={e => setField('chave_pix', e.target.value)} className="h-12" /></Field>
                  <Field label="Tipo da Chave">
                    <Input value={form.tipo_chave_pix || ''} onChange={e => setField('tipo_chave_pix', e.target.value)} className="h-12" placeholder="email, cpf, telefone, aleatoria" />
                  </Field>
                  <Field label="Nome do Beneficiário"><Input value={form.nome_beneficiario || ''} onChange={e => setField('nome_beneficiario', e.target.value)} className="h-12" /></Field>
                </div>
                <p className="text-xs text-muted-foreground">A chave PIX será usada para gerar o QR Code no comprovante.</p>
              </Section>
              <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
            </TabsContent>

            <TabsContent value="comprovante" className="space-y-6">
              <Section title="Textos do Comprovante">
                <div className="grid grid-cols-1 gap-5">
                  <Field label="Aviso / Disclaimer (exibido abaixo do cabeçalho)">
                    <Textarea
                      value={form.disclaimer_comprovante || 'NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO'}
                      onChange={e => setField('disclaimer_comprovante', e.target.value)}
                      className="min-h-[80px] font-mono text-xs"
                    />
                  </Field>
                  <Field label="Mensagem de Rodapé">
                    <Input value={form.mensagem_comprovante || ''} onChange={e => setField('mensagem_comprovante', e.target.value)} className="h-12" placeholder="Ex: ME PARK AGRADECE A PREFERÊNCIA" />
                  </Field>
                </div>
              </Section>
              <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
            </TabsContent>

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

        {/* Right - Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="section-title text-sm">Preview em Tempo Real</span>
            </div>
            <ReceiptPreview form={form} />
            <p className="text-[10px] text-muted-foreground text-center">As alterações são refletidas aqui em tempo real. Salve para aplicar nos comprovantes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
