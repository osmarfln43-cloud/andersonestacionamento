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
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if previously dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedAt = parseInt(wasDismissed, 10);
      // Show again after 24h
      if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Don't show if already installed or dismissed
  if (isStandalone || dismissed) return null;

  // Don't show if no prompt available AND not iOS
  if (!deferredPrompt && !isIOS) return null;

  const install = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setDeferredPrompt(null);
          setDismissed(true);
        }
      } catch {
        // prompt() can fail if already called
      }
    }
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm bg-card border border-primary/20 rounded-2xl shadow-2xl p-5 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
      <img src="/icons/icon-192.png" alt="Anderson" className="w-12 h-12 rounded-xl" />
      <div className="text-center">
        <p className="font-bold text-base text-foreground">Instalar Anderson Estacionamento</p>
        <p className="text-xs text-muted-foreground mt-1">Acesse direto do seu celular ou desktop</p>
      </div>

      {isIOS && !deferredPrompt ? (
        <div className="text-center space-y-2 w-full">
          <p className="text-xs text-muted-foreground">
            No Safari, toque em <strong>Compartilhar</strong> (ícone ↑) e depois em <strong>"Adicionar à Tela de Início"</strong>
          </p>
          <Button variant="outline" onClick={dismiss} className="w-full rounded-xl h-11 text-sm">
            Entendi
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 w-full">
          <Button onClick={install} className="flex-1 gap-2 rounded-xl h-11">
            <Download className="h-4 w-4" /> Instalar
          </Button>
          <Button variant="outline" size="icon" onClick={dismiss} className="rounded-xl h-11 w-11 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
