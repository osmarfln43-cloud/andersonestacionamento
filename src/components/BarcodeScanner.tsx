import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, ScanLine, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeTicketCode } from "@/lib/ticket";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export default function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    (async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result) => {
            if (!result || cancelled) return;
            const text = result.getText();
            const code = normalizeTicketCode(text) || text.trim();
            if (!code) return;
            cancelled = true;
            controlsRef.current?.stop();
            onDetected(code);
          },
        );
        controlsRef.current = controls as any;
      } catch (err: any) {
        setErro(err?.message || "Não foi possível abrir a câmera");
      }
    })();

    return () => {
      cancelled = true;
      try { controlsRef.current?.stop(); } catch { /* noop */ }
      controlsRef.current = null;
    };
  }, [open, onDetected]);

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
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[80%] max-w-md h-28 border-4 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
        {erro && (
          <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-destructive p-3 text-center text-sm text-destructive-foreground">
            {erro}
          </div>
        )}
      </div>

      <div className="p-4 space-y-2 border-t border-border">
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
