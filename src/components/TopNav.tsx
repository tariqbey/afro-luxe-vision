import { motion } from "framer-motion";
import { Search, Coins } from "lucide-react";

interface TopNavProps {
  coinBalance: number;
  onSearchClick?: () => void;
  onCoinsClick?: () => void;
}

export function TopNav({ coinBalance, onSearchClick, onCoinsClick }: TopNavProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-safe"
    >
      <div className="flex items-center justify-between h-16 bg-gradient-to-b from-deep-space via-deep-space/80 to-transparent">
        {/* Logo */}
        <div className="flex items-center gap-1">
          <span className="font-display text-2xl text-pure-white tracking-tight">The </span>
          <span className="font-display text-2xl text-gradient-hero tracking-tight">FIIIX</span>
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

          {/* Coin Balance */}
          <motion.button
            onClick={onCoinsClick}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-gold"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
          >
            <Coins className="w-4 h-4 text-deep-space" />
            <span className="font-accent font-bold text-sm text-deep-space tabular-nums">
              {coinBalance.toLocaleString()}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
