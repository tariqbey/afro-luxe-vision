import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoinBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

export function CoinBadge({ amount, size = "md", animated = false, className }: CoinBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <motion.div
      className={cn(
        "inline-flex items-center rounded-full bg-gradient-gold",
        sizeClasses[size],
        className
      )}
      whileHover={animated ? { scale: 1.05 } : undefined}
      whileTap={animated ? { scale: 0.95 } : undefined}
    >
      <motion.div
        animate={animated ? { rotateY: [0, 360] } : undefined}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
      >
        <Coins className={cn("text-deep-space", iconSizes[size])} />
      </motion.div>
      <span className="font-accent font-bold text-deep-space tabular-nums">
        {amount.toLocaleString()}
      </span>
    </motion.div>
  );
}
