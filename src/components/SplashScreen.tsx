import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashLogo from "@/assets/mepark-splash.png";

function playEngineSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 2.8;
    const now = ctx.currentTime;

    // Low rumble oscillator
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(45, now);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 1.2);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 2.0);
    osc1.frequency.exponentialRampToValueAtTime(90, now + duration);

    const gain1 = ctx.createGainNode();
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.3);
    gain1.gain.linearRampToValueAtTime(0.18, now + 1.5);
    gain1.gain.linearRampToValueAtTime(0, now + duration);

    // Mid-range "vroom" oscillator
    const osc2 = ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(80, now);
    osc2.frequency.exponentialRampToValueAtTime(250, now + 1.5);
    osc2.frequency.exponentialRampToValueAtTime(400, now + 2.2);
    osc2.frequency.exponentialRampToValueAtTime(150, now + duration);

    const gain2 = ctx.createGainNode();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.5);
    gain2.gain.linearRampToValueAtTime(0.1, now + 1.8);
    gain2.gain.linearRampToValueAtTime(0, now + duration);

    // Noise buffer for exhaust texture
    const bufferSize = ctx.sampleRate * duration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(800, now + 2.0);
    noiseFilter.frequency.exponentialRampToValueAtTime(300, now + duration);

    const noiseGain = ctx.createGainNode();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.05, now + 0.4);
    noiseGain.gain.linearRampToValueAtTime(0.08, now + 1.8);
    noiseGain.gain.linearRampToValueAtTime(0, now + duration);

    // Distortion for grit
    const distortion = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 4) * x / (Math.PI + 4 * Math.abs(x));
    }
    distortion.curve = curve;

    osc1.connect(gain1).connect(distortion).connect(ctx.destination);
    osc2.connect(gain2).connect(distortion);
    noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    noise.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
    noise.stop(now + duration);

    setTimeout(() => ctx.close(), (duration + 0.5) * 1000);
  } catch {
    // Audio not supported, fail silently
  }
}

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [visible, setVisible] = useState(true);
  const [started, setStarted] = useState(false);
  const soundPlayed = useRef(false);

  const startSplash = useCallback(() => {
    if (started) return;
    setStarted(true);
    if (!soundPlayed.current) {
      soundPlayed.current = true;
      playEngineSound();
    }
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 600);
    }, 4000);
    return () => clearTimeout(timer);
  }, [started, onFinish]);

  // Auto-start after a brief delay (sound will play on interaction)
  useEffect(() => {
    // Try to play immediately for standalone PWA (already has gesture context)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      startSplash();
      return;
    }
    // For browser, wait for first interaction
    const handler = () => startSplash();
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    // Fallback: start after 1s even without interaction (sound may not play)
    const fallback = setTimeout(() => {
      if (!soundPlayed.current) startSplash();
    }, 1000);
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
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0f] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Ambient glow rings */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 500,
              height: 500,
              background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
            }}
            animate={{
              scale: [0.8, 1.3, 0.8],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 400,
              height: 400,
              background: "radial-gradient(circle, hsl(142 71% 45% / 0.12) 0%, transparent 60%)",
            }}
            animate={{
              scale: [1.1, 0.7, 1.1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />

          {/* Floating light particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary/40"
              style={{
                width: 3 + Math.random() * 4,
                height: 3 + Math.random() * 4,
              }}
              initial={{
                x: (Math.random() - 0.5) * 300,
                y: (Math.random() - 0.5) * 300,
                opacity: 0,
              }}
              animate={{
                x: [(Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300],
                y: [(Math.random() - 0.5) * 300, (Math.random() - 0.5) * 200],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Cyan scan line effect */}
          <motion.div
            className="absolute w-[400px] h-[2px] opacity-30"
            style={{
              background: "linear-gradient(90deg, transparent, #00e5ff, transparent)",
              filter: "blur(1px)",
            }}
            initial={{ y: -80 }}
            animate={{ y: [80, -80, 80] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Main logo with 3D perspective animation */}
          <motion.div
            className="relative"
            style={{ perspective: 800 }}
          >
            <motion.img
              src={splashLogo}
              alt="ME PARK"
              className="w-72 sm:w-96 max-w-[85vw] drop-shadow-2xl"
              style={{
                filter: "drop-shadow(0 0 30px hsl(142 71% 45% / 0.4)) drop-shadow(0 0 60px hsl(200 100% 50% / 0.2))",
              }}
              initial={{ scale: 0.6, opacity: 0, rotateY: -25 }}
              animate={{
                scale: [0.6, 1.05, 1],
                opacity: 1,
                rotateY: [-25, 8, -3, 0],
                rotateX: [10, -5, 2, 0],
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Pulsing glow behind logo */}
            <motion.div
              className="absolute inset-0 -z-10"
              style={{
                background: "radial-gradient(ellipse at center, hsl(142 71% 45% / 0.25) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />

            {/* Headlight glow left */}
            <motion.div
              className="absolute top-[40%] left-[5%] w-8 h-4 rounded-full -z-10"
              style={{
                background: "radial-gradient(circle, #00e5ff 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
              animate={{
                opacity: [0, 0.9, 0.4, 0.9, 0],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
            />

            {/* Headlight glow right */}
            <motion.div
              className="absolute top-[40%] right-[5%] w-8 h-4 rounded-full -z-10"
              style={{
                background: "radial-gradient(circle, #00e5ff 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
              animate={{
                opacity: [0, 0.9, 0.4, 0.9, 0],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.0 }}
            />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="text-sm text-muted-foreground mt-4 tracking-widest uppercase"
          >
            Estacionamento Inteligente
          </motion.p>

          {/* Loading bar */}
          <motion.div
            className="mt-8 h-[2px] w-48 rounded-full overflow-hidden bg-muted/20"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-[#00e5ff] to-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 3.2, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="absolute bottom-6 text-[10px] text-muted-foreground/50"
          >
            © 2026 ME PARK — OSMARJR Sistemas
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
