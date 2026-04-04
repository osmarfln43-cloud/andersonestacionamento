import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 500);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1.4, opacity: 0.12 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="absolute h-56 w-56 rounded-full bg-primary blur-3xl"
          />

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 0.1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="absolute h-72 w-72 rounded-full bg-accent blur-3xl"
          />

          <motion.img
            src="/icons/icon-512.png"
            alt="ME PARK"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0.7, 1.06, 1], opacity: 1, rotate: [0, -3, 0] }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
            className="h-28 w-28 rounded-3xl shadow-2xl mb-6"
          />

          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 96, opacity: 0.18 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="h-4 rounded-full bg-primary blur-xl mb-4"
          />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-4xl font-display font-bold tracking-tight"
          >
            <span className="text-primary">ME</span>{" "}
            <span className="text-foreground">PARK</span>{" "}
            <span className="text-accent text-2xl font-medium">AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-sm text-muted-foreground mt-2"
          >
            Estacionamento Inteligente
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.85, 1] }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="text-lg font-medium text-primary/80 mt-6"
          >
            Bem-vindo! 👋
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.4, duration: 1.4, ease: "easeInOut" }}
            className="mt-6 h-1 w-40 rounded-full bg-gradient-to-r from-primary via-accent to-primary origin-left"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="absolute bottom-8 text-[10px] text-muted-foreground/50"
          >
            © 2026 ME PARK — OSMARJR Sistemas
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
