import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bookmark, Play, Pause,
  ChevronLeft, Volume2, VolumeX, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Series, Episode } from "@/lib/types";
import { usePlatform } from "@/contexts/PlatformContext";
import { PremiumUnlockModal } from "./PremiumUnlockModal";
import { CommentsSheet } from "./CommentsSheet";
import { toast } from "@/hooks/use-toast";

interface EpisodePlayerProps {
  series: Series;
  episodes: Episode[]; // sorted by episodeNumber
  initialEpisodeNumber?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function EpisodePlayer({
  series, episodes, initialEpisodeNumber = 1, isOpen, onClose,
}: EpisodePlayerProps) {
  const { isWatchable, saveProgress, savedIds, toggleSaved, subscribe, demoMode } = usePlatform();

  const startIdx = Math.max(0, episodes.findIndex((e) => e.episodeNumber === initialEpisodeNumber));
  const [currentIndex, setCurrentIndex] = useState(startIdx === -1 ? 0 : startIdx);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastTapTime = useRef(0);
  const lastSavedAt = useRef(0);
  const dragY = useMotionValue(0);

  const currentEpisode = episodes[currentIndex];
  const pendingEpisode = pendingIndex !== null ? episodes[pendingIndex] : null;

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(controlsTimer.current);
  }, [showControls]);

  useEffect(() => {
    if (isOpen) {
      const idx = Math.max(0, episodes.findIndex((e) => e.episodeNumber === initialEpisodeNumber));
      const target = episodes[idx];
      // The resume point must pass the gate too — a saved position can land on
      // an episode that's since been locked (free window changed, sub lapsed).
      if (target && !isWatchable(target, series)) {
        let lastWatchableIdx = 0;
        for (let i = idx - 1; i >= 0; i--) {
          if (isWatchable(episodes[i], series)) { lastWatchableIdx = i; break; }
        }
        setCurrentIndex(lastWatchableIdx);
        setPendingIndex(idx); // opens the paywall
        setIsPlaying(false);
      } else {
        setCurrentIndex(idx);
        setIsPlaying(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialEpisodeNumber]);

  // Browsers may block unmuted autoplay — retry muted rather than sitting paused.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isOpen) return;
    const tryPlay = async () => {
      try {
        await v.play();
      } catch {
        v.muted = true;
        setIsMuted(true);
        v.play().catch(() => setIsPlaying(false));
      }
    };
    tryPlay();
  }, [isOpen, currentIndex]);

  /** Move to an episode index, enforcing the Bread gate. */
  const goToIndex = useCallback((idx: number) => {
    if (idx < 0 || idx >= episodes.length) return;
    const target = episodes[idx];
    if (isWatchable(target, series)) {
      setCurrentIndex(idx);
      setProgress(0);
      setIsPlaying(true);
    } else {
      setPendingIndex(idx); // opens the unlock sheet
      setIsPlaying(false);
    }
  }, [episodes, isWatchable, series]);

  // THE core loop: episode ends → next one starts (or paywall appears)
  const handleEnded = useCallback(() => {
    if (currentIndex < episodes.length - 1) {
      goToIndex(currentIndex + 1);
    } else {
      setShowControls(true); // end of series
    }
  }, [currentIndex, episodes.length, goToIndex]);

  const handleSubscribe = useCallback(async () => {
    if (subscribing) return;
    setSubscribing(true);
    const result = await subscribe();
    setSubscribing(false);
    if (result.ok && demoMode && pendingIndex !== null) {
      // demo mode activates instantly — resume playback right away
      const idx = pendingIndex;
      setPendingIndex(null);
      setCurrentIndex(idx);
      setProgress(0);
      setIsPlaying(true);
      toast({ title: "Dopamine Unlimited active 👑", description: "Demo mode — no card charged." });
    } else if (!result.ok && result.error === "not_authenticated") {
      toast({ title: "Sign in to subscribe", description: "Create an account so your subscription follows you." });
    } else if (!result.ok) {
      toast({ title: "Checkout unavailable", description: "Please try again in a moment.", variant: "destructive" });
    }
    // real mode redirects to Stripe Checkout
  }, [subscribe, subscribing, demoMode, pendingIndex]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  }, []);

  const handleTap = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    lastTapTime.current = now;

    if (timeSinceLastTap < 300) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setHeartPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setShowHeartBurst(true);
      setIsLiked((prev) => ({ ...prev, [currentEpisode.id]: true }));
      setTimeout(() => setShowHeartBurst(false), 800);
    } else {
      setTimeout(() => {
        if (Date.now() - lastTapTime.current >= 300) {
          setShowControls((prev) => !prev);
          togglePlay();
        }
      }, 300);
    }
  }, [currentEpisode, togglePlay]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
    // persist resume point every ~5s
    if (Date.now() - lastSavedAt.current > 5000) {
      lastSavedAt.current = Date.now();
      saveProgress(series.id, currentEpisode, v.currentTime);
    }
  }, [series.id, currentEpisode, saveProgress]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.y < -threshold) goToIndex(currentIndex + 1);
    else if (info.offset.y > threshold) goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const backgroundOpacity = useTransform(dragY, [-200, 0, 200], [0.5, 1, 0.5]);

  const handleShare = async () => {
    const url = `${window.location.origin}/?s=${series.id}`;
    const text = `${series.title} on Dopamine — first episodes free 🍞`;
    // 1) native share sheet
    try {
      if (navigator.share) {
        await navigator.share({ title: series.title, text, url });
        return;
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return; // user closed the sheet
    }
    // 2) clipboard
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied 🔗", description: "Share it anywhere — the series opens straight from the link." });
      return;
    } catch {
      // 3) last resort: show the link so it can be copied by hand
      toast({ title: "Share this link", description: url });
    }
  };

  if (!isOpen || !currentEpisode) return null;

  const videoLiked = isLiked[currentEpisode.id] || false;
  const seriesSaved = savedIds.has(series.id);
  const isFreeWindow = currentEpisode.episodeNumber <= series.freeEpisodes;
  const episodeLabel = currentEpisode.episodeNumber === 0
    ? "Trailer"
    : `Episode ${currentEpisode.episodeNumber}`;

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
        {/* key remounts the whole block per episode — no AnimatePresence here,
            it can strand a stale <video> with a stale onEnded closure */}
          <motion.div
            key={currentEpisode.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
            onClick={handleTap}
          >
            {currentEpisode.videoUrl ? (
              <video
                ref={videoRef}
                key={currentEpisode.id}
                src={currentEpisode.videoUrl}
                poster={currentEpisode.thumbnailUrl ?? undefined}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted={isMuted}
                onEnded={handleEnded}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <img
                src={currentEpisode.thumbnailUrl ?? series.coverUrl ?? ""}
                alt={series.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-deep-space/40 via-transparent to-deep-space/80 pointer-events-none" />
          </motion.div>

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

      {/* Top Controls (mute) */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-30 pt-safe"
          >
            <div className="flex items-center justify-end px-4 h-14">
              <motion.button
                onClick={() => {
                  setIsMuted((m) => {
                    if (videoRef.current) videoRef.current.muted = !m;
                    return !m;
                  });
                }}
                className="w-10 h-10 rounded-full bg-deep-space/40 backdrop-blur-sm flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-pure-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-pure-white" />
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Side Engagement Sidebar */}
      <div className="absolute right-3 bottom-32 z-30 flex flex-col items-center gap-6">
        <motion.button
          onClick={() => setIsLiked((prev) => ({ ...prev, [currentEpisode.id]: !videoLiked }))}
          className="flex flex-col items-center gap-1"
          whileTap={{ scale: 0.85 }}
        >
          <motion.div animate={videoLiked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
            <Heart className={cn("w-8 h-8 drop-shadow-lg", videoLiked ? "text-neon-magenta fill-neon-magenta" : "text-pure-white")} />
          </motion.div>
          <span className="text-xs font-accent font-medium text-pure-white">Like</span>
        </motion.button>

        <motion.button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1"
          whileTap={{ scale: 0.85 }}
        >
          <MessageCircle className="w-8 h-8 text-pure-white drop-shadow-lg" />
          <span className="text-xs font-accent font-medium text-pure-white">Chat</span>
        </motion.button>

        <motion.button onClick={handleShare} className="flex flex-col items-center gap-1" whileTap={{ scale: 0.85 }}>
          <Share2 className="w-7 h-7 text-pure-white drop-shadow-lg" />
          <span className="text-xs font-accent font-medium text-pure-white">Share</span>
        </motion.button>

        <motion.button
          onClick={() => toggleSaved(series.id)}
          className="flex flex-col items-center gap-1"
          whileTap={{ scale: 0.85 }}
        >
          <Bookmark className={cn("w-7 h-7 drop-shadow-lg", seriesSaved ? "text-liquid-gold fill-liquid-gold" : "text-pure-white")} />
          <span className="text-xs font-accent font-medium text-pure-white">
            {seriesSaved ? "Saved" : "Save"}
          </span>
        </motion.button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-16 z-30 p-4 pb-8">
        <div className="space-y-2">
          <span className="font-body font-bold text-pure-white text-base">
            {series.creatorName ?? "Creator"}
          </span>
          <h3 className="font-display text-pure-white text-lg uppercase leading-tight">
            {series.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="inline-block px-2.5 py-1 rounded-md bg-electric-violet/30 text-xs font-medium text-electric-violet">
              {currentEpisode.episodeNumber === 0
                ? "Trailer"
                : `Episode ${currentEpisode.episodeNumber} of ${episodes.length}`}
            </span>
            {isFreeWindow && currentEpisode.episodeNumber > 0 && (
              <span className="inline-block px-2.5 py-1 rounded-md bg-liquid-gold/20 text-xs font-medium text-liquid-gold">
                Free
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar (real playback progress) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-chrome-silver/20">
        <div className="h-full bg-gradient-button" style={{ width: `${progress}%` }} />
      </div>

      {/* Swipe / Next-locked Indicator */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30">
        <AnimatePresence>
          {showControls && currentIndex < episodes.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.7, y: [0, 5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ y: { duration: 1.5, repeat: Infinity } }}
              className="flex flex-col items-center gap-1"
            >
              {!isWatchable(episodes[currentIndex + 1], series) ? (
                <span className="flex items-center gap-1 text-[10px] text-liquid-gold font-medium">
                  <Lock className="w-3 h-3" /> Next episode: members only
                </span>
              ) : (
                <span className="text-[10px] text-pure-white/60 font-medium">Swipe up for next</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bread paywall — appears when a locked episode is reached */}
      <PremiumUnlockModal
        isOpen={pendingIndex !== null}
        onClose={() => setPendingIndex(null)}
        videoTitle={`${series.title} — Episode ${pendingEpisode?.episodeNumber ?? ""}`}
        thumbnail={pendingEpisode?.thumbnailUrl ?? series.coverUrl ?? ""}
        subscribing={subscribing}
        onSubscribe={handleSubscribe}
      />

      <CommentsSheet
        episodeId={currentEpisode.id}
        episodeLabel={episodeLabel}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </motion.div>
  );
}
