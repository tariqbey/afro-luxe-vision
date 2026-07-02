import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Check, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FeaturedSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  channel?: "afropunk" | "codeblack" | "lol" | "essence";
  hasTrailer?: boolean;
  saved?: boolean;
}

interface FeaturedHeroProps {
  slides: FeaturedSlide[];
  onWatch?: (seriesId: string) => void;
  onTrailer?: (seriesId: string) => void;
  onSave?: (seriesId: string) => void;
  rotateMs?: number;
}

const channelColors = {
  afropunk: "from-afropunk-blue/30 via-afropunk-green/20",
  codeblack: "from-codeblack-orange/30 via-codeblack-gold/20",
  lol: "from-lol-pink/30 via-lol-yellow/20",
  essence: "from-essence-rose/30 via-essence-champagne/20",
};

/**
 * The cover art gets the full frame — no text or buttons over it.
 * All content (title, description, actions) lives below the artwork,
 * bridged by a short fade at the image's bottom edge.
 */
export function FeaturedHero({ slides, onWatch, onTrailer, onSave, rotateMs = 7000 }: FeaturedHeroProps) {
  const [index, setIndex] = useState(0);
  const slide = slides[Math.min(index, slides.length - 1)];

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), rotateMs);
    return () => clearInterval(timer);
  }, [slides.length, rotateMs]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  if (!slide) return null;

  return (
    <section className="relative w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Artwork — clean, nothing on top of it */}
          <div className="relative w-full aspect-[3/4] md:aspect-[16/9]">
            <img
              src={slide.backgroundImage}
              alt={slide.title}
              className="w-full h-full object-cover object-top"
            />
            {/* subtle channel tint at the edges only */}
            <div className={`absolute inset-0 bg-gradient-to-br ${channelColors[slide.channel ?? "afropunk"]} to-transparent opacity-25 pointer-events-none`} />
            {/* short fade bridging into the content below */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-deep-space to-transparent pointer-events-none" />
          </div>

          {/* Content — below the art, on the page background */}
          <div className="relative px-5 -mt-6 pb-2 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="max-w-2xl space-y-3"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-obsidian/80 backdrop-blur-sm border border-chrome-silver/20">
                <div className="w-2 h-2 rounded-full bg-neon-magenta animate-pulse" />
                <span className="text-xs font-medium text-chrome-silver uppercase tracking-wide">
                  Featured Series
                </span>
              </div>

              <h1 className="text-hero text-pure-white text-glow-violet">
                {slide.title}
              </h1>

              <p className="font-display text-base md:text-xl text-electric-violet uppercase tracking-wide">
                {slide.subtitle}
              </p>

              <p className="text-body text-chrome-silver/80 max-w-lg line-clamp-2">
                {slide.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button variant="hero" size="lg" className="gap-2" onClick={() => onWatch?.(slide.id)}>
                  <Play className="w-5 h-5 fill-current" />
                  WATCH NOW
                </Button>
                {slide.hasTrailer && (
                  <Button variant="glass" size="lg" className="gap-2" onClick={() => onTrailer?.(slide.id)}>
                    <Clapperboard className="w-5 h-5" />
                    TRAILER
                  </Button>
                )}
                <Button variant="glass" size="lg" className="gap-2" onClick={() => onSave?.(slide.id)}>
                  {slide.saved ? <Check className="w-5 h-5 text-liquid-gold" /> : <Plus className="w-5 h-5" />}
                  {slide.saved ? "SAVED" : "MY LIST"}
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide dots — on the artwork's right edge, out of the art's way */}
      {slides.length > 1 && (
        <div className="absolute top-24 right-3 z-10 flex flex-col gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className={`w-1.5 rounded-full transition-all ${
                i === index ? "bg-pure-white h-5" : "bg-pure-white/40 h-1.5"
              }`}
              aria-label={`Show ${s.title}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
