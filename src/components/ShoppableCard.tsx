import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/lib/types";

interface ShoppableCardProps {
  products: Product[];
  sponsorName?: string | null;
  /** Seconds into the episode — the card reveals itself a beat in. */
  currentTime: number;
  /** Reset the reveal when the episode changes. */
  episodeId: string;
}

const REVEAL_AT = 3; // seconds

/**
 * Shoppable overlay for sponsored episodes: a product card slides in over the
 * video, tapping it opens the brand's page. Clicks are logged so the sponsor
 * can be shown real numbers.
 */
export function ShoppableCard({ products, sponsorName, currentTime, episodeId }: ShoppableCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [index, setIndex] = useState(0);

  // new episode → fresh card
  useEffect(() => {
    setDismissed(false);
    setExpanded(false);
    setIndex(0);
  }, [episodeId]);

  // rotate through multiple products every 8s while collapsed
  useEffect(() => {
    if (products.length < 2 || expanded) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % products.length), 8000);
    return () => clearInterval(t);
  }, [products.length, expanded]);

  if (products.length === 0 || dismissed) return null;
  const visible = currentTime >= REVEAL_AT;
  const product = products[Math.min(index, products.length - 1)];

  const open = async (p: Product) => {
    // fire-and-forget attribution
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
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="absolute left-3 bottom-44 z-30 max-w-[calc(100%-5.5rem)]"
        >
          {/* sponsor tag — disclosure matters, and it sells the partnership */}
          {sponsorName && (
            <div className="mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-deep-space/80 backdrop-blur-sm border border-liquid-gold/30">
              <ShoppingBag className="w-3 h-3 text-liquid-gold" />
              <span className="text-[10px] font-medium text-liquid-gold uppercase tracking-wide">
                Shop {sponsorName}
              </span>
            </div>
          )}

          {expanded ? (
            /* Expanded: full list of everything worn in this episode */
            <motion.div
              layout
              className="w-72 rounded-2xl bg-obsidian/95 backdrop-blur-md border border-chrome-silver/15 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-chrome-silver/10">
                <span className="text-xs font-bold text-pure-white uppercase tracking-wide">
                  In this episode
                </span>
                <button onClick={() => setExpanded(false)} aria-label="Collapse">
                  <X className="w-4 h-4 text-chrome-silver" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-chrome-silver/10">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => open(p)}
                    className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-deep-space/60 transition-colors"
                  >
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt={p.name} className="w-12 h-16 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-pure-white truncate">{p.name}</p>
                      {p.price && <p className="text-[11px] text-liquid-gold mt-0.5">{p.price}</p>}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-electric-violet flex-shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Collapsed: single rotating product */
            <motion.div layout className="flex items-center gap-2">
              <motion.button
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => open(product)}
                className="flex items-center gap-2.5 p-2 pr-3 rounded-2xl bg-obsidian/95 backdrop-blur-md border border-chrome-silver/15 shadow-2xl"
                whileTap={{ scale: 0.97 }}
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-11 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="text-left min-w-0 max-w-[9rem]">
                  <p className="text-xs font-semibold text-pure-white truncate">{product.name}</p>
                  <p className="text-[11px] text-liquid-gold mt-0.5 flex items-center gap-1">
                    {product.price ?? "Shop now"}
                    <ExternalLink className="w-3 h-3" />
                  </p>
                </div>
              </motion.button>

              <div className="flex flex-col gap-1.5">
                {products.length > 1 && (
                  <button
                    onClick={() => setExpanded(true)}
                    className="w-7 h-7 rounded-full bg-obsidian/90 border border-chrome-silver/15 flex items-center justify-center"
                    aria-label="See all products"
                  >
                    <span className="text-[10px] font-bold text-liquid-gold">+{products.length - 1}</span>
                  </button>
                )}
                <button
                  onClick={() => setDismissed(true)}
                  className="w-7 h-7 rounded-full bg-obsidian/90 border border-chrome-silver/15 flex items-center justify-center"
                  aria-label="Hide"
                >
                  <X className="w-3.5 h-3.5 text-chrome-silver" />
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
