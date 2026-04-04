import { useState, useRef } from "react";
import { LogIn, Camera, Sparkles, Clock, Zap, Car, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRegistrarEntrada, useConfiguracoes } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReceiptPDF from "@/components/ReceiptPDF";

export default function Entrada() {
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [marca, setMarca] = useState("");
  const [cor, setCor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [tipo, setTipo] = useState<'avulso' | 'mensalista'>('avulso');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const registrarEntrada = useRegistrarEntrada();
  const { data: config } = useConfiguracoes();
  const { toast } = useToast();

  const identifyByPhoto = async (base64: string) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('identify-vehicle', {
        body: { image: base64 },
      });
      if (error) throw error;
      if (data) {
        setAiResult(data);
        if (data.marca) setMarca(data.marca);
        if (data.modelo) setModelo(data.modelo.includes(data.marca) ? data.modelo.replace(data.marca, '').trim() : data.modelo);
        if (data.cor) setCor(data.cor);
        toast({ title: "🤖 IA identificou o veículo!", description: `${data.marca} ${data.modelo} - ${data.cor}` });
      }
    } catch (err: any) {
      toast({ title: "Erro na identificação", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const identifyByPlaca = async () => {
    if (placa.length < 7) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      // First try to find in database
      const { data: existing } = await supabase.from('veiculos').select('*').eq('placa', placa.toUpperCase()).limit(1).single();
      if (existing) {
        setMarca(existing.marca || '');
        setModelo(existing.modelo);
        setCor(existing.cor || '');
        setAiResult({ marca: existing.marca, modelo: existing.modelo, cor: existing.cor, confianca: 'alta', source: 'database' });
        toast({ title: "✓ Veículo encontrado no sistema", description: `${existing.marca || ''} ${existing.modelo}` });
        setAiLoading(false);
        return;
      }

      // If not found, use AI
      const { data, error } = await supabase.functions.invoke('identify-vehicle', {
        body: { placa: placa.toUpperCase() },
      });
      if (error) throw error;
      if (data) {
        setAiResult(data);
        if (data.marca) setMarca(data.marca);
        if (data.modelo) setModelo(data.modelo);
        if (data.cor) setCor(data.cor);
        toast({ title: "🤖 IA sugeriu modelo", description: `${data.marca} ${data.modelo} (confiança: ${data.confianca})` });
      }
    } catch (err: any) {
      toast({ title: "Erro na identificação", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      identifyByPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim()) {
      toast({ title: "Preencha a placa", variant: "destructive" });
      return;
    }
    registrarEntrada.mutate(
      { placa: placa.toUpperCase(), modelo: `${marca} ${modelo}`.trim() || 'N/I', cor, tipo_cliente: tipo, observacao },
      {
        onSuccess: (result) => {
          toast({ title: "✓ Entrada registrada", description: `${placa.toUpperCase()} – ${marca} ${modelo}` });
          // Trigger receipt PDF
          setReceiptData({
            placa: placa.toUpperCase(),
            modelo: `${marca} ${modelo}`.trim() || 'N/I',
            cor,
            tipo_cliente: tipo,
            entrada: result.entrada,
            nomeEstacionamento: config?.nome_estacionamento,
            endereco: config?.endereco,
            telefone: config?.telefone,
            chavePix: config?.chave_pix,
            tipoChavePix: config?.tipo_chave_pix,
            nomeBeneficiario: config?.nome_beneficiario,
            mensagemComprovante: config?.mensagem_comprovante,
            valorHora: result.valor_hora,
            tipo: "unico" as const,
            horarioAbertura: (config as any)?.horario_abertura,
            horarioFechamento: (config as any)?.horario_fechamento,
            diasFuncionamento: (config as any)?.dias_funcionamento,
            disclaimerComprovante: (config as any)?.disclaimer_comprovante,
            qrCodeUrl: (config as any)?.qr_code_url || undefined,
          });
          setPlaca(""); setModelo(""); setMarca(""); setCor(""); setObservacao(""); setImagePreview(null); setAiResult(null);
        },
        onError: (err: any) => {
          toast({ title: "Erro ao registrar", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-display flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <LogIn className="h-5 w-5 text-accent" />
          </div>
          Entrada de Veículo
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Registre a entrada com reconhecimento inteligente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left - Main Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          {/* Plate Input */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="stat-label">Placa do Veículo</Label>
              {placa.length >= 7 && (
                <Button type="button" variant="ghost" size="sm" onClick={identifyByPlaca} disabled={aiLoading} className="gap-1.5 text-xs text-primary">
                  <Search className="h-3.5 w-3.5" /> {aiLoading ? 'Buscando...' : 'Buscar IA'}
                </Button>
              )}
            </div>
            <Input
              placeholder="ABC1D23"
              value={placa}
              onChange={(e) => {
                const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                setPlaca(v);
              }}
              onBlur={() => { if (placa.length >= 7) identifyByPlaca(); }}
              className="h-16 text-3xl font-mono font-bold tracking-[0.15em] text-center uppercase bg-secondary border-border focus:border-primary"
              maxLength={7}
              autoFocus
            />
            {aiResult && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/5 border border-accent/20">
                <Sparkles className="h-4 w-4 text-accent shrink-0" />
                <span className="text-xs text-accent">
                  {aiResult.source === 'database' ? 'Encontrado no sistema' : `IA: ${aiResult.confianca}`} — {aiResult.marca} {aiResult.modelo}
                </span>
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div className="glass-card p-6 space-y-5">
            <p className="section-title">Dados do Veículo</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="stat-label">Marca</Label>
                <Input placeholder="Ex: Honda" value={marca} onChange={(e) => setMarca(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Modelo</Label>
                <Input placeholder="Ex: Civic" value={modelo} onChange={(e) => setModelo(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="stat-label">Cor</Label>
                <Input placeholder="Ex: Preto" value={cor} onChange={(e) => setCor(e.target.value)} className="h-12" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="stat-label">Tipo de Cliente</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['avulso', 'mensalista'] as const).map((t) => (
                  <button
                    key={t} type="button" onClick={() => setTipo(t)}
                    className={`h-12 rounded-xl text-sm font-medium transition-all border-2 ${
                      tipo === t ? 'border-primary bg-primary/[0.06] text-primary' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t === 'avulso' ? '🅿️ Avulso' : '📋 Mensalista'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="stat-label">Observação (opcional)</Label>
              <Textarea placeholder="Observações..." value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} />
            </div>
          </div>

          <Button type="submit" className="w-full h-14 text-base font-semibold gap-2 rounded-xl" disabled={registrarEntrada.isPending}>
            <Zap className="h-5 w-5" /> {registrarEntrada.isPending ? 'Registrando...' : 'Registrar Entrada'}
          </Button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} – registro automático</span>
          </div>
        </form>

        {/* Right - AI Photo Recognition */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <p className="section-title">Reconhecimento por Foto</p>
            </div>
            <p className="text-xs text-muted-foreground">Tire uma foto do veículo e a IA identificará automaticamente marca, modelo e cor</p>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={imagePreview} alt="Veículo" className="w-full h-48 object-cover" />
                <button onClick={() => { setImagePreview(null); setAiResult(null); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
                {aiLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-foreground">Analisando...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center">
                  <Camera className="h-7 w-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Capturar Foto</p>
                  <p className="text-[11px] text-muted-foreground">Câmera ou galeria</p>
                </div>
              </button>
            )}
          </div>

          {aiResult && (
            <div className="glass-card p-5 space-y-3 animate-in" style={{ opacity: 0 }}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">Resultado IA</span>
              </div>
              <div className="space-y-2">
                {[
                  ['Marca', aiResult.marca],
                  ['Modelo', aiResult.modelo],
                  ['Cor', aiResult.cor],
                  ['Categoria', aiResult.categoria],
                  ['Confiança', aiResult.confianca],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-medium text-foreground">{(value as string) || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-4 w-4 text-primary" />
              <span className="section-title">Como funciona</span>
            </div>
            <div className="space-y-2.5">
              {[
                'Digite a placa — busca automática no sistema',
                'Não encontrou? A IA sugere marca e modelo',
                'Ou tire uma foto — a IA reconhece tudo',
                'Confirme os dados e registre a entrada',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-xs text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ReceiptPDF data={receiptData} onDone={() => setReceiptData(null)} />
    </div>
  );
}
