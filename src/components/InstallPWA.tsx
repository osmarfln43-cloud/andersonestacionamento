import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const install = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm bg-card border border-primary/20 rounded-2xl shadow-2xl p-5 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
       <img src="/icons/icon-192.png" alt="Anderson" className="w-12 h-12 rounded-xl" />
      <div className="text-center">
        <p className="font-bold text-base text-foreground">Instalar Anderson Estacionamento</p>
        <p className="text-xs text-muted-foreground mt-1">Acesse direto do seu celular ou desktop</p>
      </div>
      <div className="flex items-center gap-3 w-full">
        <Button onClick={install} className="flex-1 gap-2 rounded-xl h-11">
          <Download className="h-4 w-4" /> Instalar
        </Button>
        <Button variant="outline" size="icon" onClick={() => setDismissed(true)} className="rounded-xl h-11 w-11 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
