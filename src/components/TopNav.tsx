import { motion } from "framer-motion";
import { Search, Crown } from "lucide-react";

interface TopNavProps {
  isSubscriber: boolean;
  onSearchClick?: () => void;
  onUnlimitedClick?: () => void;
}

export function TopNav({ isSubscriber, onSearchClick, onUnlimitedClick }: TopNavProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-safe"
    >
      <div className="flex items-center justify-between h-16 bg-gradient-to-b from-deep-space via-deep-space/80 to-transparent">
        {/* Logo */}
        <div className="flex items-center gap-1">
          <span className="font-display text-2xl text-gradient-hero tracking-tight">DOPAMINE</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Search Button */}
          <motion.button
            onClick={onSearchClick}
            className="w-10 h-10 rounded-full bg-obsidian/80 backdrop-blur-sm flex items-center justify-center border border-chrome-silver/10 hover:border-electric-violet/50 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Search className="w-5 h-5 text-chrome-silver" />
          </motion.button>

          {/* Subscription status / CTA */}
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
      </div>
    </motion.header>
  );
}
