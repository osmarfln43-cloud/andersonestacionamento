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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <img src="/icons/icon-192.png" alt="ME PARK" className="w-12 h-12 rounded-xl" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground">Instalar ME PARK</p>
        <p className="text-xs text-muted-foreground truncate">Acesse direto do seu celular ou desktop</p>
      </div>
      <Button size="sm" onClick={install} className="gap-1.5 rounded-xl shrink-0">
        <Download className="h-4 w-4" /> Instalar
      </Button>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
