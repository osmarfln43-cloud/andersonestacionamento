import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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
  const save = () => toast({ title: "✓ Configurações salvas" });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Gerencie todas as configurações do sistema</p>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/50 p-1 h-auto flex-wrap">
          {['Geral', 'Cobrança', 'PIX', 'Impressão', 'Clientes', 'Mensalistas'].map((t) => (
            <TabsTrigger
              key={t}
              value={t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5 px-4"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <Section title="Dados da Empresa">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Nome do Estacionamento"><Input defaultValue="ME PARK AI" className="h-12" /></Field>
              <Field label="CNPJ"><Input defaultValue="12.345.678/0001-00" className="h-12 font-mono" /></Field>
              <Field label="Endereço"><Input defaultValue="Rua Principal, 100 - Centro" className="h-12" /></Field>
              <Field label="Telefone"><Input defaultValue="(11) 3000-0000" className="h-12" /></Field>
            </div>
          </Section>
          <Section title="Logo">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground text-xs">Logo</div>
              <Button variant="outline" className="rounded-xl">Upload</Button>
            </div>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar Configurações</Button>
        </TabsContent>

        <TabsContent value="cobranca" className="space-y-6">
          <Section title="Regras de Cobrança">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Valor por Hora (R$)"><Input type="number" defaultValue="12" className="h-12 font-mono" /></Field>
              <Field label="Tolerância Gratuita (minutos)"><Input type="number" defaultValue="15" className="h-12 font-mono" /></Field>
              <Field label="Valor Mínimo (R$)"><Input type="number" defaultValue="6" className="h-12 font-mono" /></Field>
              <Field label="Valor Máximo Diário (R$)"><Input type="number" defaultValue="60" className="h-12 font-mono" /></Field>
            </div>
          </Section>
          <Section title="Arredondamento">
            <div className="grid grid-cols-2 gap-3">
              {['Por minuto', 'Bloco 15 min', 'Bloco 30 min', 'Hora cheia'].map((r) => (
                <button key={r} className="h-12 rounded-xl border-2 border-border text-sm font-medium hover:border-primary/30 transition-colors first:border-primary first:bg-primary/[0.06] first:text-primary">
                  {r}
                </button>
              ))}
            </div>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        <TabsContent value="pix" className="space-y-6">
          <Section title="Dados PIX">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Chave PIX"><Input defaultValue="mepark@estacionamento.com.br" className="h-12" /></Field>
              <Field label="Tipo da Chave">
                <div className="grid grid-cols-4 gap-2">
                  {['E-mail', 'CPF/CNPJ', 'Telefone', 'Aleatória'].map((t) => (
                    <button key={t} className="py-2.5 rounded-xl border-2 border-border text-xs font-medium hover:border-primary/30 transition-colors first:border-primary first:bg-primary/[0.06] first:text-primary">
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Nome do Beneficiário"><Input defaultValue="ME PARK ESTACIONAMENTO LTDA" className="h-12" /></Field>
              <Field label="Cidade"><Input defaultValue="São Paulo" className="h-12" /></Field>
            </div>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        <TabsContent value="impressao" className="space-y-6">
          <Section title="Configuração de Impressão">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Largura do Papel">
                <div className="grid grid-cols-2 gap-3">
                  {['58mm', '80mm'].map((w) => (
                    <button key={w} className="h-12 rounded-xl border-2 border-border text-sm font-medium hover:border-primary/30 transition-colors first:border-primary first:bg-primary/[0.06] first:text-primary">
                      {w}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Mensagem do Rodapé"><Input defaultValue="Obrigado pela preferência!" className="h-12" /></Field>
            </div>
          </Section>
          <Section title="Dados no Comprovante">
            <div className="space-y-3">
              {['Placa', 'Modelo', 'Cor', 'Horário Entrada/Saída', 'Tempo Total', 'Valor', 'QR Code PIX', 'Nome da Unidade'].map((item) => (
                <label key={item} className="flex items-center gap-3 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border bg-secondary accent-primary" />
                  {item}
                </label>
              ))}
            </div>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-6">
          <Section title="Campos Obrigatórios no Cadastro">
            <div className="space-y-3">
              {['Nome Completo', 'CPF/CNPJ', 'Telefone', 'E-mail', 'Endereço'].map((item, i) => (
                <label key={item} className="flex items-center gap-3 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" defaultChecked={i < 3} className="h-4 w-4 rounded border-border bg-secondary accent-primary" />
                  {item}
                </label>
              ))}
            </div>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        <TabsContent value="mensalistas" className="space-y-6">
          <Section title="Regras de Mensalistas">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Planos Disponíveis">
                <div className="space-y-2">
                  {['Mensal Integral', 'Mensal Noturno', 'Mensal VIP', 'Quinzenal'].map((p) => (
                    <div key={p} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                      <span className="text-sm text-foreground flex-1">{p}</span>
                      <span className="text-xs text-muted-foreground">Ativo</span>
                    </div>
                  ))}
                </div>
              </Field>
              <div className="space-y-5">
                <Field label="Saída sem Cobrança">
                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2.5 rounded-xl border-2 border-primary bg-primary/[0.06] text-primary text-xs font-medium">Sim</button>
                    <button className="py-2.5 rounded-xl border-2 border-border text-xs font-medium text-muted-foreground">Não</button>
                  </div>
                </Field>
                <Field label="Dias de Tolerância Após Vencimento"><Input type="number" defaultValue="5" className="h-12 font-mono" /></Field>
              </div>
            </div>
          </Section>
          <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
