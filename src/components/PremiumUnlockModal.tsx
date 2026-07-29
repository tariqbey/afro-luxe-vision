import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Loader2, Crown, Check } from "lucide-react";

interface PremiumUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  thumbnail: string;
  subscribing?: boolean;
  onSubscribe: () => void;
}

/** Subscription paywall — the only way past the free episodes. */
export function PremiumUnlockModal({
  isOpen,
  onClose,
  videoTitle,
  thumbnail,
  subscribing = false,
  onSubscribe,
}: PremiumUnlockModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-deep-space/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[81] max-h-[85vh] rounded-t-3xl overflow-hidden bg-obsidian border-t-2 border-electric-violet/30 md:max-w-md md:mx-auto md:bottom-10 md:rounded-3xl md:border-2"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-chrome-silver/30" />
            </div>

            {/* Close */}
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center z-10"
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4 text-chrome-silver" />
            </motion.button>

            {/* Blurred Episode Preview */}
            <div className="relative mx-6 rounded-2xl overflow-hidden aspect-video mb-6">
              <img src={thumbnail} alt={videoTitle} className="w-full h-full object-cover blur-sm scale-105" />
              <div className="absolute inset-0 bg-deep-space/50 flex flex-col items-center justify-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Lock className="w-10 h-10 text-liquid-gold" />
                </motion.div>
                <span className="font-display text-sm text-pure-white uppercase tracking-wide">Members Only</span>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-8 space-y-5">
              <div className="text-center space-y-2">
                <h3 className="font-display text-xl text-pure-white uppercase">{videoTitle}</h3>
                <p className="text-sm text-muted-foreground">The story keeps going with Dopamine Unlimited</p>
              </div>

              {/* What you get */}
              <div className="space-y-2.5 px-2">
                {[
                  "Every episode of every series",
                  "New releases the moment they drop",
                  "Binge with autoplay — no interruptions",
                  "Cancel anytime",
                ].map((line) => (
                  <div key={line} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-liquid-gold flex-shrink-0" />
                    <span className="text-sm text-chrome-silver/85">{line}</span>
                  </div>
                ))}
              </div>

              {/* Subscribe CTA */}
              <motion.button
                onClick={onSubscribe}
                disabled={subscribing}
                className="w-full h-16 rounded-2xl bg-gradient-button shadow-glow-magenta flex items-center justify-center gap-3 disabled:opacity-60"
                whileTap={{ scale: 0.98 }}
              >
                {subscribing ? (
                  <Loader2 className="w-6 h-6 text-pure-white animate-spin" />
                ) : (
                  <Crown className="w-6 h-6 text-liquid-gold" />
                )}
                <span className="font-display text-lg text-pure-white uppercase tracking-wide">
                  {subscribing ? "Starting..." : "Go Unlimited — $5.99/mo"}
                </span>
              </motion.button>

              <p className="text-center text-xs text-muted-foreground">
                Secure payment via Stripe · Cancel anytime in your profile
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
