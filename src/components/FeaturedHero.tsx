import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  // Once someone starts steering the carousel themselves, stop yanking it out
  // from under them — the auto-rotate resumes after a spell of no input.
  const [steering, setSteering] = useState(false);
  const slide = slides[Math.min(index, slides.length - 1)];

  const go = useCallback(
    (dir: number) => {
      setIndex((i) => (i + dir + slides.length) % slides.length);
      setSteering(true);
    },
    [slides.length],
  );

  useEffect(() => {
    if (slides.length < 2 || steering) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), rotateMs);
    return () => clearInterval(timer);
  }, [slides.length, rotateMs, steering]);

  // Hand control back to the carousel after a pause.
  useEffect(() => {
    if (!steering) return;
    const t = setTimeout(() => setSteering(false), 12000);
    return () => clearTimeout(t);
  }, [steering, index]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  if (!slide) return null;

  return (
    <section className="relative w-full overflow-hidden">
      {/* Keyed remount, not AnimatePresence: `mode="wait"` deadlocks when the
          slide id changes while the first slide is still animating in — the
          placeholder never exits and the real hero never appears. */}
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          // Swipe left/right to browse what's featured instead of waiting out
          // the rotation. Buttons inside still receive their taps.
          drag={slides.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          dragDirectionLock
          onDragEnd={(_, info) => {
            const far = Math.abs(info.offset.x) > 60;
            const fast = Math.abs(info.velocity.x) > 350;
            if (!far && !fast) return;
            go(info.offset.x < 0 ? 1 : -1);
          }}
        >
          {/* Mobile: art on top, content below.
              Tablet/desktop: portrait art left (uncropped), content right. */}
          <div className="lg:flex lg:items-center lg:gap-10 lg:px-12 lg:pt-24 lg:pb-6 lg:max-w-6xl lg:mx-auto">
          {/* Artwork — clean, nothing on top of it */}
          <div className="relative w-full aspect-[3/4] md:aspect-[4/5] lg:aspect-auto lg:w-auto lg:h-[62vh] lg:flex-shrink-0 lg:rounded-2xl lg:overflow-hidden lg:shadow-2xl">
            <img
              src={slide.backgroundImage}
              alt={slide.title}
              className="w-full h-full object-cover object-top lg:object-contain lg:w-auto lg:h-full"
            />
            {/* subtle channel tint at the edges only */}
            <div className={`absolute inset-0 bg-gradient-to-br ${channelColors[slide.channel ?? "afropunk"]} to-transparent opacity-25 pointer-events-none lg:hidden`} />
            {/* short fade bridging into the content below (mobile only) */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-deep-space to-transparent pointer-events-none lg:hidden" />
          </div>

          {/* Content — below the art on mobile, beside it on tablet+ */}
          <div className="relative px-5 -mt-6 pb-2 md:px-10 lg:px-0 lg:mt-0 lg:flex-1">
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
          </div>
        </motion.div>

      {/* Slide dots sit BELOW the poster, never on it — the artwork carries the
          title treatment and the cast credits, and nothing gets to cover those. */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-2 pb-3 lg:justify-start lg:px-12">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setIndex(i); setSteering(true); }}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "bg-pure-white w-5" : "bg-pure-white/40 w-1.5"
              }`}
              aria-label={`Show ${s.title}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
