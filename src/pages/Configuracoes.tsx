import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const { toast } = useToast();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" /> Configurações
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="bg-secondary">
          {['Geral', 'Cobrança', 'PIX', 'Impressão', 'Unidade'].map((t) => (
            <TabsTrigger key={t} value={t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="geral" className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Estacionamento</Label>
              <Input defaultValue="ME PARK AI" />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input defaultValue="12.345.678/0001-00" />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input defaultValue="Rua Principal, 100 - Centro" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input defaultValue="(11) 3000-0000" />
            </div>
          </div>
          <Button onClick={() => toast({ title: "Configurações salvas!" })} className="gap-2"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        <TabsContent value="cobranca" className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor por Hora (R$)</Label>
              <Input type="number" defaultValue="12" />
            </div>
            <div className="space-y-2">
              <Label>Tolerância (minutos)</Label>
              <Input type="number" defaultValue="15" />
            </div>
            <div className="space-y-2">
              <Label>Valor Mínimo (R$)</Label>
              <Input type="number" defaultValue="6" />
            </div>
            <div className="space-y-2">
              <Label>Valor Máximo Diário (R$)</Label>
              <Input type="number" defaultValue="60" />
            </div>
          </div>
          <Button onClick={() => toast({ title: "Configurações de cobrança salvas!" })} className="gap-2"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        <TabsContent value="pix" className="glass-card p-6 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input defaultValue="mepark@estacionamento.com.br" />
            </div>
            <div className="space-y-2">
              <Label>Nome do Beneficiário</Label>
              <Input defaultValue="ME PARK ESTACIONAMENTO LTDA" />
            </div>
          </div>
          <Button onClick={() => toast({ title: "Configurações PIX salvas!" })} className="gap-2"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        <TabsContent value="impressao" className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Largura do Papel</Label>
              <div className="flex gap-2">
                {['58mm', '80mm'].map((w) => (
                  <button key={w} className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mensagem do Rodapé</Label>
              <Input defaultValue="Obrigado pela preferência!" />
            </div>
          </div>
          <Button onClick={() => toast({ title: "Configurações de impressão salvas!" })} className="gap-2"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>

        <TabsContent value="unidade" className="glass-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Unidade</Label>
              <Input defaultValue="ME PARK Centro" />
            </div>
            <div className="space-y-2">
              <Label>Capacidade de Vagas</Label>
              <Input type="number" defaultValue="50" />
            </div>
          </div>
          <Button onClick={() => toast({ title: "Configurações da unidade salvas!" })} className="gap-2"><Save className="h-4 w-4" /> Salvar</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
