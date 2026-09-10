import { motion } from "framer-motion";
import { Crown } from "lucide-react";

interface TopNavProps {
  isSubscriber: boolean;
  onUnlimitedClick?: () => void;
}

/**
 * Sits in the page flow rather than floating over it. Cover art is the whole
 * pitch on this app — a translucent bar riding on top of it was covering the
 * title treatment and the cast credits printed into the poster.
 */
export function TopNav({ isSubscriber, onUnlimitedClick }: TopNavProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 px-4 pt-safe bg-deep-space"
    >
      <div className="flex items-center justify-between h-16">
        <span className="font-display text-2xl text-gradient-hero tracking-tight">DOPAMINE</span>

        {isSubscriber ? (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-obsidian/80 border border-liquid-gold/40">
            <Crown className="w-4 h-4 text-liquid-gold" />
            <span className="font-accent font-bold text-xs text-liquid-gold uppercase tracking-wide">
              Unlimited
            </span>
          </div>
        ) : (
          <motion.button
            onClick={onUnlimitedClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-button shadow-glow-magenta"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
          >
            <Crown className="w-4 h-4 text-liquid-gold" />
            <span className="font-accent font-bold text-xs text-pure-white uppercase tracking-wide">
              Go Unlimited
            </span>
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}
