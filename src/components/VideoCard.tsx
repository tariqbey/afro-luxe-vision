import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Lock, Eye, Heart, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  creator: string;
  creatorAvatar?: string;
  duration: string;
  views: string;
  likes: string;
  episode?: number;
  isNew?: boolean;
  isPremium?: boolean;
  coinCost?: number;
  progress?: number;
  isVerified?: boolean;
  channel?: "afropunk" | "codeblack" | "lol" | "essence";
  onVideoClick?: (videoId: string) => void;
}

export function VideoCard({
  id,
  title,
  thumbnail,
  creator,
  creatorAvatar,
  duration,
  views,
  likes,
  episode,
  isNew = false,
  isPremium = false,
  coinCost,
  progress,
  isVerified = false,
  channel,
  onVideoClick,
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const channelBorderColor = {
    afropunk: "border-afropunk-blue",
    codeblack: "border-codeblack-orange",
    lol: "border-lol-pink",
    essence: "border-essence-rose",
  };

  return (
    <motion.div
      className="relative group cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => onVideoClick?.(id)}
    >
      {/* Thumbnail Container */}
      <div
        className={cn(
          "relative aspect-[9/16] rounded-xl overflow-hidden bg-obsidian",
          isNew && "ring-2 ring-neon-magenta animate-glow-pulse",
          channel && channelBorderColor[channel]
        )}
      >
        {/* Thumbnail Image */}
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 video-overlay" />

        {/* Top Left - Episode Badge */}
        {episode && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-deep-space/70 backdrop-blur-sm">
            <span className="text-xs font-medium text-chrome-silver">EP {episode}</span>
          </div>
        )}

        {/* Top Right - Duration */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-deep-space/70 backdrop-blur-sm">
          <span className="text-xs font-medium text-chrome-silver">{duration}</span>
        </div>

        {/* NEW Badge */}
        {isNew && (
          <div className="absolute top-12 left-3 px-2.5 py-1 rounded-md bg-neon-magenta">
            <span className="text-xs font-bold text-pure-white uppercase tracking-wide">New</span>
          </div>
        )}

        {/* Play Button Overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-pure-white/20 backdrop-blur-sm flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-8 h-8 text-pure-white fill-pure-white ml-1" />
          </motion.div>
        </motion.div>

        {/* Premium Lock Overlay */}
        {isPremium && (
          <div className="absolute inset-0 bg-deep-space/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Lock className="w-10 h-10 text-liquid-gold" />
            {coinCost && (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-gold">
                <Coins className="w-4 h-4 text-deep-space" />
                <span className="text-sm font-bold text-deep-space">{coinCost}</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          {progress !== undefined && progress > 0 && (
            <div className="h-1 w-full bg-chrome-silver/20 rounded-full mb-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-button rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}

          {/* Coin Cost Badge */}
          {coinCost && !isPremium && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-gold mb-2">
              <Coins className="w-3.5 h-3.5 text-deep-space" />
              <span className="text-xs font-bold text-deep-space">{coinCost}</span>
            </div>
          )}
        </div>
      </div>

      {/* Metadata Below Thumbnail */}
      <div className="mt-3 space-y-1.5">
        <h3 className="text-card-title text-chrome-silver line-clamp-2">{title}</h3>
        
        <div className="flex items-center gap-2">
          {creatorAvatar && (
            <img
              src={creatorAvatar}
              alt={creator}
              className="w-5 h-5 rounded-full object-cover"
            />
          )}
          <span className="text-sm text-muted-foreground">{creator}</span>
          {isVerified && (
            <svg className="w-4 h-4 text-electric-violet" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{views}</span>
          </div>
          <span className="opacity-50">•</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="flex items-center gap-1 hover:text-neon-magenta transition-colors"
          >
            <Heart
              className={cn(
                "w-3.5 h-3.5 transition-all",
                isLiked && "fill-neon-magenta text-neon-magenta animate-heart-burst"
              )}
            />
            <span>{likes}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
