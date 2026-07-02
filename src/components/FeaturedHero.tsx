import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FeaturedSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  channel?: "afropunk" | "codeblack" | "lol" | "essence";
  hasTrailer?: boolean;
}

interface FeaturedHeroProps {
  slides: FeaturedSlide[];
  onWatch?: (seriesId: string) => void;
  onTrailer?: (seriesId: string) => void;
  rotateMs?: number;
}

const channelColors = {
  afropunk: "from-afropunk-blue/30 via-afropunk-green/20",
  codeblack: "from-codeblack-orange/30 via-codeblack-gold/20",
  lol: "from-lol-pink/30 via-lol-yellow/20",
  essence: "from-essence-rose/30 via-essence-champagne/20",
};

export function FeaturedHero({ slides, onWatch, onTrailer, rotateMs = 7000 }: FeaturedHeroProps) {
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
    <section className="relative w-full aspect-[3/4] md:aspect-[16/9] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={slide.backgroundImage}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-deep-space/40 to-transparent" />
            <div className={`absolute inset-0 bg-gradient-to-br ${channelColors[slide.channel ?? "afropunk"]} to-transparent opacity-60`} />
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-2xl space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-obsidian/60 backdrop-blur-sm border border-chrome-silver/20">
                <div className="w-2 h-2 rounded-full bg-neon-magenta animate-pulse" />
                <span className="text-xs font-medium text-chrome-silver uppercase tracking-wide">
                  Featured Series
                </span>
              </div>

              <h1 className="text-hero text-pure-white text-glow-violet">
                {slide.title}
              </h1>

              <p className="font-display text-lg md:text-xl text-electric-violet uppercase tracking-wide">
                {slide.subtitle}
              </p>

              <p className="text-body text-chrome-silver/80 max-w-lg line-clamp-2">
                {slide.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
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
                <Button variant="glass" size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  MY LIST
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide dots */}
      {slides.length > 1 && (
        <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === index ? "bg-pure-white h-5" : "bg-pure-white/40"
              }`}
              aria-label={`Show ${s.title}`}
            />
          ))}
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-8 w-32 h-32 rounded-full bg-electric-violet/20 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-1/3 left-8 w-24 h-24 rounded-full bg-neon-magenta/20 blur-2xl animate-float pointer-events-none" style={{ animationDelay: "1s" }} />
    </section>
  );
}
