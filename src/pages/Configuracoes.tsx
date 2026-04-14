import { Settings, Save, Printer, Usb, Wifi, Check, AlertCircle, RefreshCw } from "lucide-react";
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
import {
  isWebUSBSupported, requestUSBPrinter, getConnectedUSBPrinters,
  getSavedPrinterConfig, savePrinterConfig, clearPrinterConfig,
  printTestPage, type PrinterConfig,
} from "@/lib/printer";

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
  const nome = form.nome_estacionamento || 'ANDERSON ESTACIONAMENTO';
  const disclaimer = form.disclaimer_comprovante || 'NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO';
  const dias = (form.dias_funcionamento || 'Segunda a Sexta').toUpperCase();
  const abertura = form.horario_abertura || '07:00';
  const fechamento = form.horario_fechamento || '19:00';
  const endereco = (form.endereco || '').toUpperCase();
  const mensagem = form.mensagem_comprovante || 'ANDERSON ESTACIONAMENTO AGRADECE A PREFERÊNCIA';
  const valorHora = Number(form.valor_hora || 10).toFixed(2);
  const chavePix = form.chave_pix || '';
  const pixCode = chavePix
    ? `00020126580014br.gov.bcb.pix0136${chavePix}5204000053039865802BR5925ANDERSON ESTACIONAMENTO6008SAOPAULO`
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
          {form.cnpj && <p className="text-[8px]">CNPJ: {form.cnpj}</p>}
        </div>
      </div>
    </div>
  );
}

