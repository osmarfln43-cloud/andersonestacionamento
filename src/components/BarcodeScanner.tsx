import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { X, ScanLine, Keyboard, Flashlight, FlashlightOff, Moon, Camera, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeTicketCode } from "@/lib/ticket";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

const FORMATS = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
];

const NATIVE_FORMATS = ["code_128", "code_39", "ean_13", "ean_8", "itf", "qr_code"];

export default function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const [erro, setErro] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [manual, setManual] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [night, setNight] = useState(false);

  const finish = useCallback(
    (raw: string) => {
      if (doneRef.current) return;
      const code = normalizeTicketCode(raw) || raw.trim();
      if (!code) return;
      doneRef.current = true;
      try { controlsRef.current?.stop(); } catch { /* noop */ }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onDetected(code);
    },
    [onDetected],
  );

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current !== null) window.clearTimeout(scanTimerRef.current);
    scanTimerRef.current = null;
    try { controlsRef.current?.stop(); } catch { /* noop */ }
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (starting) return;
    stopCamera();
    doneRef.current = false;
    setErro(null);
    setPermissionDenied(false);
    setStarting(true);

    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("CAMERA_UNAVAILABLE");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (initialError) {
        const errorName = initialError instanceof DOMException ? initialError.name : "";
        if (errorName !== "OverconstrainedError") throw initialError;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (doneRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      setCameraActive(true);

      const track = stream.getVideoTracks()[0];
      const caps: any = track?.getCapabilities?.() ?? {};
      setTorchSupported(Boolean(caps.torch));

      const Native = (window as any).BarcodeDetector;
      if (Native) {
        try {
          const detector = new Native({ formats: NATIVE_FORMATS });
          const tick = async () => {
            if (doneRef.current || !videoRef.current) return;
            try {
              const found = await detector.detect(videoRef.current);
              if (found?.length) {
                finish(found[0].rawValue as string);
                return;
              }
            } catch { /* quadro ainda não está pronto */ }
            scanTimerRef.current = window.setTimeout(tick, 200);
          };
          tick();
          return;
        } catch { /* usa ZXing quando o detector nativo não aceita o formato */ }
      }

      const hints = new Map<DecodeHintType, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints as any, { delayBetweenScanAttempts: 200 });
      const controls = await reader.decodeFromStream(stream, video, (result) => {
        if (result) finish(result.getText());
      });
      controlsRef.current = controls;
    } catch (error: unknown) {
      stopCamera();
      const errorName = error instanceof DOMException ? error.name : "";
      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        setPermissionDenied(true);
        setErro("A câmera está bloqueada no Chrome.");
      } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        setErro("Nenhuma câmera foi encontrada neste aparelho.");
      } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
        setErro("A câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.");
      } else if (error instanceof Error && error.message === "CAMERA_UNAVAILABLE") {
        setErro("A câmera não está disponível neste navegador. Abra o sistema pelo Chrome atualizado.");
      } else {
        setErro("Não foi possível abrir a câmera. Verifique a permissão e tente novamente.");
      }
    } finally {
      setStarting(false);
    }
  }, [finish, starting, stopCamera]);

  useEffect(() => {
    if (!open) return;
    doneRef.current = false;
    setErro(null);
    setPermissionDenied(false);
    setCameraActive(false);

    return () => {
      doneRef.current = true;
      stopCamera();
    };
  }, [open, stopCamera]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    await track.applyConstraints({ advanced: [{ torch: next }] } as any).catch(() => {});
    setTorchOn(next);
  };

  const toggleNight = async () => {
    const next = !night;
    setNight(next);
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      const caps: any = track.getCapabilities?.() ?? {};
      if (caps.torch) {
        await track.applyConstraints({ advanced: [{ torch: next }] } as any).catch(() => {});
        setTorchOn(next);
      }
      if (caps.exposureCompensation) {
        await track
          .applyConstraints({
            advanced: [{ exposureCompensation: next ? caps.exposureCompensation.max : 0 }],
          } as any)
          .catch(() => {});
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-primary" />
          <span className="font-bold">Ler código de barras</span>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Fechar leitor">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={night ? { filter: "grayscale(1) brightness(1.45) contrast(1.5)" } : undefined}
          muted
          playsInline
          autoPlay
        />
        {cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[85%] max-w-md h-28 border-4 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
        )}
        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center p-5">
            <div className="w-full max-w-md space-y-4 text-center">
              <Camera className="mx-auto h-12 w-12 text-primary" />
              <div>
                <p className="font-bold">Ative a câmera para ler o código</p>
                <p className="mt-1 text-sm text-muted-foreground">O Chrome solicitará sua permissão. Escolha “Permitir”.</p>
              </div>
              {erro && (
                <div className="rounded-lg bg-destructive p-3 text-sm text-destructive-foreground">
                  <p className="font-bold">{erro}</p>
                  {permissionDenied && (
                    <p className="mt-2">
                      Toque no ícone de ajustes ao lado do endereço, abra “Permissões”, escolha “Câmera” e marque “Permitir”.
                    </p>
                  )}
                </div>
              )}
              <Button type="button" onClick={startCamera} disabled={starting} className="h-12 w-full gap-2 font-bold">
                {permissionDenied ? <RotateCcw className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                {starting ? "Abrindo câmera..." : permissionDenied ? "Já permiti — tentar novamente" : "Ativar câmera"}
              </Button>
              {permissionDenied && (
                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Settings className="h-3.5 w-3.5" /> Se necessário, recarregue a página após liberar.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 border-t border-border">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={toggleTorch}
            disabled={!torchSupported}
            className={`pdv-btn-yellow flex items-center justify-center gap-2 h-12 font-black ${!torchSupported ? "opacity-50" : ""}`}
          >
            {torchOn ? <Flashlight className="h-5 w-5" /> : <FlashlightOff className="h-5 w-5" />}
            {torchSupported ? (torchOn ? "Lanterna ON" : "Lanterna OFF") : "Sem lanterna"}
          </button>
          <button
            type="button"
            onClick={toggleNight}
            className={`pdv-btn-green flex items-center justify-center gap-2 h-12 font-black ${night ? "ring-2 ring-primary" : ""}`}
          >
            <Moon className="h-5 w-5" /> {night ? "Noturno ON" : "Modo noturno"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Keyboard className="h-3.5 w-3.5" /> Ou digite o código do comprovante
        </p>
        <div className="flex gap-2">
          <Input
            value={manual}
            onChange={(e) => setManual(normalizeTicketCode(e.target.value))}
            placeholder="0000000000"
            inputMode="numeric"
            className="h-12 text-lg font-mono tracking-widest text-center"
          />
          <Button
            className="h-12 px-6 font-bold"
            disabled={manual.length < 4}
            onClick={() => onDetected(manual)}
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
