import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Camera, Sparkles, Clock, Zap, Car, X, Search, Upload, CarFront, Bike } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRegistrarEntrada, useConfiguracoes, useMovimentacoesHoje } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReceiptPDF from "@/components/ReceiptPDF";

export default function Entrada() {
  const [placa, setPlaca] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [tipo, setTipo] = useState<'avulso' | 'mensalista'>('avulso');
  const [categoria, setCategoria] = useState<'carro' | 'moto'>('carro');
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
  const { data: movHoje = [] } = useMovimentacoesHoje();
  const { toast } = useToast();
  const navigate = useNavigate();

  const normalizeCategoria = (value?: string | null): 'carro' | 'moto' => value === 'moto' ? 'moto' : 'carro';

  const applyVehicleData = (data: { marca?: string | null; modelo?: string | null; cor?: string | null }) => {
    const rawMarca = data.marca?.trim() || "";
    const rawModelo = data.modelo?.trim() || "";
    const rawCor = data.cor?.trim() || "";
    const combined = [rawMarca, rawModelo, rawCor].filter(Boolean).join(' ').trim();
    setDescricao(combined);
    setCor(rawCor);
  };

  const identifyByPhoto = async (base64: string) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('identify-vehicle', { body: { image: base64 } });
      if (error) throw error;
      if (data) {
        setAiResult(data);
        if (data.placa && data.placa.length >= 6) { setPlaca(data.placa.toUpperCase()); lastSearchedPlateRef.current = data.placa.toUpperCase(); }
        if (data.marca || data.modelo) setDescricao([data.marca, data.modelo, data.cor].filter(Boolean).join(' ').trim());
        if (data.cor) setCor(data.cor);
        setCategoria(normalizeCategoria(data.categoria));
        toast({ title: "🤖 IA identificou!", description: `${data.categoria === 'moto' ? 'Moto' : 'Carro'} — ${[data.marca, data.modelo].filter(Boolean).join(' ')}` });
      }
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
    finally { setAiLoading(false); }
  };

  const identifyByPlaca = async () => {
    if (placa.length < 7) return;
    setAiLoading(true); setAiResult(null);
    try {
      const placaUpper = placa.toUpperCase();
      const [ativoResult, veiculoResult, historicoResult, visitasResult] = await Promise.all([
        supabase.from('movimentacoes').select('*').eq('placa', placaUpper).eq('status_movimentacao', 'ativo').order('entrada', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('veiculos').select('*, clientes(nome, tipo)').eq('placa', placaUpper).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('movimentacoes').select('placa, modelo, cor, tipo_cliente, categoria').eq('placa', placaUpper).eq('status_movimentacao', 'finalizado').order('saida', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('movimentacoes').select('id', { count: 'exact', head: true }).eq('placa', placaUpper),
      ]);
      if (ativoResult.error) throw ativoResult.error;
      if (veiculoResult.error) throw veiculoResult.error;
      const ativo = ativoResult.data;
      const veiculoCadastrado = veiculoResult.data;
      const historico = historicoResult.data;
      const proximaVisita = (visitasResult.count ?? 0) + 1;

      if (ativo) {
        applyVehicleData({ modelo: ativo.modelo, cor: ativo.cor });
        setCategoria(normalizeCategoria(ativo.categoria));
        setAiResult({ source: 'patio', visitCount: visitasResult.count ?? 1 });
        toast({ title: "⚠️ Já no pátio!", description: `${placaUpper} — ${new Date(ativo.entrada).toLocaleString('pt-BR')}`, variant: "destructive" });
        return;
      }
      if (veiculoCadastrado) {
        applyVehicleData({ marca: veiculoCadastrado.marca, modelo: veiculoCadastrado.modelo, cor: veiculoCadastrado.cor });
        setCategoria(normalizeCategoria(historico?.categoria ?? veiculoCadastrado.categoria));
        const cliente = veiculoCadastrado.clientes as any;
        const isMensalista = cliente?.tipo === 'mensalista';
        setTipo(isMensalista ? 'mensalista' : 'avulso');
        setAiResult({ source: isMensalista ? 'mensalista' : proximaVisita > 1 ? 'retorno' : 'database', clienteNome: cliente?.nome, visitCount: proximaVisita });
        toast({ title: isMensalista ? "📋 Mensalista!" : "✓ Encontrado", description: `${veiculoCadastrado.marca || ''} ${veiculoCadastrado.modelo}`.trim() });
        return;
      }
      if (historico) {
        applyVehicleData({ modelo: historico.modelo, cor: historico.cor });
        setCategoria(normalizeCategoria(historico.categoria));
        setTipo(historico.tipo_cliente === 'mensalista' ? 'mensalista' : 'avulso');
        setAiResult({ source: 'retorno', visitCount: proximaVisita });
        toast({ title: "🔄 Retornou!", description: `${proximaVisita}ª vez` });
        return;
      }
      const { data, error } = await supabase.functions.invoke('identify-vehicle', { body: { placa: placaUpper } });
      if (error) throw error;
      if (data) {
        setAiResult(data);
        if (data.marca || data.modelo) setDescricao([data.marca, data.modelo, data.cor].filter(Boolean).join(' ').trim());
        if (data.cor) setCor(data.cor);
        setCategoria(normalizeCategoria(data.categoria));
        toast({ title: "🤖 IA sugeriu", description: `${data.marca} ${data.modelo}` });
      }
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
    finally { setAiLoading(false); }
  };

  useEffect(() => {
    if (placa.length === 7 && placa !== lastSearchedPlateRef.current) {
      lastSearchedPlateRef.current = placa;
      const quickLookup = async () => {
        const placaUpper = placa.toUpperCase();
        const [veiculoResult, historicoResult] = await Promise.all([
          supabase.from('veiculos').select('*, clientes(nome, tipo)').eq('placa', placaUpper).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('movimentacoes').select('modelo, cor, tipo_cliente, categoria').eq('placa', placaUpper).eq('status_movimentacao', 'finalizado').order('saida', { ascending: false }).limit(1).maybeSingle(),
        ]);

        const veiculoCadastrado = veiculoResult.data;
        const historico = historicoResult.data;

        if (veiculoCadastrado) {
          applyVehicleData({ marca: veiculoCadastrado.marca, modelo: veiculoCadastrado.modelo, cor: veiculoCadastrado.cor });
          setCategoria(normalizeCategoria(historico?.categoria ?? veiculoCadastrado.categoria));
          const cliente = veiculoCadastrado.clientes as any;
          if (cliente?.tipo === 'mensalista') setTipo('mensalista');
          toast({ title: "✓ Encontrado", description: `${veiculoCadastrado.marca || ''} ${veiculoCadastrado.modelo}`.trim() });
        } else if (historico) {
          applyVehicleData({ modelo: historico.modelo, cor: historico.cor });
          setCategoria(normalizeCategoria(historico.categoria));
          toast({ title: "🔄 Dados anteriores" });
        }
      };
      quickLookup();
    }
    if (placa.length < 7) { lastSearchedPlateRef.current = ""; setAiResult(null); }
  }, [placa]);

  const compressImage = (file: File, maxWidth = 800, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale; canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = url;
    });
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedFile(file);
    const compressed = await compressImage(file);
    setImagePreview(compressed);
    identifyByPhoto(compressed);
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
    } catch { return null; }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim()) { toast({ title: "Preencha a placa", variant: "destructive" }); return; }
    const doSubmit = async () => {
      const placaUpper = placa.toUpperCase();
      const fotoUrl = await uploadVehiclePhoto(placaUpper);
      const descParts = descricao.trim().split(/\s+/);
      const corFinal = descParts.length > 1 ? descParts.pop()! : '';
      const modeloFinal = descParts.join(' ') || 'N/I';
      const modeloCompleto = descricao.trim() || 'N/I';
      registrarEntrada.mutate(
        { placa: placaUpper, modelo: modeloFinal, cor: corFinal, tipo_cliente: tipo, observacao, foto_url: fotoUrl || undefined, categoria },
        {
          onSuccess: (result) => {
            toast({ title: "✓ Entrada registrada", description: `${placaUpper} – ${modeloCompleto}` });
            setReceiptData({
              placa: placaUpper, modelo: modeloCompleto, cor: corFinal, tipo_cliente: tipo,
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
              cnpj: config?.cnpj || undefined,
            });
            lastSearchedPlateRef.current = "";
            setPlaca(""); setDescricao(""); setCor(""); setObservacao(""); setTipo('avulso'); setCategoria('carro');
            setImagePreview(null); setAiResult(null); setCapturedFile(null); setShowAiSection(false);
          },
          onError: (err: any) => { toast({ title: "Erro", description: err.message, variant: "destructive" }); },
        }
      );
    };
    doSubmit();
  };

  // Counter for cupom
  const cupomNum = String(movHoje.length + 1).padStart(4, '0');

  return (
    <div className="space-y-3">
      {/* Input bar */}
      <form onSubmit={handleSubmit} className="pdv-card p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1 flex-1 min-w-[160px]">
            <label className="text-lg font-black uppercase tracking-wider text-muted-foreground">PLACA</label>
            <input
              placeholder="ABC1D23"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
              className="pdv-input w-full text-4xl tracking-[0.15em] text-center uppercase font-black py-3"
              maxLength={7}
              autoFocus
            />
          </div>
          <div className="space-y-1 w-44">
            <label className="text-lg font-black uppercase tracking-wider text-muted-foreground">TIPO</label>
            <Select value={categoria} onValueChange={(value) => setCategoria(value as 'carro' | 'moto')}>
              <SelectTrigger className={`pdv-input w-full text-xl font-bold h-[60px] ${categoria === 'carro' ? 'text-destructive' : 'text-info'}`}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carro">
                  <span className="flex items-center gap-2 text-destructive font-bold"><CarFront className="h-4 w-4" /> Carro</span>
                </SelectItem>
                <SelectItem value="moto">
                  <span className="flex items-center gap-2 text-info font-bold"><Bike className="h-4 w-4" /> Moto</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-lg font-black uppercase tracking-wider text-muted-foreground">DESCRIÇÃO (modelo + cor)</label>
            <input
              placeholder="Ex: CIVIC PRETO"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="pdv-input w-full text-2xl font-bold uppercase py-3"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="pdv-btn-green h-[60px] px-8 text-2xl font-black" disabled={registrarEntrada.isPending}>
              {registrarEntrada.isPending ? '...' : '→'}
            </button>
            <button type="button" onClick={() => placa.length >= 7 ? identifyByPlaca() : setShowAiSection(!showAiSection)} className="pdv-btn-yellow h-[60px] px-4" disabled={aiLoading}>
              <Search className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* AI status */}
        {aiResult && (
          <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold ${
            aiResult.source === 'patio' ? 'bg-destructive/20 text-destructive' :
            aiResult.source === 'mensalista' ? 'bg-info/20 text-info' :
            aiResult.source === 'retorno' ? 'bg-warning/20 text-warning' :
            'bg-accent/20 text-accent'
          }`}>
            <Sparkles className="h-3 w-3" />
            {aiResult.source === 'patio' ? '⚠️ JÁ NO PÁTIO' :
             aiResult.source === 'mensalista' ? `📋 MENSALISTA — ${aiResult.clienteNome}` :
             aiResult.source === 'retorno' ? `🔄 ${aiResult.visitCount || 2}ª VEZ` :
             '✓ ENCONTRADO'}
          </div>
        )}

        {/* Tipo cliente toggle */}
        <div className="mt-2 flex gap-2">
          {(['avulso', 'mensalista'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTipo(t)}
              className={`pdv-btn text-xs flex-1 ${tipo === t ? 'pdv-btn-green' : 'pdv-btn-yellow'}`}>
              {t === 'avulso' ? 'AVULSO' : 'MENSALISTA'}
            </button>
          ))}
        </div>
      </form>

      {/* Photo section */}
      {showAiSection && (
        <div className="pdv-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="stat-label flex items-center gap-1"><Camera className="h-3 w-3" /> FOTO (OPCIONAL)</span>
            <button type="button" onClick={() => { setShowAiSection(false); setImagePreview(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
          <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageCapture} />
          {imagePreview ? (
            <div className="relative rounded overflow-hidden border border-border">
              <img src={imagePreview} alt="Veículo" className="w-full h-32 object-cover" />
              {aiLoading && <div className="absolute inset-0 flex items-center justify-center bg-background/60"><span className="text-sm font-mono">Analisando...</span></div>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="pdv-btn-yellow flex items-center justify-center gap-2"><Camera className="h-4 w-4" /> Câmera</button>
              <button type="button" onClick={() => uploadInputRef.current?.click()} className="pdv-btn-yellow flex items-center justify-center gap-2"><Upload className="h-4 w-4" /> Galeria</button>
            </div>
          )}
        </div>
      )}

      {/* Table of today's entries - like PARKEE */}
      <div className="pdv-card overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <span className="text-2xl font-black uppercase tracking-wider text-destructive">MOVIMENTAÇÕES DE HOJE</span>
          <span className="text-lg text-muted-foreground font-mono font-bold">{movHoje.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="pdv-table">
            <thead>
              <tr>
                <th className="text-xl font-black uppercase py-3">Cupom</th>
                <th className="text-xl font-black uppercase py-3">Entrada</th>
                <th className="text-xl font-black uppercase py-3">Placa</th>
                <th className="text-xl font-black uppercase py-3">Descrição</th>
                <th className="text-xl font-black uppercase py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {movHoje.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-xl">Nenhuma movimentação hoje</td></tr>
              )}
              {movHoje.map((m, i) => {
                const rowColor = m.categoria === 'moto' ? 'hsl(0,72%,50%)' : 'hsl(120,55%,42%)';
                return (
                  <tr key={m.id} className={m.categoria === 'moto' ? 'pdv-moto-row' : 'pdv-carro-row'}>
                    <td className="text-4xl font-black font-mono py-3" style={{ color: rowColor }}>{String(movHoje.length - i).padStart(4, '0')}</td>
                    <td className="text-3xl font-black font-mono py-3" style={{ color: rowColor }}>{new Date(m.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td
                      className="text-4xl font-black font-mono tracking-wider py-3 cursor-pointer hover:underline hover:text-primary transition-colors"
                      onClick={() => m.status_movimentacao === 'ativo' && navigate(`/saida?placa=${m.placa}`)}
                      title={m.status_movimentacao === 'ativo' ? 'Clique para registrar saída' : ''}
                    >{m.placa}</td>
                    <td className="text-3xl font-black uppercase py-3">{[m.modelo, m.cor].filter(Boolean).join(' ').toUpperCase()}</td>
                    <td className="py-3">
                      <span className={`text-lg font-black px-4 py-2 rounded ${
                        m.status_movimentacao === 'ativo' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                      }`}>
                        {m.status_movimentacao === 'ativo' ? 'PÁTIO' : 'SAIU'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom action buttons */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <button type="button" onClick={() => setShowAiSection(!showAiSection)} className="pdv-btn-yellow text-[11px]">
          Foto<br/><span className="text-[9px] opacity-60">IA</span>
        </button>
        <button type="button" onClick={() => { setPlaca(''); setDescricao(''); setCor(''); setObservacao(''); setAiResult(null); }} className="pdv-btn-red text-[11px]">
          Limpar<br/><span className="text-[9px] opacity-60">ESC</span>
        </button>
        <button type="button" onClick={() => placa.length >= 7 && identifyByPlaca()} className="pdv-btn-green text-[11px]" disabled={aiLoading || placa.length < 7}>
          Buscar<br/><span className="text-[9px] opacity-60">F2</span>
        </button>
      </div>

      <ReceiptPDF data={receiptData} onDone={() => setReceiptData(null)} />
    </div>
  );
}
