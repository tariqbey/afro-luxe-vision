import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";

interface ShoppableCardProps {
  products: Product[];
  sponsorName?: string | null;
  /** Seconds into the episode — the rail holds off until REVEAL_AT. */
  currentTime: number;
  /** Reset the reveal when the episode changes. */
  episodeId: string;
}

const REVEAL_AT = 30; // seconds — let the scene play before selling

/**
 * Shoppable rail for sponsored episodes. Sits along the right edge above the
 * engagement buttons, deliberately narrow so the frame stays watchable.
 * Tapping an item opens the brand's page; clicks are logged for the sponsor.
 */
export function ShoppableCard({ products, sponsorName, currentTime, episodeId }: ShoppableCardProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => setDismissed(false), [episodeId]);

  if (products.length === 0 || dismissed) return null;
  const visible = currentTime >= REVEAL_AT;

  const open = async (p: Product) => {
    if (supabase) {
      const { data: auth } = await supabase.auth.getUser();
      supabase.from("product_clicks")
        .insert({ product_id: p.id, user_id: auth?.user?.id ?? null })
        .then(() => undefined, () => undefined);
    }
    window.open(p.productUrl, "_blank", "noopener,noreferrer");
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
            <div className="max-h-[40vh] overflow-y-auto scrollbar-hide px-1.5 pb-1.5 space-y-1.5">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl bg-obsidian/80 border border-chrome-silver/10 p-1.5 flex gap-2"
                >
                  {p.imageUrl && (
                    <button onClick={() => open(p)} className="flex-shrink-0">
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
                      onClick={() => open(p)}
                      className="mt-1 w-full py-1 rounded-md bg-pure-white/95 text-[9px] font-semibold text-deep-space"
                      whileTap={{ scale: 0.95 }}
                    >
                      Add to Cart
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
