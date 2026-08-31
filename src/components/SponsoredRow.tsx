import { motion } from "framer-motion";
import { ShoppingBag, Play } from "lucide-react";
import { Series } from "@/lib/types";

interface SponsoredRowProps {
  series: Series[];
  episodeCounts: Record<string, number>;
  onSeriesClick: (seriesId: string) => void;
}

/**
 * "Sponsored Series" rail — brand-forward by design. Each card leads with the
 * sponsor's logo (or their name set in type when no logo asset is on file),
 * because that placement is what the sponsor is paying for.
 */
export function SponsoredRow({ series, episodeCounts, onSeriesClick }: SponsoredRowProps) {
  if (series.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-4">
        <ShoppingBag className="w-4 h-4 text-liquid-gold" />
        <h2 className="text-section text-pure-white">Sponsored Series</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2">
        {series.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onSeriesClick(s.id)}
            className="flex-shrink-0 w-64 rounded-2xl overflow-hidden bg-obsidian border border-liquid-gold/25 text-left"
            whileTap={{ scale: 0.98 }}
          >
            {/* Sponsor band */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-liquid-gold/15 to-transparent border-b border-liquid-gold/20">
              <span className="text-[10px] uppercase tracking-wider text-liquid-gold/80 flex-shrink-0">
                Presented by
              </span>
              {s.sponsorLogoUrl ? (
                <img
                  src={s.sponsorLogoUrl}
                  alt={s.sponsorName ?? "Sponsor"}
                  className="h-4 max-w-[7rem] object-contain"
                />
              ) : (
                <span className="font-display text-sm text-pure-white uppercase tracking-wide truncate">
                  {s.sponsorName}
                </span>
              )}
            </div>

            {/* Cover */}
            <div className="relative aspect-[16/10] overflow-hidden">
              {s.coverUrl && (
                <img src={s.coverUrl} alt={s.title} className="w-full h-full object-cover object-top" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />
              <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-deep-space/70 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-4 h-4 text-pure-white fill-pure-white ml-0.5" />
              </div>
            </div>

            {/* Title */}
            <div className="p-3 space-y-1">
              <h3 className="font-display text-base text-pure-white uppercase leading-tight truncate">
                {s.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {episodeCounts[s.id] ?? 0} episodes · Shop the looks
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
