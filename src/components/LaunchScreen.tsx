import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Branded cold-open for the installed app: the logo breathes in over the
 * page while it hydrates, then lifts away. Only runs when launched from
 * the home screen — the browser tab doesn't need a splash.
 */
export function LaunchScreen() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    );
  });

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 1600);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[120] bg-deep-space flex flex-col items-center justify-center"
        >
          {/* pulsing glow behind the wordmark */}
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-neon-magenta/25 blur-3xl"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.15, 1], opacity: [0, 0.9, 0.5] }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <motion.span
            className="relative font-display text-4xl text-gradient-hero tracking-tight"
            initial={{ opacity: 0, y: 14, letterSpacing: "0.3em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0em" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            DOPAMINE
          </motion.span>
          <motion.div
            className="relative mt-5 h-0.5 w-24 rounded-full bg-gradient-button origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
