import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { X, ScanLine, Keyboard, Flashlight, FlashlightOff, Moon } from "lucide-react";
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
  const doneRef = useRef(false);
  const [erro, setErro] = useState<string | null>(null);
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

  useEffect(() => {
    if (!open) return;
    doneRef.current = false;
    setErro(null);
    let raf = 0;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
          audio: false,
        });
        if (doneRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }

        const track = stream.getVideoTracks()[0];
        const caps: any = track.getCapabilities?.() ?? {};
        setTorchSupported(!!caps.torch);

        const Native = (window as any).BarcodeDetector;
        if (Native) {
          const detector = new Native({ formats: NATIVE_FORMATS });
          const tick = async () => {
            if (doneRef.current || !videoRef.current) return;
            try {
              const found = await detector.detect(videoRef.current);
              if (found?.length) {
                finish(found[0].rawValue as string);
                return;
              }
            } catch { /* frame not ready */ }
            raf = window.setTimeout(tick, 200) as unknown as number;
          };
          tick();
          return;
        }

        const hints = new Map<DecodeHintType, unknown>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, FORMATS);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints as any, 250);
        const controls = await reader.decodeFromStream(stream, videoRef.current!, (result) => {
          if (result) finish(result.getText());
        });
        controlsRef.current = controls as any;
      } catch (err: any) {
        setErro(err?.message || "Não foi possível abrir a câmera");
      }
    };
    start();

    return () => {
      doneRef.current = true;
      window.clearTimeout(raf);
      try { controlsRef.current?.stop(); } catch { /* noop */ }
      controlsRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setTorchOn(false);
    };
  }, [open, finish]);

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
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[85%] max-w-md h-28 border-4 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
        {erro && (
          <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-destructive p-3 text-center text-sm text-destructive-foreground">
            {erro}
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
