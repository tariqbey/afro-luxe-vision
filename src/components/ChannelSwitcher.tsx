import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type Channel = "all" | "afropunk" | "codeblack" | "lol" | "essence";

interface ChannelSwitcherProps {
  activeChannel: Channel;
  onChannelChange: (channel: Channel) => void;
}

const channels: { id: Channel; label: string; color: string }[] = [
  { id: "all", label: "FOR YOU", color: "bg-gradient-button" },
  { id: "afropunk", label: "AFROPUNK", color: "bg-afropunk-blue" },
  { id: "codeblack", label: "CODEBLACK", color: "bg-codeblack-orange" },
  { id: "lol", label: "LOL!", color: "bg-lol-pink" },
  { id: "essence", label: "ESSENCE", color: "bg-essence-rose" },
];

export function ChannelSwitcher({ activeChannel, onChannelChange }: ChannelSwitcherProps) {
  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1 snap-x snap-mandatory">
        {channels.map((channel) => {
          const isActive = activeChannel === channel.id;
          
          return (
            <motion.button
              key={channel.id}
              onClick={() => onChannelChange(channel.id)}
              className={cn(
                "relative flex-shrink-0 px-5 py-2.5 rounded-full font-display text-sm tracking-wide transition-all duration-300 snap-center",
                isActive
                  ? "text-pure-white"
                  : "text-chrome-silver/70 hover:text-chrome-silver border border-chrome-silver/30 hover:border-chrome-silver/50"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeChannel"
                  className={cn("absolute inset-0 rounded-full", channel.color)}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{channel.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