function ExitReceiptPreview({ form }: { form: any }) {
  const nome = form.nome_estacionamento || 'ANDERSON ESTACIONAMENTO';
  const disclaimer = form.disclaimer_comprovante || 'NAO NOS RESPONSABILIZAMOS POR OBJETOS DEIXADOS NO INTERIOR DO VEICULO';
  const dias = (form.dias_funcionamento || 'Seg-Sex').toUpperCase();
  const abertura = form.horario_abertura || '07:00';
  const fechamento = form.horario_fechamento || '19:00';
  const endereco = (form.endereco || '').toUpperCase();
  const mensagem = form.mensagem_comprovante || 'AGRADECEMOS A PREFERENCIA';
  const valorHora = Number(form.valor_hora || 10).toFixed(2);

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Simulated exit 2h30 later
  const exitTime = new Date(now.getTime() + 2.5 * 3600000);
  const exitDateStr = exitTime.toLocaleDateString('pt-BR');
  const exitTimeStr = exitTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-[#f5f0e8] text-[#1a1a1a] rounded-xl shadow-xl overflow-hidden max-w-[280px] mx-auto" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
      <div className="p-4 space-y-1.5 text-[9px] leading-relaxed">
        <div className="text-center space-y-0.5">
          <p className="text-[11px] font-bold tracking-wide">{nome}</p>
          <div className="border-b border-dashed border-gray-400 my-1.5" />
          <p className="text-[7px] leading-snug">{disclaimer}. {dias} {abertura}-{fechamento}</p>
          <div className="border-b border-dashed border-gray-400 my-1.5" />
        </div>

        <p className="text-[10px] font-bold text-center">COMPROVANTE DE SAIDA</p>

        <div className="text-center py-0.5">
          <p className="text-lg font-bold tracking-widest">ABC1D23</p>
          <p className="text-[8px] font-bold">(HONDA CIVIC PRETO)</p>
        </div>
        <div className="border-b border-dashed border-gray-400" />

        <div className="space-y-0.5">
          <div className="flex justify-between"><span>Entrada:</span><span>{dateStr} {timeStr}</span></div>
          <div className="flex justify-between"><span>Saida:</span><span>{exitDateStr} {exitTimeStr}</span></div>
          <div className="flex justify-between"><span>Permanencia:</span><span className="font-bold">2h 30min</span></div>
          <div className="flex justify-between"><span>Tabela:</span><span>Avulso</span></div>
          <div className="flex justify-between"><span>Cobranca:</span><span className="font-bold">3 HORAS</span></div>
          <div className="flex justify-between"><span>Valor/hora:</span><span>R$ {valorHora}</span></div>
          <div className="flex justify-between"><span>Pagamento:</span><span className="font-bold">DINHEIRO</span></div>
        </div>
        <div className="border-b border-dashed border-gray-400" />

        <div className="text-center">
          <p className="text-[10px] font-bold">TOTAL</p>
          <p className="text-base font-bold">R$ 30.00</p>
        </div>
        <div className="border-b border-dashed border-gray-400" />

        <div className="text-center space-y-0.5">
          <p className="font-bold text-[8px]">{mensagem}</p>
          {endereco && <p className="text-[7px]">{endereco}</p>}
          {form.cnpj && <p className="text-[7px]">CNPJ: {form.cnpj}</p>}
        </div>
      </div>
    </div>
  );

function PrinterSetup({ form, setField, save }: { form: any; setField: (k: string, v: any) => void; save: () => void }) {
  const { toast } = useToast();
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(getSavedPrinterConfig());
  const [usbDevices, setUsbDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [testing, setTesting] = useState(false);
  const webUSBAvailable = isWebUSBSupported();

  const scanDevices = async () => {
    setScanning(true);
    try {
      const devices = await getConnectedUSBPrinters();
      setUsbDevices(devices);
      if (devices.length > 0) {
        toast({ title: `✓ ${devices.length} dispositivo(s) encontrado(s)` });
      } else {
        toast({ title: "Nenhum dispositivo USB encontrado", description: "Conecte a impressora e tente novamente" });
      }
    } catch {
      toast({ title: "Erro ao buscar dispositivos", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const connectUSB = async () => {
    if (!webUSBAvailable) {
      toast({ 
        title: "WebUSB não suportado", 
        description: "Use o Chrome/Edge em HTTPS para conectar via USB", 
        variant: "destructive" 
      });
      return;
    }
    try {
      const device = await requestUSBPrinter();
      if (device) {
        const config: PrinterConfig = {
          name: device.productName || `USB Printer (${device.vendorId?.toString(16)}:${device.productId?.toString(16)})`,
          type: 'usb',
          paperWidth: (form.largura_papel === '58mm' ? '58mm' : '80mm') as '58mm' | '80mm',
          vendorId: device.vendorId,
          productId: device.productId,
        };
        savePrinterConfig(config);
        setPrinterConfig(config);
        setUsbDevices(await getConnectedUSBPrinters());
        toast({ title: "✓ Impressora conectada!", description: config.name });
      } else {
        toast({ title: "Nenhuma impressora selecionada", description: "Selecione um dispositivo USB na janela do navegador" });
      }
    } catch (err: any) {
      console.error('[Printer] Erro ao conectar:', err);
      toast({ title: "Erro ao conectar", description: err?.message || "Tente novamente", variant: "destructive" });
    }
  };

  const useBrowserPrint = () => {
    const config: PrinterConfig = {
      name: 'Impressão via Navegador',
      type: 'browser',
      paperWidth: (form.largura_papel === '58mm' ? '58mm' : '80mm') as '58mm' | '80mm',
    };
    savePrinterConfig(config);
    setPrinterConfig(config);
    toast({ title: "✓ Modo navegador ativado", description: "A impressão usará o diálogo do navegador" });
  };

  const disconnectPrinter = () => {
    clearPrinterConfig();
    setPrinterConfig(null);
    toast({ title: "Impressora desconectada" });
  };

  const testPrint = async () => {
    setTesting(true);
    try {
      if (printerConfig?.type === 'usb') {
        const success = await printTestPage(printerConfig.paperWidth);
        if (success) {
          toast({ title: "✓ Página de teste enviada!" });
        } else {
          toast({ title: "Falha no teste USB", description: "Usando impressão via navegador", variant: "destructive" });
        }
      } else {
        // Browser print test
        const testWindow = window.open('', '_blank', 'width=320,height=400');
        if (testWindow) {
          testWindow.document.write(`
            <!DOCTYPE html><html><head><style>
              @page { size: ${form.largura_papel || '80mm'} auto; margin: 0; }
              body { font-family: 'Courier New', monospace; font-size: 12px; width: ${form.largura_papel || '80mm'}; padding: 3mm; }
              .center { text-align: center; } .bold { font-weight: bold; }
              .dashed { border-top: 1px dashed #000; margin: 4px 0; }
            </style></head><body>
              <div class="center bold" style="font-size:14px">TESTE DE IMPRESSAO</div>
              <div class="dashed"></div>
              <div class="center bold" style="font-size:22px;letter-spacing:3px">TST1234</div>
              <div class="center">(TESTE PRETO)</div>
              <div class="dashed"></div>
              <div>Papel: ${form.largura_papel || '80mm'}</div>
              <div>Data: ${new Date().toLocaleString('pt-BR')}</div>
              <div class="dashed"></div>
              <div class="center bold">IMPRESSORA OK!</div>
              <div class="center" style="font-size:10px;margin-top:8px">Anderson Estacionamento</div>
            </body></html>
          `);
          testWindow.document.close();
          testWindow.focus();
          setTimeout(() => { testWindow.print(); setTimeout(() => testWindow.close(), 1000); }, 400);
        }
        toast({ title: "✓ Teste de impressão enviado" });
      }
    } catch {
      toast({ title: "Erro no teste", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (webUSBAvailable) scanDevices();
  }, []);

  return (
    <>
      {/* Status da impressora */}
      <Section title="Impressora Configurada">
        {printerConfig ? (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              {printerConfig.type === 'usb' ? <Usb className="h-5 w-5 text-accent" /> : <Printer className="h-5 w-5 text-accent" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{printerConfig.name}</p>
              <p className="text-xs text-muted-foreground">
                {printerConfig.type === 'usb' ? 'USB Direto (ESC/POS)' : 'Via Navegador'} • Papel {printerConfig.paperWidth}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-accent">Conectada</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold">Nenhuma impressora configurada</p>
              <p className="text-xs text-muted-foreground">Conecte uma impressora USB ou use o modo navegador</p>
            </div>
          </div>
        )}
      </Section>

      {/* Papel */}
      <Section title="Tamanho do Papel">
        <div className="grid grid-cols-2 gap-3">
          {(['80mm', '58mm'] as const).map((size) => (
            <button
              key={size} type="button"
              onClick={() => {
                setField('largura_papel', size);
                if (printerConfig) {
                  const updated = { ...printerConfig, paperWidth: size };
                  savePrinterConfig(updated);
                  setPrinterConfig(updated);
                }
              }}
              className={`h-16 rounded-xl text-sm font-semibold transition-all border-2 flex flex-col items-center justify-center gap-1 ${
                (form.largura_papel || '80mm') === size
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Printer className="h-4 w-4" />
              {size === '80mm' ? '80mm (Padrão)' : '58mm (Compacta)'}
            </button>
          ))}
        </div>
      </Section>

      {/* Conexão USB */}
      <Section title="Conectar Impressora">
        <div className="space-y-3">
          {webUSBAvailable ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button onClick={connectUSB} variant="outline" className="h-14 gap-2 rounded-xl text-sm">
                  <Usb className="h-5 w-5" /> Conectar USB (Plug & Play)
                </Button>
                <Button onClick={useBrowserPrint} variant="outline" className="h-14 gap-2 rounded-xl text-sm">
                  <Printer className="h-5 w-5" /> Usar Impressão do Navegador
                </Button>
              </div>

              {/* Discovered devices */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Dispositivos USB detectados: {usbDevices.length}</p>
                <Button variant="ghost" size="sm" onClick={scanDevices} disabled={scanning} className="gap-1.5 text-xs h-7">
                  <RefreshCw className={`h-3 w-3 ${scanning ? 'animate-spin' : ''}`} /> Atualizar
                </Button>
              </div>

              {usbDevices.length > 0 && (
                <div className="space-y-2">
                  {usbDevices.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                      <Usb className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{d.productName || `Dispositivo ${d.vendorId?.toString(16)}:${d.productId?.toString(16)}`}</p>
                        <p className="text-[10px] text-muted-foreground">{d.manufacturerName || 'Fabricante desconhecido'}</p>
                      </div>
                      <Check className="h-4 w-4 text-accent" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                <p className="text-xs text-warning font-medium">⚠️ WebUSB não disponível neste navegador</p>
                <p className="text-[10px] text-muted-foreground mt-1">Use Google Chrome ou Microsoft Edge para conexão USB direta. Ou use a impressão via navegador.</p>
              </div>
              <Button onClick={useBrowserPrint} className="h-14 gap-2 rounded-xl text-sm w-full">
                <Printer className="h-5 w-5" /> Usar Impressão do Navegador
              </Button>
            </div>
          )}
        </div>
      </Section>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={testPrint} variant="outline" disabled={testing} className="h-12 gap-2 rounded-xl">
          <Printer className="h-4 w-4" /> {testing ? 'Imprimindo...' : 'Teste de Impressão'}
        </Button>
        {printerConfig && (
          <Button onClick={disconnectPrinter} variant="outline" className="h-12 gap-2 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10">
            <X className="h-4 w-4" /> Desconectar
          </Button>
        )}
      </div>
      <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar Configurações</Button>
    </>
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
      nome_estacionamento: form.nome_estacionamento || 'ANDERSON ESTACIONAMENTO',
      cnpj: form.cnpj || null,
      endereco: form.endereco || null,
      telefone: form.telefone || null,
      valor_hora: Number(form.valor_hora ?? 10),
      valor_hora_moto: Number(form.valor_hora_moto ?? 6),
      tolerancia_minutos: Number(form.tolerancia_minutos ?? 15),
      valor_minimo: form.valor_minimo === '' || form.valor_minimo == null ? null : Number(form.valor_minimo),
      valor_maximo_diario: form.valor_maximo_diario === '' || form.valor_maximo_diario == null ? null : Number(form.valor_maximo_diario),
      valor_maximo_diario_moto: form.valor_maximo_diario_moto === '' || form.valor_maximo_diario_moto == null ? null : Number(form.valor_maximo_diario_moto),
      chave_pix: form.chave_pix || null,
      tipo_chave_pix: form.tipo_chave_pix || null,
      nome_beneficiario: form.nome_beneficiario || null,
      mensagem_comprovante: form.mensagem_comprovante || 'ANDERSON ESTACIONAMENTO AGRADECE A PREFERÊNCIA',
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
                { label: 'Comprovante Entrada', value: 'comprovante' },
                { label: 'Comprovante Saída', value: 'comprovante-saida' },
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
              <Section title="🚗 Valores — Carro">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Valor/Hora Carro (R$)"><Input type="number" value={form.valor_hora ?? ''} onChange={e => setField('valor_hora', Number(e.target.value))} className="h-12 font-mono" placeholder="10" /></Field>
                  <Field label="Diária Máxima Carro (R$)"><Input type="number" value={form.valor_maximo_diario ?? ''} onChange={e => setField('valor_maximo_diario', Number(e.target.value))} className="h-12 font-mono" placeholder="35" /></Field>
                </div>
              </Section>
              <Section title="🏍️ Valores — Moto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Valor/Hora Moto (R$)"><Input type="number" value={form.valor_hora_moto ?? ''} onChange={e => setField('valor_hora_moto', Number(e.target.value))} className="h-12 font-mono" placeholder="5" /></Field>
                  <Field label="Diária Máxima Moto (R$)"><Input type="number" value={form.valor_maximo_diario_moto ?? ''} onChange={e => setField('valor_maximo_diario_moto', Number(e.target.value))} className="h-12 font-mono" placeholder="15" /></Field>
                </div>
              </Section>
              <Section title="Geral">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Tolerância (minutos)"><Input type="number" value={form.tolerancia_minutos ?? ''} onChange={e => setField('tolerancia_minutos', Number(e.target.value))} className="h-12 font-mono" /></Field>
                  <Field label="Valor Mínimo (R$)"><Input type="number" value={form.valor_minimo ?? ''} onChange={e => setField('valor_minimo', Number(e.target.value))} className="h-12 font-mono" /></Field>
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
                <p className="text-xs text-muted-foreground">A chave PIX gera o QR Code automaticamente. Ou envie uma imagem do QR Code abaixo.</p>
              </Section>

              <Section title="Upload de Imagem QR Code">
                <div className="flex flex-col items-center gap-4">
                  {form.qr_code_url ? (
                    <div className="relative">
                      <img src={form.qr_code_url} alt="QR Code enviado" className="w-40 h-40 object-contain rounded-xl border border-border bg-white p-2" />
                      <button
                        onClick={() => setField('qr_code_url', null)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-80 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-40 h-40 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-secondary/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground text-center px-2">Clique para enviar QR Code</span>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadQR} />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2 rounded-xl">
                    <Upload className="h-4 w-4" /> {uploading ? 'Enviando...' : 'Enviar Imagem QR Code'}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">A imagem enviada substituirá o QR Code gerado automaticamente. Salve após enviar.</p>
                </div>
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
                    <Input value={form.mensagem_comprovante || ''} onChange={e => setField('mensagem_comprovante', e.target.value)} className="h-12" placeholder="Ex: ANDERSON ESTACIONAMENTO AGRADECE A PREFERÊNCIA" />
                  </Field>
                </div>
              </Section>
              <Button onClick={save} className="gap-2 h-12 px-8 rounded-xl"><Save className="h-4 w-4" /> Salvar</Button>
            </TabsContent>

            <TabsContent value="comprovante-saida" className="space-y-6">
              <Section title="Preview — Comprovante de Saída">
                <p className="text-xs text-muted-foreground mb-4">
                  O comprovante de saída é impresso automaticamente ao registrar o pagamento. Ele exibe a regra de cobrança aplicada (1h, 2h, 3h ou Diária), tempo de permanência, forma de pagamento e valor total.
                </p>
                <ExitReceiptPreview form={form} />
              </Section>
              <Section title="Informações exibidas no comprovante de saída">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <span className="text-primary font-bold">✓</span>
                    <div><p className="font-medium">Placa, modelo e cor do veículo</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <span className="text-primary font-bold">✓</span>
                    <div><p className="font-medium">Data/hora de entrada e saída</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <span className="text-primary font-bold">✓</span>
                    <div><p className="font-medium">Tempo de permanência</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <span className="text-primary font-bold">✓</span>
                    <div><p className="font-medium">Regra de cobrança (1 hora, 2 horas, 3 horas ou Diária)</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <span className="text-primary font-bold">✓</span>
                    <div><p className="font-medium">Forma de pagamento (PIX ou Dinheiro)</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <span className="text-primary font-bold">✓</span>
                    <div><p className="font-medium">Valor total pago</p></div>
                  </div>
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="impressao" className="space-y-6">
              <PrinterSetup form={form} setField={setField} save={save} />
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
