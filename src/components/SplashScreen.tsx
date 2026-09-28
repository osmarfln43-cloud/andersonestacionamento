import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashLogo from "@/assets/anderson-logo.png.asset.json";

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [visible, setVisible] = useState(true);
  const [started, setStarted] = useState(false);

  const startSplash = useCallback(() => {
    if (started) return;
    setStarted(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 600);
    }, 3500);
    return () => clearTimeout(timer);
  }, [started, onFinish]);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) { startSplash(); return; }
    const handler = () => startSplash();
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    const fallback = setTimeout(() => startSplash(), 800);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
      clearTimeout(fallback);
    };
  }, [startSplash]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "hsl(200 40% 92%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{ width: 400, height: 400, background: "radial-gradient(circle, hsl(120 40% 35% / 0.1) 0%, transparent 70%)" }}
            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.img
            src={splashLogo.url}
            alt="Anderson Estacionamento"
            className="w-72 sm:w-[26rem] max-w-[86vw]"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-sm mt-4 tracking-widest uppercase font-mono"
            style={{ color: "hsl(0 0% 35%)" }}
          >
            Estacionamento Inteligente
          </motion.p>

          <motion.div className="mt-8 h-[3px] w-48 rounded-full overflow-hidden" style={{ background: "hsl(200 25% 82%)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(120 50% 38%), hsl(65 70% 52%))" }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.3, duration: 2.8, ease: "easeInOut" }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="absolute bottom-6 text-[10px] font-mono"
            style={{ color: "hsl(0 0% 45%)" }}
          >
            © 2026 Anderson Estacionamento — Fenix Systens
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
