import { motion } from "framer-motion";
import { Play, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedHeroProps {
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  logoImage?: string;
  channel?: "afropunk" | "codeblack" | "lol" | "essence";
}

export function FeaturedHero({
  title,
  subtitle,
  description,
  backgroundImage,
  channel = "afropunk",
}: FeaturedHeroProps) {
  const channelColors = {
    afropunk: "from-afropunk-blue/30 via-afropunk-green/20",
    codeblack: "from-codeblack-orange/30 via-codeblack-gold/20",
    lol: "from-lol-pink/30 via-lol-yellow/20",
    essence: "from-essence-rose/30 via-essence-champagne/20",
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative w-full aspect-[3/4] md:aspect-[16/9] overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-deep-space/40 to-transparent" />
        <div className={`absolute inset-0 bg-gradient-to-br ${channelColors[channel]} to-transparent opacity-60`} />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-2xl space-y-4"
        >
          {/* Channel Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-obsidian/60 backdrop-blur-sm border border-chrome-silver/20">
            <div className="w-2 h-2 rounded-full bg-neon-magenta animate-pulse" />
            <span className="text-xs font-medium text-chrome-silver uppercase tracking-wide">
              Featured Series
            </span>
          </div>

          {/* Title */}
          <h1 className="text-hero text-pure-white text-glow-violet">
            {title}
          </h1>

          {/* Subtitle */}
          <p className="font-display text-lg md:text-xl text-electric-violet uppercase tracking-wide">
            {subtitle}
          </p>

          {/* Description */}
          <p className="text-body text-chrome-silver/80 max-w-lg line-clamp-2">
            {description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="hero" size="lg" className="gap-2">
              <Play className="w-5 h-5 fill-current" />
              WATCH NOW
            </Button>
            <Button variant="glass" size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              MY LIST
            </Button>
            <Button variant="icon" size="icon-lg">
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-8 w-32 h-32 rounded-full bg-electric-violet/20 blur-3xl animate-float" />
      <div className="absolute bottom-1/3 left-8 w-24 h-24 rounded-full bg-neon-magenta/20 blur-2xl animate-float" style={{ animationDelay: "1s" }} />
    </motion.section>
  );
}
