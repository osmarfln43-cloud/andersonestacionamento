import { useEffect, useRef, useState } from "react";
import { LogIn, Camera, Sparkles, Clock, Zap, Car, X, Search, Upload } from "lucide-react";
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
  const [showAiSection, setShowAiSection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const lastSearchedPlateRef = useRef("");
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const registrarEntrada = useRegistrarEntrada();
  const { data: config } = useConfiguracoes();
  const { toast } = useToast();

  const applyVehicleData = (
    data: { marca?: string | null; modelo?: string | null; cor?: string | null },
    options?: { splitCombinedModel?: boolean }
  ) => {
    const rawMarca = data.marca?.trim() || "";
    const rawModelo = data.modelo?.trim() || "";
    if (rawMarca) {
      setMarca(rawMarca);
      setModelo(rawModelo);
    } else if (options?.splitCombinedModel && rawModelo.includes(" ")) {
      const [possibleMarca, ...rest] = rawModelo.split(" ");
      setMarca(possibleMarca || "");
      setModelo(rest.join(" ") || rawModelo);
    } else {
      setMarca("");
      setModelo(rawModelo);
    }
    setCor(data.cor?.trim() || "");
  };

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
      const placaUpper = placa.toUpperCase();
      const [ativoResult, veiculoResult, historicoResult, visitasResult] = await Promise.all([
        supabase.from('movimentacoes').select('*').eq('placa', placaUpper).eq('status_movimentacao', 'ativo').order('entrada', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('veiculos').select('*, clientes(nome, tipo)').eq('placa', placaUpper).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('movimentacoes').select('placa, modelo, cor, tipo_cliente').eq('placa', placaUpper).eq('status_movimentacao', 'finalizado').order('saida', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('movimentacoes').select('id', { count: 'exact', head: true }).eq('placa', placaUpper),
      ]);

      if (ativoResult.error) throw ativoResult.error;
      if (veiculoResult.error) throw veiculoResult.error;
      if (historicoResult.error) throw historicoResult.error;
      if (visitasResult.error) throw visitasResult.error;

      const ativo = ativoResult.data;
      const veiculoCadastrado = veiculoResult.data;
      const historico = historicoResult.data;
      const proximaVisita = (visitasResult.count ?? 0) + 1;

      if (ativo) {
        applyVehicleData({ modelo: ativo.modelo, cor: ativo.cor }, { splitCombinedModel: true });
        setAiResult({ marca: '', modelo: ativo.modelo, cor: ativo.cor, confianca: 'alta', source: 'patio', visitCount: visitasResult.count ?? 1 });
        toast({ title: "⚠️ Veículo já está no pátio!", description: `${placaUpper} entrou em ${new Date(ativo.entrada).toLocaleString('pt-BR')}`, variant: "destructive" });
        return;
      }

      if (veiculoCadastrado) {
        applyVehicleData({ marca: veiculoCadastrado.marca, modelo: veiculoCadastrado.modelo, cor: veiculoCadastrado.cor });
        const cliente = veiculoCadastrado.clientes as any;
        const isMensalista = cliente?.tipo === 'mensalista';
        setTipo(isMensalista ? 'mensalista' : 'avulso');
        setAiResult({
          marca: veiculoCadastrado.marca, modelo: veiculoCadastrado.modelo, cor: veiculoCadastrado.cor,
          confianca: 'alta', source: isMensalista ? 'mensalista' : proximaVisita > 1 ? 'retorno' : 'database',
          clienteNome: cliente?.nome, visitCount: proximaVisita,
        });
        toast({
          title: isMensalista ? (proximaVisita > 1 ? "📋 Mensalista retornou!" : "📋 Mensalista identificado!") : (proximaVisita > 1 ? "🔄 Cliente retornou!" : "✓ Veículo encontrado"),
          description: isMensalista ? `${cliente.nome} — ${proximaVisita}ª vez` : `${veiculoCadastrado.marca || ''} ${veiculoCadastrado.modelo}`.trim(),
        });
        return;
      }

      if (historico) {
        applyVehicleData({ modelo: historico.modelo, cor: historico.cor }, { splitCombinedModel: true });
        setTipo(historico.tipo_cliente === 'mensalista' ? 'mensalista' : 'avulso');
        setAiResult({ marca: '', modelo: historico.modelo, cor: historico.cor, confianca: 'alta', source: 'retorno', visitCount: proximaVisita });
        toast({ title: "🔄 Cliente retornou!", description: `${proximaVisita}ª vez — ${historico.modelo}` });
        return;
      }

      // No local data found — call AI only if user clicked the button
      const { data, error } = await supabase.functions.invoke('identify-vehicle', { body: { placa: placaUpper } });
      if (error) throw error;
      if (data) {
        setAiResult(data);
        if (data.marca) setMarca(data.marca);
        if (data.modelo) setModelo(data.modelo);
        if (data.cor) setCor(data.cor);
        setTipo('avulso');
        toast({ title: "🤖 IA sugeriu modelo", description: `${data.marca} ${data.modelo} (confiança: ${data.confianca})` });
      }
    } catch (err: any) {
      toast({ title: "Erro na identificação", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // Only auto-search in local database (not AI) when plate reaches 7 chars
  useEffect(() => {
    if (placa.length === 7 && placa !== lastSearchedPlateRef.current) {
      lastSearchedPlateRef.current = placa;
      // Quick local lookup only
      const quickLookup = async () => {
        const placaUpper = placa.toUpperCase();
        const { data: veiculoCadastrado } = await supabase
          .from('veiculos').select('*, clientes(nome, tipo)')
          .eq('placa', placaUpper).order('created_at', { ascending: false }).limit(1).maybeSingle();
        
        if (veiculoCadastrado) {
          applyVehicleData({ marca: veiculoCadastrado.marca, modelo: veiculoCadastrado.modelo, cor: veiculoCadastrado.cor });
          const cliente = veiculoCadastrado.clientes as any;
          if (cliente?.tipo === 'mensalista') setTipo('mensalista');
          toast({ title: "✓ Veículo encontrado", description: `${veiculoCadastrado.marca || ''} ${veiculoCadastrado.modelo}`.trim() });
        } else {
          // Check history
          const { data: historico } = await supabase
            .from('movimentacoes').select('modelo, cor, tipo_cliente')
            .eq('placa', placaUpper).eq('status_movimentacao', 'finalizado')
            .order('saida', { ascending: false }).limit(1).maybeSingle();
          if (historico) {
            applyVehicleData({ modelo: historico.modelo, cor: historico.cor }, { splitCombinedModel: true });
            toast({ title: "🔄 Dados anteriores encontrados" });
          }
        }
      };
      quickLookup();
    }
    if (placa.length < 7) {
      lastSearchedPlateRef.current = "";
      setAiResult(null);
    }
  }, [placa]);

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      identifyByPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const uploadVehiclePhoto = async (placaStr: string): Promise<string | null> => {
    if (!capturedFile) return null;
    try {
      const ext = capturedFile.name.split('.').pop() || 'jpg';
      const filename = `${placaStr}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('vehicle-photos').upload(filename, capturedFile, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('vehicle-photos').getPublicUrl(filename);
      return urlData.publicUrl;
    } catch {
      return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim()) {
      toast({ title: "Preencha a placa", variant: "destructive" });
      return;
    }

    const doSubmit = async () => {
      const placaUpper = placa.toUpperCase();
      const fotoUrl = await uploadVehiclePhoto(placaUpper);
      const modeloCompleto = [marca.trim(), modelo.trim()].filter(Boolean).join(' ').trim() || 'N/I';

      registrarEntrada.mutate(
        {
          placa: placaUpper,
          marca: marca.trim() || undefined,
          modelo: modelo.trim() || 'N/I',
          cor,
          tipo_cliente: tipo,
          observacao,
          foto_url: fotoUrl || undefined,
        },
        {
          onSuccess: (result) => {
            toast({ title: "✓ Entrada registrada", description: `${placaUpper} – ${modeloCompleto}` });
            setReceiptData({
              placa: placaUpper, modelo: modeloCompleto, cor, tipo_cliente: tipo,
              entrada: result.entrada, nomeEstacionamento: config?.nome_estacionamento,
              endereco: config?.endereco, telefone: config?.telefone,
              chavePix: config?.chave_pix, tipoChavePix: config?.tipo_chave_pix,
              nomeBeneficiario: config?.nome_beneficiario, mensagemComprovante: config?.mensagem_comprovante,
              valorHora: result.valor_hora, tipo: "unico" as const,
              horarioAbertura: (config as any)?.horario_abertura,
              horarioFechamento: (config as any)?.horario_fechamento,
              diasFuncionamento: (config as any)?.dias_funcionamento,
              disclaimerComprovante: (config as any)?.disclaimer_comprovante,
              qrCodeUrl: (config as any)?.qr_code_url || undefined,
            });
            lastSearchedPlateRef.current = "";
            setPlaca(""); setModelo(""); setMarca(""); setCor("");
            setObservacao(""); setTipo('avulso'); setImagePreview(null);
            setAiResult(null); setCapturedFile(null); setShowAiSection(false);
          },
          onError: (err: any) => {
            toast({ title: "Erro ao registrar", description: err.message, variant: "destructive" });
          },
        }
      );
    };
    doSubmit();
  };

  const now = new Date();
  const horaAtual = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dataAtual = now.toLocaleDateString('pt-BR');

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header with clock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <LogIn className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight font-display">Entrada de Veículo</h1>
            <p className="text-[11px] text-muted-foreground">Registro manual de entrada</p>
          </div>
        </div>
        <div className="glass-card px-4 py-2 text-right">
          <p className="text-lg md:text-xl font-mono font-bold text-primary">{horaAtual}</p>
          <p className="text-[10px] text-muted-foreground">{dataAtual}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Placa + Data + Hora + Tipo */}
        <div className="glass-card p-4 md:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label className="stat-label text-[11px]">Placa *</Label>
              <Input
                placeholder="ABC1D23"
                value={placa}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                  setPlaca(v);
                }}
                className="h-12 text-lg font-mono font-bold tracking-[0.12em] text-center uppercase bg-secondary border-border focus:border-primary"
                maxLength={7}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Data</Label>
              <Input value={dataAtual} readOnly className="h-12 text-sm font-mono bg-secondary/50 text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Hora</Label>
              <Input value={horaAtual} readOnly className="h-12 text-sm font-mono bg-secondary/50 text-muted-foreground" />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label className="stat-label text-[11px]">Tipo</Label>
              <div className="grid grid-cols-2 gap-1.5 h-12">
                {(['avulso', 'mensalista'] as const).map((t) => (
                  <button
                    key={t} type="button" onClick={() => setTipo(t)}
                    className={`rounded-lg text-[11px] font-semibold transition-all border ${
                      tipo === t ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground'
                    }`}
                  >
                    {t === 'avulso' ? 'Avulso' : 'Mensal'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI status badge */}
          {aiResult && (
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${
              aiResult.source === 'patio' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
              aiResult.source === 'mensalista' ? 'bg-primary/10 border-primary/30 text-primary' :
              aiResult.source === 'retorno' ? 'bg-warning/10 border-warning/30 text-warning' :
              'bg-accent/5 border-accent/20 text-accent'
            }`}>
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              {aiResult.source === 'patio' ? '⚠️ JÁ NO PÁTIO' :
               aiResult.source === 'mensalista' ? `📋 MENSALISTA — ${aiResult.clienteNome}` :
               aiResult.source === 'retorno' ? `🔄 ${aiResult.visitCount || 2}ª VEZ` :
               aiResult.source === 'database' ? '✓ ENCONTRADO' :
               `🤖 IA: ${aiResult.confianca}`}
              {aiResult.marca || aiResult.modelo ? ` — ${aiResult.marca || ''} ${aiResult.modelo || ''}`.trim() : ''}
            </div>
          )}
        </div>

        {/* Row 2: Vehicle details */}
        <div className="glass-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados do Veículo</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => placa.length >= 7 ? identifyByPlaca() : setShowAiSection(!showAiSection)}
              disabled={aiLoading}
              className="gap-1.5 text-[11px] text-primary h-7 px-2"
            >
              <Search className="h-3 w-3" />
              {aiLoading ? 'Buscando...' : placa.length >= 7 ? 'Buscar IA' : 'Identificar por foto'}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Marca (opcional)</Label>
              <Input placeholder="Ex: Honda" value={marca} onChange={(e) => setMarca(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Modelo (opcional)</Label>
              <Input placeholder="Ex: Civic" value={modelo} onChange={(e) => setModelo(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="stat-label text-[11px]">Cor (opcional)</Label>
              <Input placeholder="Ex: Preto" value={cor} onChange={(e) => setCor(e.target.value)} className="h-11" />
            </div>
          </div>
        </div>

        {/* Row 3: Observation */}
        <div className="glass-card p-4 md:p-5">
          <Label className="stat-label text-[11px] mb-1.5 block">Observação (opcional)</Label>
          <Textarea placeholder="Observações sobre o veículo..." value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} className="resize-none" />
        </div>

        {/* Optional AI Photo Section */}
        {showAiSection && (
          <div className="glass-card p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reconhecimento por Foto (Opcional)</p>
              </div>
              <button type="button" onClick={() => { setShowAiSection(false); setImagePreview(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
            <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageCapture} />

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={imagePreview} alt="Veículo" className="w-full h-40 object-cover" />
                <button type="button" onClick={() => { setImagePreview(null); setAiResult(null); setCapturedFile(null); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
                {aiLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Analisando...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                  <Camera className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Câmera</span>
                </button>
                <button type="button" onClick={() => uploadInputRef.current?.click()}
                  className="h-28 rounded-xl border-2 border-dashed border-border hover:border-accent/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                  <Upload className="h-5 w-5 text-accent" />
                  <span className="text-xs font-medium">Galeria</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button type="submit" className="h-14 text-sm font-semibold gap-2 rounded-xl" disabled={registrarEntrada.isPending}>
            <Zap className="h-5 w-5" /> {registrarEntrada.isPending ? 'Registrando...' : 'Gravar Entrada'}
          </Button>
          <Button type="button" variant="secondary" className="h-14 text-sm font-semibold gap-2 rounded-xl border border-border"
            onClick={() => setShowAiSection(!showAiSection)}>
            <Camera className="h-5 w-5" /> {showAiSection ? 'Fechar Foto' : 'Foto (Opcional)'}
          </Button>
        </div>
      </form>

      <ReceiptPDF data={receiptData} onDone={() => setReceiptData(null)} />
    </div>
  );
}
