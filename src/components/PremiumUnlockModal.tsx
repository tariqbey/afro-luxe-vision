import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Play, Loader2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  thumbnail: string;
  breadCost: number;
  currentBalance: number;
  unlocking?: boolean;
  subscribing?: boolean;
  onUnlock: () => void;
  onBuyBread: () => void;
  onSubscribe: () => void;
}

export function PremiumUnlockModal({
  isOpen,
  onClose,
  videoTitle,
  thumbnail,
  breadCost,
  currentBalance,
  unlocking = false,
  subscribing = false,
  onUnlock,
  onBuyBread,
  onSubscribe,
}: PremiumUnlockModalProps) {
  const canAfford = currentBalance >= breadCost;

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
            className="fixed inset-x-0 bottom-0 z-[81] max-h-[85vh] rounded-t-3xl overflow-hidden bg-obsidian border-t-2 border-electric-violet/30"
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

            {/* Blurred Video Preview */}
            <div className="relative mx-6 rounded-2xl overflow-hidden aspect-video mb-6">
              <img src={thumbnail} alt={videoTitle} className="w-full h-full object-cover blur-sm scale-105" />
              <div className="absolute inset-0 bg-deep-space/50 flex flex-col items-center justify-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Lock className="w-10 h-10 text-liquid-gold" />
                </motion.div>
                <span className="font-display text-sm text-pure-white uppercase tracking-wide">Locked Episode</span>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-8 space-y-5">
              <div className="text-center space-y-2">
                <h3 className="font-display text-xl text-pure-white uppercase">{videoTitle}</h3>
                <p className="text-sm text-muted-foreground">Keep watching with Dopamine Unlimited</p>
              </div>

              {/* Subscription — the headline offer */}
              <motion.button
                onClick={onSubscribe}
                disabled={subscribing}
                className="w-full rounded-2xl bg-gradient-button p-4 text-left shadow-glow-magenta disabled:opacity-60"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-7 h-7 text-liquid-gold" />
                    <div>
                      <p className="font-display text-base text-pure-white uppercase tracking-wide">
                        {subscribing ? "Starting..." : "Unlimited"}
                      </p>
                      <p className="text-xs text-pure-white/80">
                        Every episode. Every series. Cancel anytime.
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-accent font-bold text-xl text-pure-white">$5.99</p>
                    <p className="text-[10px] text-pure-white/70 uppercase">/month</p>
                  </div>
                </div>
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-chrome-silver/10" />
                <span className="text-xs text-muted-foreground">or just this episode</span>
                <div className="flex-1 h-px bg-chrome-silver/10" />
              </div>

              {/* À la carte Bread unlock */}
              {canAfford ? (
                <motion.button
                  onClick={onUnlock}
                  disabled={unlocking}
                  className="w-full h-13 py-3.5 rounded-2xl border border-liquid-gold/40 font-body font-semibold text-sm text-liquid-gold flex items-center justify-center gap-2 disabled:opacity-60"
                  whileTap={{ scale: 0.98 }}
                >
                  {unlocking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  {unlocking ? "Unlocking..." : `Unlock for ${breadCost} 🍞 (you have ${currentBalance.toLocaleString()})`}
                </motion.button>
              ) : (
                <motion.button
                  onClick={onBuyBread}
                  className="w-full h-13 py-3.5 rounded-2xl border border-chrome-silver/20 font-body font-semibold text-sm text-chrome-silver flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🍞</span>
                  Get Bread — this episode is {breadCost} 🍞
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
