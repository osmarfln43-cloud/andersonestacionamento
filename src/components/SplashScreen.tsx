import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car } from "lucide-react";

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
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl mb-6"
          >
            <Car className="h-12 w-12 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-4xl font-display font-bold text-foreground tracking-tight"
          >
            ME PARK
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-sm text-muted-foreground mt-2"
          >
            Bem-vindo ao sistema inteligente
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.2, duration: 1.5, ease: "easeInOut" }}
            className="mt-8 h-1 w-32 rounded-full bg-gradient-to-r from-primary to-accent origin-left"
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
