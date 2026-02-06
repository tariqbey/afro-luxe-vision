import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Sparkles, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoinPackage {
  id: string;
  amount: number;
  bonus: number;
  price: string;
  popular?: boolean;
  bestValue?: boolean;
}

const coinPackages: CoinPackage[] = [
  { id: "starter", amount: 100, bonus: 0, price: "$1.99" },
  { id: "popular", amount: 500, bonus: 50, price: "$7.99", popular: true },
  { id: "premium", amount: 1200, bonus: 200, price: "$14.99" },
  { id: "ultimate", amount: 3000, bonus: 750, price: "$29.99", bestValue: true },
];

interface CoinPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

export function CoinPurchaseModal({ isOpen, onClose, currentBalance }: CoinPurchaseModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = () => {
    if (!selectedPackage) return;
    setPurchasing(true);
    setTimeout(() => {
      setPurchasing(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-deep-space/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-[10%] bottom-[10%] z-[61] flex flex-col rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(180deg, hsl(var(--obsidian)) 0%, hsl(var(--deep-space)) 100%)",
              border: "2px solid transparent",
              backgroundClip: "padding-box",
            }}
          >
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-3xl -z-10 p-[2px] bg-gradient-hero opacity-60" />

            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-display text-2xl text-pure-white uppercase tracking-tight">
                  Get Coins
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Balance: <span className="text-liquid-gold font-accent font-bold">{currentBalance.toLocaleString()}</span>
                </p>
              </div>
              <motion.button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-chrome-silver" />
              </motion.button>
            </div>

            {/* Coin Packages */}
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3 scrollbar-hide">
              {coinPackages.map((pkg, index) => (
                <motion.button
                  key={pkg.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={cn(
                    "relative w-full p-4 rounded-2xl border-2 text-left transition-all duration-200",
                    selectedPackage === pkg.id
                      ? "border-liquid-gold bg-liquid-gold/10"
                      : "border-border bg-muted/30 hover:border-muted-foreground/40"
                  )}
                >
                  {/* Popular / Best Value Badge */}
                  {(pkg.popular || pkg.bestValue) && (
                    <div className={cn(
                      "absolute -top-3 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      pkg.bestValue
                        ? "bg-gradient-gold text-deep-space"
                        : "bg-neon-magenta text-pure-white"
                    )}>
                      {pkg.bestValue ? "Best Value" : "Most Popular"}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Animated Coin Stack */}
                      <motion.div
                        className="relative w-14 h-14 flex items-center justify-center"
                        animate={selectedPackage === pkg.id ? { rotateY: [0, 360] } : {}}
                        transition={{ duration: 0.8 }}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center shadow-glow-gold">
                          <Coins className="w-6 h-6 text-deep-space" />
                        </div>
                        {pkg.bonus > 0 && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-neon-magenta flex items-center justify-center"
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Sparkles className="w-3 h-3 text-pure-white" />
                          </motion.div>
                        )}
                      </motion.div>

                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-accent font-bold text-xl text-pure-white tabular-nums">
                            {pkg.amount.toLocaleString()}
                          </span>
                          {pkg.bonus > 0 && (
                            <span className="text-sm font-bold text-liquid-gold">
                              +{pkg.bonus}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">coins</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-accent font-bold text-lg text-pure-white">
                        {pkg.price}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Payment Section */}
            <div className="flex-shrink-0 px-6 pb-6 space-y-4 border-t border-border/50 pt-4">
              {/* Payment Methods */}
              <div className="flex items-center justify-center gap-3">
                <div className="px-4 py-2 rounded-lg bg-muted/50 text-xs font-medium text-chrome-silver">
                  Apple Pay
                </div>
                <div className="px-4 py-2 rounded-lg bg-muted/50 text-xs font-medium text-chrome-silver">
                  Google Pay
                </div>
                <div className="px-4 py-2 rounded-lg bg-muted/50 text-xs font-medium text-chrome-silver">
                  Card
                </div>
              </div>

              {/* Purchase Button */}
              <motion.button
                onClick={handlePurchase}
                disabled={!selectedPackage || purchasing}
                className={cn(
                  "w-full h-14 rounded-2xl font-display text-base uppercase tracking-wide flex items-center justify-center gap-2 transition-all",
                  selectedPackage
                    ? "bg-gradient-button text-pure-white shadow-glow-magenta"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                whileTap={selectedPackage ? { scale: 0.98 } : undefined}
              >
                {purchasing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Coins className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {selectedPackage ? "Purchase Now" : "Select a Package"}
                  </>
                )}
              </motion.button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                <span>Secure payment · Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
