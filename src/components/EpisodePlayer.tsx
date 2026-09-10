import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bookmark, Play, Pause,
  Volume2, VolumeX, Lock, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Series, Episode, Product } from "@/lib/types";
import { usePlatform, SHARES_REQUIRED, SHARE_WINDOW, SHARE_UNLOCK_ENABLED } from "@/contexts/PlatformContext";

/** Meta app "Dopamine" — enables the Messenger send-to-a-friend dialog. */
const FB_APP_ID = "995651536789114";
import { PremiumUnlockModal } from "./PremiumUnlockModal";
import { CommentsSheet } from "./CommentsSheet";
import { ShoppableCard } from "./ShoppableCard";
import { toast } from "@/hooks/use-toast";
import { usePlayLog } from "@/hooks/usePlayLog";

interface EpisodePlayerProps {
  series: Series;
  episodes: Episode[]; // sorted by episodeNumber
  /** Shoppable products keyed by episode id — sponsored content only */
  productsByEpisode?: Record<string, Product[]>;
  initialEpisodeNumber?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function EpisodePlayer({
  series, episodes, productsByEpisode = {}, initialEpisodeNumber = 1, isOpen, onClose,
}: EpisodePlayerProps) {
  const { isWatchable, saveProgress, savedIds, toggleSaved, subscribe, demoMode, sharesBySeries, recordShare, referralCode, user } = usePlatform();
  const { track: trackPlay } = usePlayLog(user?.id ?? null);

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
  const [elapsed, setElapsed] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastTapTime = useRef(0);
  const lastSavedAt = useRef(0);
  const dragY = useMotionValue(0);

  const currentEpisode = episodes[currentIndex];
  const pendingEpisode = pendingIndex !== null ? episodes[pendingIndex] : null;

  // If access is granted while the paywall is up — promo code redeemed, a
  // subscription lands, an admin grant — dismiss it and start the episode.
  // Without this the wall lingers until a manual reload.
  useEffect(() => {
    if (pendingIndex === null || !pendingEpisode) return;
    if (!isWatchable(pendingEpisode, series)) return;
    setPendingIndex(null);
    setCurrentIndex(pendingIndex);
    setProgress(0);
    setIsPlaying(true);
  }, [pendingIndex, pendingEpisode, isWatchable, series]);

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
    setElapsed(v.currentTime);
    if (v.duration && v.duration !== videoDuration) setVideoDuration(v.duration);
    trackPlay(series, currentEpisode, v.currentTime, v.duration);
    // persist resume point every ~5s
    if (Date.now() - lastSavedAt.current > 5000) {
      lastSavedAt.current = Date.now();
      saveProgress(series.id, currentEpisode, v.currentTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, currentEpisode, saveProgress, trackPlay]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.y < -threshold) goToIndex(currentIndex + 1);
    else if (info.offset.y > threshold) goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const backgroundOpacity = useTransform(dragY, [-200, 0, 200], [0.5, 1, 0.5]);

  /** Invite link carries the referral code so the growth tree is traceable. */
  const inviteUrl = () => {
    const base = `${window.location.origin}/?s=${series.id}`;
    return referralCode ? `${base}&r=${referralCode}` : base;
  };

  /** Opens a share channel; returns true if an invite plausibly went out. */
  const doShare = async (channel?: string): Promise<boolean> => {
    const url = inviteUrl();
    const text = `Watch ${series.title} on Dopamine — first 5 episodes free`;
    const msg = `${text} ${url}`;

    if (channel && channel !== "copy") {
      // Mobile gets app deep links; desktop gets web equivalents.
      // No Facebook app ID required — the Messenger deep link opens the app
      // directly, and desktop falls back to the public sharer dialog.
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const targets: Record<string, string> = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
        sms: isMobile
          ? `sms:${/iPhone|iPad|iPod/i.test(navigator.userAgent) ? "&" : "?"}body=${encodeURIComponent(msg)}`
          : "",
        messenger: isMobile
          ? `fb-messenger://share?link=${encodeURIComponent(url)}&app_id=${FB_APP_ID}`
          : `https://www.facebook.com/dialog/send?app_id=${FB_APP_ID}&link=${encodeURIComponent(url)}&redirect_uri=${encodeURIComponent(window.location.origin)}`,
        // X and Facebook expose real one-tap composers: the post arrives
        // pre-written and the viewer just confirms it.
        x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        // Instagram and TikTok have no web posting intent for personal
        // accounts, so the caption goes to the clipboard to paste instead.
        instagram: "",
        tiktok: "",
      };
      const target = targets[channel];
      if (target) {
        window.open(target, "_blank", "noopener");
        return true;
      }
      await navigator.clipboard.writeText(msg).catch(() => undefined);
      const paste: Record<string, string> = {
        instagram: "Caption copied — paste it into your story or a DM.",
        tiktok: "Caption copied — paste it into your TikTok post or bio.",
      };
      toast({
        title: "Caption copied 🔗",
        description: paste[channel] ?? "Paste it into a text to a friend.",
      });
      // Opening the app right after the copy makes it a two-tap post.
      if (channel === "instagram" || channel === "tiktok") {
        window.open(channel === "instagram" ? "https://instagram.com" : "https://tiktok.com", "_blank", "noopener");
      }
      return true;
    }

    if (channel === "copy") {
      try {
        await navigator.clipboard.writeText(msg);
        toast({ title: "Link copied 🔗", description: "Send it to a friend — it counts as an invite." });
      } catch {
        toast({ title: "Share this link", description: url });
      }
      return true;
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: series.title, text, url });
        return true;
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return false; // user closed the sheet
    }
    try {
      await navigator.clipboard.writeText(msg);
      toast({ title: "Link copied 🔗", description: "Send it to a friend — it counts as an invite." });
      return true;
    } catch {
      toast({ title: "Share this link", description: url });
      return true;
    }
  };

  /** Share-wall CTA: invite, count it, and unlock when the target is hit. */
  const handleShareToUnlock = useCallback(async (channel?: string) => {
    const shared = await doShare(channel);
    if (!shared) return;
    const count = await recordShare(series.id);
    if (count >= SHARES_REQUIRED && pendingIndex !== null) {
      const idx = pendingIndex;
      setPendingIndex(null);
      setCurrentIndex(idx);
      setProgress(0);
      setIsPlaying(true);
      toast({ title: "Unlocked! 🎉", description: `The next ${SHARE_WINDOW} episodes are yours. Keep watching.` });
    } else if (count < SHARES_REQUIRED) {
      toast({ title: `${count} / ${SHARES_REQUIRED} invited`, description: `${SHARES_REQUIRED - count} more to unlock the next ${SHARE_WINDOW} episodes.` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series.id, recordShare, pendingIndex, referralCode]);

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

  // No exit animation on purpose: an exit that stalls (backgrounded tab,
  // throttled rAF) strands this overlay with its <video> still playing.
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] bg-deep-space"
    >
      {/* On tablets/desktop the vertical video lives in a centered 9:16
          column (TikTok-web style) instead of cropping to fill the screen */}
      <div className="relative h-full w-full mx-auto overflow-hidden md:max-w-[calc(100dvh*9/16)]">
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

      {/* Getting out is never hidden behind the auto-hiding controls, and the
          close button sits on the RIGHT — the phone's clock lives in the top
          left and was covering it. 48px target, comfortably tappable. */}
      <div className="absolute top-0 left-0 right-0 z-40 pt-safe pointer-events-none">
        <div className="flex items-center justify-end px-3 pt-1">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close player"
            className="pointer-events-auto w-12 h-12 rounded-full bg-deep-space/70 backdrop-blur-md flex items-center justify-center ring-1 ring-pure-white/10"
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6 text-pure-white" />
          </motion.button>
        </div>
      </div>

      {/* Mute — secondary, so it takes the left slot and may auto-hide */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-30 pt-safe pointer-events-none"
          >
            <div className="flex items-center justify-start px-3 pt-1">
              <motion.button
                onClick={() => {
                  setIsMuted((m) => {
                    if (videoRef.current) videoRef.current.muted = !m;
                    return !m;
                  });
                }}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="pointer-events-auto w-12 h-12 rounded-full bg-deep-space/50 backdrop-blur-sm flex items-center justify-center"
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
      <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-5">
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

      {/* Shoppable overlay — sponsored episodes only */}
      <ShoppableCard
        products={productsByEpisode[currentEpisode.id] ?? []}
        sponsorName={series.sponsorName}
        currentTime={elapsed}
        duration={videoDuration}
        episodeId={currentEpisode.id}
      />

      {/* Title card. The episode owns the frame — this only appears on a tap,
          alongside the rest of the controls, then gets out of the way again. */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-16 z-30 p-4 pb-8 pointer-events-none bg-gradient-to-t from-deep-space/80 to-transparent"
          >
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
                : `Episode ${currentEpisode.episodeNumber}`}
            </span>
            {isFreeWindow && currentEpisode.episodeNumber > 0 && (
              <span className="inline-block px-2.5 py-1 rounded-md bg-liquid-gold/20 text-xs font-medium text-liquid-gold">
                Free
              </span>
            )}
          </div>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

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
      </div>

      <PremiumUnlockModal
        isOpen={pendingIndex !== null}
        onClose={() => setPendingIndex(null)}
        videoTitle={`${series.title} — Episode ${pendingEpisode?.episodeNumber ?? ""}`}
        thumbnail={pendingEpisode?.thumbnailUrl ?? series.coverUrl ?? ""}
        subscribing={subscribing}
        onSubscribe={handleSubscribe}
        variant={
          SHARE_UNLOCK_ENABLED &&
          pendingEpisode &&
          pendingEpisode.episodeNumber <= series.freeEpisodes + SHARE_WINDOW
            ? "share"
            : "subscribe"
        }
        shares={sharesBySeries[series.id] ?? 0}
        sharesRequired={SHARES_REQUIRED}
        onShare={handleShareToUnlock}
        onRedeemed={() => {
          if (pendingIndex !== null) {
            const idx = pendingIndex;
            setPendingIndex(null);
            setCurrentIndex(idx);
            setProgress(0);
            setIsPlaying(true);
          }
        }}
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
