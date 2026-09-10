import { useEffect, useRef, useState } from "react";
import { Camera, X, Flashlight, FlashlightOff, Moon } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  nightMode: boolean;
}

/**
 * Câmera ao vivo com lanterna (torch) e ganho noturno — usada para
 * fotografar placas no escuro antes do reconhecimento.
 */
export default function NightCameraCapture({ open, onClose, onCapture, nightMode }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const track = stream.getVideoTracks()[0];
        const caps: any = track.getCapabilities?.() ?? {};
        setTorchSupported(!!caps.torch);
        if (nightMode && caps.torch) {
          await track.applyConstraints({ advanced: [{ torch: true }] } as any).catch(() => {});
          setTorchOn(true);
        }
        if (nightMode && caps.exposureCompensation) {
          await track
            .applyConstraints({ advanced: [{ exposureCompensation: caps.exposureCompensation.max }] } as any)
            .catch(() => {});
        }
      } catch (e: any) {
        setError(e?.message || "Não foi possível abrir a câmera");
      }
    };
    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, nightMode]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    await track.applyConstraints({ advanced: [{ torch: next }] } as any).catch(() => {});
    setTorchOn(next);
  };

  const shoot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm p-3 gap-3">
      <div className="flex items-center justify-between">
        <span className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
          <Moon className="h-5 w-5" /> {nightMode ? "Câmera noturna" : "Câmera"}
        </span>
        <button type="button" onClick={onClose} className="pdv-btn-red px-3 py-2">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden rounded border border-border bg-muted">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-bold text-destructive">
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
            style={nightMode ? { filter: "grayscale(1) brightness(1.45) contrast(1.5)" } : undefined}
          />
        )}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-64 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-dashed border-accent/80" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={toggleTorch}
          disabled={!torchSupported}
          className={`pdv-btn-yellow flex items-center justify-center gap-2 h-14 text-base font-black ${!torchSupported ? "opacity-50" : ""}`}
        >
          {torchOn ? <Flashlight className="h-5 w-5" /> : <FlashlightOff className="h-5 w-5" />}
          {torchSupported ? (torchOn ? "Lanterna ON" : "Lanterna OFF") : "Sem lanterna"}
        </button>
        <button type="button" onClick={shoot} className="pdv-btn-green flex items-center justify-center gap-2 h-14 text-base font-black">
          <Camera className="h-5 w-5" /> Capturar
        </button>
      </div>
    </div>
  );
}
