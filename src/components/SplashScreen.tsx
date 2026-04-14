import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashLogo from "@/assets/logo.png";

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
          style={{ background: "hsl(60 5% 18%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{ width: 450, height: 450, background: "radial-gradient(circle, hsl(45 90% 50% / 0.1) 0%, transparent 70%)" }}
            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div className="relative">
            <motion.img
              src={splashLogo}
              alt="Anderson Estacionamento"
              className="w-72 sm:w-96 max-w-[85vw]"
              style={{ filter: "drop-shadow(0 4px 20px hsl(45 90% 50% / 0.2))" }}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-sm mt-4 tracking-widest uppercase font-mono"
            style={{ color: "hsl(60 8% 55%)" }}
          >
            Estacionamento Inteligente
          </motion.p>

          <motion.div className="mt-8 h-[3px] w-48 rounded-full overflow-hidden" style={{ background: "hsl(60 4% 30%)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(45 90% 50%), hsl(120 55% 42%))" }}
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
            style={{ color: "hsl(60 8% 45%)" }}
          >
            © 2026 Anderson Estacionamento — OSMARJR Sistemas
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
