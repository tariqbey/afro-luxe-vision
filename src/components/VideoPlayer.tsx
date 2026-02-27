import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bookmark, Play, Pause,
  ChevronLeft, Volume2, VolumeX, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoCardProps } from "./VideoCard";

interface VideoPlayerProps {
  videos: VideoCardProps[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayer({ videos, initialIndex = 0, isOpen, onClose }: VideoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({});
  const [isBookmarked, setIsBookmarked] = useState<Record<string, boolean>>({});
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const [showComments, setShowComments] = useState(false);
  const [progress, setProgress] = useState(35);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastTapTime = useRef(0);
  const dragY = useMotionValue(0);
  const currentVideo = videos[currentIndex];

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(controlsTimer.current);
  }, [showControls]);

  // Reset index when opened
  useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  const handleTap = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    lastTapTime.current = now;

    if (timeSinceLastTap < 300) {
      // Double tap - like
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setHeartPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setShowHeartBurst(true);
      setIsLiked((prev) => ({ ...prev, [currentVideo.id]: true }));
      setTimeout(() => setShowHeartBurst(false), 800);
    } else {
      // Single tap - toggle controls
      setTimeout(() => {
        if (Date.now() - lastTapTime.current >= 300) {
          setShowControls((prev) => !prev);
        }
      }, 300);
    }
  }, [currentVideo]);

  const goToVideo = useCallback((direction: "next" | "prev") => {
    if (direction === "next" && currentIndex < videos.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(Math.random() * 40 + 10);
    } else if (direction === "prev" && currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(Math.random() * 40 + 10);
    }
  }, [currentIndex, videos.length]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.y < -threshold) {
      goToVideo("next");
    } else if (info.offset.y > threshold) {
      goToVideo("prev");
    }
  }, [goToVideo]);

  const backgroundOpacity = useTransform(dragY, [-200, 0, 200], [0.5, 1, 0.5]);

  if (!isOpen || !currentVideo) return null;

  const videoLiked = isLiked[currentVideo.id] || false;
  const videoBookmarked = isBookmarked[currentVideo.id] || false;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-deep-space"
    >
      {/* Swipeable Video Area */}
      <motion.div
        className="absolute inset-0 touch-none"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        style={{ y: dragY, opacity: backgroundOpacity }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVideo.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
            onClick={handleTap}
          >
            {/* Video Background (using thumbnail as placeholder) */}
            <img
              src={currentVideo.thumbnail}
              alt={currentVideo.title}
              className="w-full h-full object-cover"
            />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-deep-space/40 via-transparent to-deep-space/80" />
          </motion.div>
        </AnimatePresence>

        {/* Double-tap Heart Animation */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute pointer-events-none z-20"
              style={{ left: heartPosition.x - 40, top: heartPosition.y - 40 }}
            >
              <Heart className="w-20 h-20 text-neon-magenta fill-neon-magenta drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/Pause Indicator */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <div className="w-16 h-16 rounded-full bg-deep-space/40 backdrop-blur-sm flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-pure-white" />
                ) : (
                  <Play className="w-8 h-8 text-pure-white fill-pure-white ml-1" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Always-visible back button */}
      <div className="absolute top-0 left-0 right-0 z-40 pt-safe">
        <div className="flex items-center justify-between px-4 h-14">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-10 h-10 rounded-full bg-deep-space/60 backdrop-blur-md flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-6 h-6 text-pure-white" />
          </motion.button>
          <div />
        </div>
      </div>

      {/* Top Controls (mute/more) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-30 pt-safe"
          >
            <div className="flex items-center justify-end px-4 h-14">
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-10 h-10 rounded-full bg-deep-space/40 backdrop-blur-sm flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-pure-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-pure-white" />
                  )}
                </motion.button>
                <motion.button
                  className="w-10 h-10 rounded-full bg-deep-space/40 backdrop-blur-sm flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <MoreHorizontal className="w-5 h-5 text-pure-white" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Side Engagement Sidebar */}
      <div className="absolute right-3 bottom-32 z-30 flex flex-col items-center gap-6">
        {/* Like */}
        <motion.button
          onClick={() => setIsLiked((prev) => ({ ...prev, [currentVideo.id]: !videoLiked }))}
          className="flex flex-col items-center gap-1"
          whileTap={{ scale: 0.85 }}
        >
          <motion.div
            animate={videoLiked ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart
              className={cn(
                "w-8 h-8 drop-shadow-lg",
                videoLiked ? "text-neon-magenta fill-neon-magenta" : "text-pure-white"
              )}
            />
          </motion.div>
          <span className="text-xs font-accent font-medium text-pure-white tabular-nums">
            {currentVideo.likes}
          </span>
        </motion.button>

        {/* Comment */}
        <motion.button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1"
          whileTap={{ scale: 0.85 }}
        >
          <MessageCircle className="w-8 h-8 text-pure-white drop-shadow-lg" />
          <span className="text-xs font-accent font-medium text-pure-white">847</span>
        </motion.button>

        {/* Share */}
        <motion.button
          className="flex flex-col items-center gap-1"
          whileTap={{ scale: 0.85 }}
        >
          <Share2 className="w-7 h-7 text-pure-white drop-shadow-lg" />
          <span className="text-xs font-accent font-medium text-pure-white">Share</span>
        </motion.button>

        {/* Bookmark */}
        <motion.button
          onClick={() => setIsBookmarked((prev) => ({ ...prev, [currentVideo.id]: !videoBookmarked }))}
          className="flex flex-col items-center gap-1"
          whileTap={{ scale: 0.85 }}
        >
          <Bookmark
            className={cn(
              "w-7 h-7 drop-shadow-lg",
              videoBookmarked ? "text-liquid-gold fill-liquid-gold" : "text-pure-white"
            )}
          />
          <span className="text-xs font-accent font-medium text-pure-white">Save</span>
        </motion.button>

        {/* Creator Avatar */}
        <motion.div
          className="relative"
          whileTap={{ scale: 0.9 }}
        >
          <img
            src={currentVideo.thumbnail}
            alt={currentVideo.creator}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-pure-white"
          />
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-neon-magenta flex items-center justify-center">
            <span className="text-[9px] font-bold text-pure-white">+</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Video Info */}
      <div className="absolute bottom-0 left-0 right-16 z-30 p-4 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-body font-bold text-pure-white text-base">
              @{currentVideo.creator.replace(/\s/g, "").toLowerCase()}
            </span>
            {currentVideo.isVerified && (
              <svg className="w-4 h-4 text-electric-violet" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
          </div>
          <h3 className="font-display text-pure-white text-lg uppercase leading-tight">
            {currentVideo.title}
          </h3>
          {currentVideo.episode && (
            <span className="inline-block px-2.5 py-1 rounded-md bg-electric-violet/30 text-xs font-medium text-electric-violet">
              Episode {currentVideo.episode}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-chrome-silver/20">
        <motion.div
          className="h-full bg-gradient-button"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Swipe Indicator */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30">
        <AnimatePresence>
          {showControls && currentIndex < videos.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.6, y: [0, 5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ y: { duration: 1.5, repeat: Infinity } }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[10px] text-pure-white/60 font-medium">Swipe up for next</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comments Sheet */}
      <AnimatePresence>
        {showComments && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40"
              onClick={() => setShowComments(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "40%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-x-0 bottom-0 top-0 z-50 rounded-t-3xl bg-obsidian border-t border-chrome-silver/10"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-chrome-silver/30" />
              </div>
              <div className="px-4 pb-3 border-b border-border">
                <h3 className="font-display text-lg text-pure-white text-center">847 Comments</h3>
              </div>
              <div className="px-4 py-6 space-y-4 overflow-y-auto" style={{ maxHeight: "50vh" }}>
                {[
                  { user: "CultureKing", text: "This episode hit different 🔥🔥🔥", time: "2h", likes: "1.2K" },
                  { user: "QueenVibes", text: "Best series on The FIIIX hands down", time: "4h", likes: "892" },
                  { user: "MarcusTheCreator", text: "The cinematography is insane", time: "6h", likes: "456" },
                ].map((comment, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-chrome-silver">@{comment.user}</span>
                        <span className="text-xs text-muted-foreground">{comment.time}</span>
                      </div>
                      <p className="text-sm text-chrome-silver/80">{comment.text}</p>
                      <button className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="w-3 h-3" /> {comment.likes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
