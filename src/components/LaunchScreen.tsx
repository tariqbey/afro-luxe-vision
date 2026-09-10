import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandMark } from "./BrandMark";

/**
 * Branded cold-open for the installed app.
 *
 * The mark punches in, a gold edge draws itself around the bowl, the wordmark
 * fans out beneath it, and the whole thing lifts away as the feed hydrates.
 * Only runs when launched from the home screen — a browser tab doesn't need a
 * splash, and users who set "reduce motion" get a plain fade.
 */
const WORD = "DOPAMINE".split("");

export function LaunchScreen() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    // ?splash replays the cold open in a normal browser tab — handy for
    // showing the animation to someone without installing the app first.
    if (new URLSearchParams(window.location.search).has("splash")) return true;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    );
  });

  const calm =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), calm ? 900 : 2300);
    return () => clearTimeout(t);
  }, [show, calm]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          className="fixed inset-0 z-[120] bg-deep-space flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Light bloom behind the mark, timed to the punch-in */}
          <motion.div
            className="absolute w-72 h-72 rounded-full bg-neon-magenta/25 blur-3xl"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={
              calm
                ? { scale: 1, opacity: 0.4 }
                : { scale: [0.5, 1.25, 1.05], opacity: [0, 0.85, 0.45] }
            }
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* A single sweep of light crossing the mark, like a screening-room
              projector catching the logo */}
          {!calm && (
            <motion.div
              className="absolute h-40 w-24 rotate-12 bg-gradient-to-r from-transparent via-pure-white/20 to-transparent blur-md"
              initial={{ x: -180, opacity: 0 }}
              animate={{ x: 180, opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, delay: 0.75, ease: "easeInOut" }}
            />
          )}

          <BrandMark size={96} animated={!calm} className="relative drop-shadow-[0_0_30px_rgba(255,0,93,0.35)]" />

          {/* Letters fan out from the centre, then settle */}
          <div className="relative mt-6 flex">
            {WORD.map((letter, i) => (
              <motion.span
                key={`${letter}-${i}`}
                className="font-display text-2xl text-gradient-hero"
                initial={calm ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(6px)" }}
                animate={calm ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.5,
                  delay: calm ? 0.1 : 0.6 + i * 0.055,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          <motion.div
            className="relative mt-5 h-0.5 w-28 rounded-full bg-gradient-button origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, delay: 0.5, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
