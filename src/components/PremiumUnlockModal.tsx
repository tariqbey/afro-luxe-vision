import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Loader2, Crown, Check, Ticket, Share2, Gift } from "lucide-react";
import { usePlatform } from "@/contexts/PlatformContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PremiumUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  thumbnail: string;
  subscribing?: boolean;
  onSubscribe: () => void;
  /** Called after a promo code successfully unlocks access. */
  onRedeemed?: () => void;
  /** "share" shows the share-to-unlock wall; "subscribe" (default) the $5.99 wall. */
  variant?: "share" | "subscribe";
  shares?: number;
  sharesRequired?: number;
  onShare?: (channel?: string) => void;
}

const REDEEM_ERRORS: Record<string, string> = {
  invalid_code: "That code isn't valid.",
  code_exhausted: "That code has been fully claimed.",
  already_redeemed: "You've already used this code.",
  not_authenticated: "Sign in first, then enter your code.",
  unknown: "Something went wrong — try again.",
};

/** Subscription paywall — the only way past the free episodes. */
export function PremiumUnlockModal({
  isOpen,
  onClose,
  videoTitle,
  thumbnail,
  subscribing = false,
  onSubscribe,
  onRedeemed,
  variant = "subscribe",
  shares = 0,
  sharesRequired = 5,
  onShare,
}: PremiumUnlockModalProps) {
  const { redeemPromo } = usePlatform();
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async () => {
    if (!code.trim() || redeeming) return;
    setRedeeming(true);
    const result = await redeemPromo(code);
    setRedeeming(false);
    if (result.ok) {
      toast({
        title: "Code accepted 🎟️",
        description: `You've got ${result.days ?? 30} days of Dopamine Unlimited. Enjoy.`,
      });
      setCode("");
      setShowCode(false);
      onRedeemed?.();
    } else {
      toast({
        title: "Couldn't redeem",
        description: REDEEM_ERRORS[result.error ?? "unknown"] ?? REDEEM_ERRORS.unknown,
        variant: "destructive",
      });
    }
  };

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
                <span className="font-display text-sm text-pure-white uppercase tracking-wide">
                  {variant === "share" ? "Share to Unlock" : "Members Only"}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-8 space-y-5">
              <div className="text-center space-y-2">
                <h3 className="font-display text-xl text-pure-white uppercase">{videoTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  {variant === "share"
                    ? `Share with ${sharesRequired} people to unlock the next ${sharesRequired} episodes — free`
                    : "The story keeps going with Dopamine Unlimited"}
                </p>
              </div>

              {variant === "share" && (
                <>
                  {/* Share progress */}
                  <div className="flex items-center justify-center gap-2.5">
                    {Array.from({ length: sharesRequired }, (_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors",
                          i < shares
                            ? "bg-liquid-gold border-liquid-gold"
                            : "border-chrome-silver/25 bg-transparent"
                        )}
                      >
                        {i < shares
                          ? <Check className="w-4 h-4 text-deep-space" />
                          : <Share2 className="w-3.5 h-3.5 text-chrome-silver/40" />}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs text-muted-foreground -mt-2">
                    {shares} / {sharesRequired} friends invited
                  </p>

                  {/* Primary: native share sheet (picks contacts, one tap each) */}
                  <motion.button
                    onClick={() => onShare?.()}
                    className="w-full h-16 rounded-2xl bg-gradient-gold shadow-glow-gold flex items-center justify-center gap-3"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Gift className="w-6 h-6 text-deep-space" />
                    <span className="font-display text-lg text-deep-space uppercase tracking-wide">
                      Share &amp; Unlock
                    </span>
                  </motion.button>

                  {/* Per-channel shortcuts */}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { key: "whatsapp", label: "WhatsApp" },
                      { key: "sms", label: "Text" },
                      { key: "messenger", label: "Messenger" },
                      { key: "instagram", label: "Instagram" },
                      { key: "copy", label: "Copy" },
                    ].map((ch) => (
                      <motion.button
                        key={ch.key}
                        onClick={() => onShare?.(ch.key)}
                        className="py-2.5 rounded-xl bg-deep-space border border-chrome-silver/15 text-[10px] font-medium text-chrome-silver hover:border-liquid-gold/50 transition-colors"
                        whileTap={{ scale: 0.94 }}
                      >
                        {ch.label}
                      </motion.button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-chrome-silver/10" />
                    <span className="text-xs text-muted-foreground">or skip the sharing</span>
                    <div className="flex-1 h-px bg-chrome-silver/10" />
                  </div>

                  <motion.button
                    onClick={onSubscribe}
                    disabled={subscribing}
                    className="w-full py-3.5 rounded-2xl border border-electric-violet/40 font-body font-semibold text-sm text-electric-violet flex items-center justify-center gap-2 disabled:opacity-60"
                    whileTap={{ scale: 0.98 }}
                  >
                    {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                    Go Unlimited — every episode, $5.99/mo
                  </motion.button>
                </>
              )}

              {variant === "subscribe" && (
              <>
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
              </>
              )}

              {/* Promo code */}
              {showCode ? (
                <div className="flex items-center gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }}
                    placeholder="Enter code"
                    autoFocus
                    className="flex-1 px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/15 text-sm text-chrome-silver uppercase tracking-widest outline-none focus:border-liquid-gold placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground"
                  />
                  <motion.button
                    onClick={handleRedeem}
                    disabled={!code.trim() || redeeming}
                    className="px-5 py-3 rounded-xl bg-gradient-gold font-display text-sm text-deep-space uppercase tracking-wide disabled:opacity-50 flex-shrink-0"
                    whileTap={{ scale: 0.96 }}
                  >
                    {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redeem"}
                  </motion.button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCode(true)}
                  className="w-full text-center text-sm text-liquid-gold flex items-center justify-center gap-1.5"
                >
                  <Ticket className="w-4 h-4" /> Have a code?
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
