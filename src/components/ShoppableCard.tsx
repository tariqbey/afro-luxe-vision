import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Heart } from "lucide-react";
import { usePlatform } from "@/contexts/PlatformContext";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ShoppableCardProps {
  products: Product[];
  sponsorName?: string | null;
  /** Seconds into the episode — the rail holds off until REVEAL_AT. */
  currentTime: number;
  /** Episode length, so the rail can clear out before the ending. */
  duration?: number;
  /** Reset the reveal when the episode changes. */
  episodeId: string;
}

const REVEAL_AT = 30;       // seconds in — let the scene play before selling
const HIDE_BEFORE_END = 10; // seconds — clear out so the ending lands clean

/**
 * Shoppable rail for sponsored episodes. Sits along the right edge above the
 * engagement buttons, deliberately narrow so the frame stays watchable.
 * Tapping an item opens the brand's page; clicks are logged for the sponsor.
 */
export function ShoppableCard({ products, sponsorName, currentTime, duration, episodeId }: ShoppableCardProps) {
  const { favoriteProductIds, toggleFavoriteProduct } = usePlatform();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => setDismissed(false), [episodeId]);

  if (products.length === 0 || dismissed) return null;

  // Show only between REVEAL_AT and HIDE_BEFORE_END seconds from the end.
  // Episodes too short for that window never show the rail at all.
  const hideAt = duration && duration > 0 ? duration - HIDE_BEFORE_END : Infinity;
  const visible =
    hideAt > REVEAL_AT && currentTime >= REVEAL_AT && currentTime < hideAt;

  const save = async (p: Product) => {
    const result = await toggleFavoriteProduct(p.id);
    if (result === "signin") {
      toast({ title: "Sign in to save", description: "Your shopping list lives in your profile." });
      return;
    }
    toast({
      title: result === "added" ? "Saved to your list ♥" : "Removed from your list",
      description: result === "added" ? `${p.name} — find it in your profile.` : undefined,
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="absolute right-2 top-14 z-30 w-[38%] max-w-[165px]"
        >
          <div className="rounded-2xl bg-deep-space/75 backdrop-blur-md border border-chrome-silver/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[9px] text-chrome-silver/90 truncate leading-tight">
                Sponsored{sponsorName ? ` · ${sponsorName}` : ""}
              </span>
              <button
                onClick={() => setDismissed(true)}
                aria-label="Hide products"
                className="flex-shrink-0 ml-1"
              >
                <X className="w-3 h-3 text-chrome-silver/60" />
              </button>
            </div>

            {/* Product rail — scrolls if the episode has a lot of looks */}
            <div className="max-h-[36vh] overflow-y-auto scrollbar-hide px-1.5 pb-1.5 space-y-1.5">
              {products.map((p) => {
                const saved = favoriteProductIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    className="rounded-xl bg-obsidian/80 border border-chrome-silver/10 p-1.5 flex gap-2"
                  >
                    {p.imageUrl && (
                      <button onClick={() => save(p)} className="flex-shrink-0">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-11 h-[3.6rem] rounded-lg object-cover"
                        />
                      </button>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <p className="text-[10px] leading-tight text-pure-white line-clamp-2">
                        {p.name}
                      </p>
                      <motion.button
                        onClick={() => save(p)}
                        className={cn(
                          "mt-1 w-full py-1 rounded-md text-[9px] font-semibold flex items-center justify-center gap-1",
                          saved
                            ? "bg-liquid-gold/20 text-liquid-gold border border-liquid-gold/40"
                            : "bg-pure-white/95 text-deep-space"
                        )}
                        whileTap={{ scale: 0.95 }}
                      >
                        {saved
                          ? (<><Check className="w-2.5 h-2.5" /> Saved</>)
                          : (<><Heart className="w-2.5 h-2.5" /> Add to Favorites</>)}
                      </motion.button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
