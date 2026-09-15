import { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Play, Lock, Bookmark, Share2, Film, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Series, Episode } from "@/lib/types";
import { usePlatform } from "@/contexts/PlatformContext";
import { toast } from "@/hooks/use-toast";

interface SeriesTitleScreenProps {
  series: Series;
  episodes: Episode[]; // sorted by episodeNumber
  isOpen: boolean;
  /** Leave the title screen entirely (back to the feed). */
  onClose: () => void;
  /** Start playback at a specific episode number. */
  onPlay: (episodeNumber: number) => void;
  /** Play the free trailer, when the series has one. */
  onTrailer?: () => void;
}

/**
 * The show's home base. Reached by backing out of an episode, so leaving a
 * scene drops the viewer into the catalog for that title rather than dumping
 * them all the way back to the feed.
 */
export function SeriesTitleScreen({
  series, episodes, isOpen, onClose, onPlay, onTrailer,
}: SeriesTitleScreenProps) {
  const { isWatchable, getProgress, savedIds, toggleSaved } = usePlatform();

  const progress = getProgress(series.id);
  const saved = savedIds.has(series.id);

  // Resume where they stopped; otherwise start at the top.
  const resumeNumber = useMemo(() => {
    if (progress && episodes.some((e) => e.episodeNumber === progress.episodeNumber)) {
      return progress.episodeNumber;
    }
    return episodes[0]?.episodeNumber ?? 1;
  }, [progress, episodes]);

  const handleShare = async () => {
    const url = `${window.location.origin}/?s=${series.id}`;
    const text = `${series.title} on Dopamine — first ${series.freeEpisodes} episodes free`;
    try {
      if (navigator.share) {
        await navigator.share({ title: series.title, text, url });
        return;
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied 🔗", description: "Share it anywhere — the series opens straight from the link." });
    } catch {
      toast({ title: "Share this link", description: url });
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[65] bg-deep-space overflow-y-auto"
    >
      <div className="relative mx-auto w-full md:max-w-2xl pb-16">
        {/* Cover art, faded into the page so the copy below stays readable */}
        <div className="relative">
          {series.coverUrl ? (
            <img
              src={series.coverUrl}
              alt={series.title}
              className="w-full aspect-[9/13] md:aspect-[16/10] object-cover object-top"
            />
          ) : (
            <div className="w-full aspect-[9/13] md:aspect-[16/10] bg-electric-violet/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-deep-space/50 via-deep-space/10 to-deep-space" />

          <div className="absolute top-0 left-0 right-0 pt-safe">
            <div className="flex items-center px-4 h-14">
              <motion.button
                onClick={onClose}
                aria-label="Back"
                className="w-10 h-10 rounded-full bg-deep-space/60 backdrop-blur-md flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="w-6 h-6 text-pure-white" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="relative -mt-16 px-4 space-y-5">
          <div className="space-y-2">
            {series.sponsorName && (
              <span className="inline-block px-2.5 py-1 rounded-md bg-liquid-gold/20 text-[10px] font-accent font-semibold tracking-widest uppercase text-liquid-gold">
                Presented by {series.sponsorName}
              </span>
            )}
            <h1 className="font-display text-pure-white text-3xl uppercase leading-tight">
              {series.title}
            </h1>
            <p className="font-body text-sm text-chrome-silver">
              {series.creatorName ?? "Dopamine Original"} · {episodes.length} episode{episodes.length === 1 ? "" : "s"}
              {series.freeEpisodes > 0 && <> · first {series.freeEpisodes} free</>}
            </p>
            {series.description && (
              <p className="font-body text-sm text-pure-white/80 leading-relaxed pt-1">
                {series.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => onPlay(resumeNumber)}
              whileTap={{ scale: 0.97 }}
              className="flex-1 h-12 rounded-full bg-gradient-button flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 text-pure-white fill-pure-white" />
              <span className="font-accent font-semibold text-pure-white">
                {progress ? `Resume Episode ${resumeNumber}` : "Play Episode 1"}
              </span>
            </motion.button>

            <motion.button
              onClick={() => toggleSaved(series.id)}
              aria-label={saved ? "Remove from My List" : "Save to My List"}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full bg-pure-white/10 flex items-center justify-center"
            >
              <Bookmark className={cn("w-5 h-5", saved ? "text-liquid-gold fill-liquid-gold" : "text-pure-white")} />
            </motion.button>

            <motion.button
              onClick={handleShare}
              aria-label="Share"
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full bg-pure-white/10 flex items-center justify-center"
            >
              <Share2 className="w-5 h-5 text-pure-white" />
            </motion.button>
          </div>

          {series.trailerUrl && onTrailer && (
            <button
              onClick={onTrailer}
              className="flex items-center gap-2 text-sm font-accent font-medium text-electric-violet"
            >
              <Film className="w-4 h-4" /> Watch the trailer
            </button>
          )}

          <div className="space-y-3 pt-2">
            <h2 className="font-accent text-xs font-semibold tracking-widest uppercase text-chrome-silver">
              Episodes
            </h2>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {episodes.map((ep) => {
                const locked = !isWatchable(ep, series);
                const watched = progress ? ep.episodeNumber < progress.episodeNumber : false;
                const current = progress?.episodeNumber === ep.episodeNumber;
                return (
                  <motion.button
                    key={ep.id}
                    onClick={() => onPlay(ep.episodeNumber)}
                    whileTap={{ scale: 0.93 }}
                    className={cn(
                      "relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-colors",
                      current
                        ? "border-electric-violet bg-electric-violet/20"
                        : locked
                          ? "border-pure-white/10 bg-pure-white/[0.04]"
                          : "border-pure-white/15 bg-pure-white/10",
                    )}
                  >
                    <span
                      className={cn(
                        "font-display text-lg leading-none",
                        locked ? "text-pure-white/40" : "text-pure-white",
                      )}
                    >
                      {ep.episodeNumber === 0 ? "T" : ep.episodeNumber}
                    </span>
                    {locked ? (
                      <Lock className="w-3 h-3 text-liquid-gold" />
                    ) : watched ? (
                      <Check className="w-3 h-3 text-chrome-silver" />
                    ) : (
                      <span className="h-3" />
                    )}
                  </motion.button>
                );
              })}
            </div>
            {episodes.length === 0 && (
              <p className="font-body text-sm text-chrome-silver">
                Episodes are on the way for this title.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
