import { useState, useEffect, useCallback, useRef } from "react";
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
    if (isStandalone) {
      startSplash();
      return;
    }
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
          style={{
            background: "linear-gradient(135deg, hsl(204 60% 94%), hsl(210 60% 88%), hsl(217 50% 92%))",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Soft ambient glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 450,
              height: 450,
              background: "radial-gradient(circle, hsl(217 91% 55% / 0.12) 0%, transparent 70%)",
            }}
            animate={{
              scale: [0.9, 1.2, 0.9],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Logo */}
          <motion.div className="relative">
            <motion.img
              src={splashLogo}
              alt="Anderson Estacionamento"
              className="w-72 sm:w-96 max-w-[85vw]"
              style={{
                filter: "drop-shadow(0 4px 20px hsl(217 91% 55% / 0.2))",
              }}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-sm mt-4 tracking-widest uppercase"
            style={{ color: "hsl(225 25% 35%)" }}
          >
            Estacionamento Inteligente
          </motion.p>

          {/* Loading bar */}
          <motion.div className="mt-8 h-[3px] w-48 rounded-full overflow-hidden" style={{ background: "hsl(217 50% 82%)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(217 91% 55%), hsl(200 80% 55%))" }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.3, duration: 2.8, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="absolute bottom-6 text-[10px]"
            style={{ color: "hsl(225 20% 50%)" }}
          >
            © 2026 Anderson Estacionamento — OSMARJR Sistemas
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
