import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  thumbnail: string;
  breadCost: number;
  currentBalance: number;
  unlocking?: boolean;
  onUnlock: () => void;
  onBuyBread: () => void;
}

export function PremiumUnlockModal({
  isOpen,
  onClose,
  videoTitle,
  thumbnail,
  breadCost,
  currentBalance,
  unlocking = false,
  onUnlock,
  onBuyBread,
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
                <p className="text-sm text-muted-foreground">Unlock with Bread to keep watching</p>
              </div>

              {/* Cost Display */}
              <div className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-muted/30 border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍞</span>
                  <span className="font-accent font-bold text-2xl text-liquid-gold tabular-nums">{breadCost}</span>
                </div>
                <span className="text-muted-foreground">Bread</span>
              </div>

              {/* Balance Info */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Your Bread: </span>
                <span className={cn("font-accent font-bold", canAfford ? "text-liquid-gold" : "text-destructive")}>
                  {currentBalance.toLocaleString()}
                </span>
                {!canAfford && (
                  <span className="text-destructive text-xs block mt-1">
                    You need {breadCost - currentBalance} more Bread
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {canAfford ? (
                  <motion.button
                    onClick={onUnlock}
                    disabled={unlocking}
                    className="w-full h-14 rounded-2xl bg-gradient-gold font-display text-base text-deep-space uppercase tracking-wide flex items-center justify-center gap-2 shadow-glow-gold disabled:opacity-60"
                    whileTap={{ scale: 0.98 }}
                  >
                    {unlocking ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 fill-current" />
                    )}
                    {unlocking ? "Unlocking..." : "Unlock & Watch"}
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={onBuyBread}
                    className="w-full h-14 rounded-2xl bg-gradient-button font-display text-base text-pure-white uppercase tracking-wide flex items-center justify-center gap-2 shadow-glow-magenta"
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-lg">🍞</span>
                    Get Bread
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
