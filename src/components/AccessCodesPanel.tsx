import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ticket, Loader2, Copy, Check, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PromoCode {
  code: string;
  grants_days: number;
  max_redemptions: number | null;
  redeemed_count: number;
  active: boolean;
  created_at: string;
}

/**
 * Hand out free access without a card. A code is redeemed at the paywall
 * ("Have a code?") or from Profile, and extends whatever access the viewer
 * already has rather than replacing it.
 */
export function AccessCodesPanel() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [days, setDays] = useState(365);
  const [limit, setLimit] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const codes = useQuery({
    queryKey: ["promo-codes"],
    queryFn: async (): Promise<PromoCode[]> => {
      const { data, error } = await supabase!
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["promo-codes"] });

  const create = useMutation({
    mutationFn: async () => {
      const clean = code.trim().toUpperCase();
      if (clean.length < 4) throw new Error("Use at least 4 characters.");
      const { error } = await supabase!.from("promo_codes").insert({
        code: clean,
        grants_days: days,
        max_redemptions: limit.trim() === "" ? null : Number(limit),
      });
      if (error) throw error;
      return clean;
    },
    onSuccess: (clean) => {
      setCode("");
      setLimit("");
      refresh();
      toast({ title: `${clean} is live`, description: "Anyone can redeem it at the paywall." });
    },
    onError: (e: Error) =>
      toast({
        title: "Couldn't create that code",
        description: e.message.includes("duplicate") ? "That code already exists." : e.message,
        variant: "destructive",
      }),
  });

  const toggle = useMutation({
    mutationFn: async (c: PromoCode) => {
      const { error } = await supabase!
        .from("promo_codes")
        .update({ active: !c.active })
        .eq("code", c.code);
      if (error) throw error;
      return c;
    },
    onSuccess: (c) => {
      refresh();
      toast({
        title: c.active ? `${c.code} switched off` : `${c.code} switched back on`,
        description: c.active
          ? "Nobody new can redeem it. People who already did keep their access."
          : "It can be redeemed again.",
      });
    },
  });

  const copy = async (c: string) => {
    try {
      await navigator.clipboard.writeText(c);
      setCopied(c);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast({ title: "Code", description: c });
    }
  };

  return (
    <section className="rounded-2xl border border-chrome-silver/10 bg-obsidian p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Ticket className="w-4 h-4 text-liquid-gold" />
        <h2 className="font-accent text-xs font-semibold uppercase tracking-widest text-chrome-silver">
          Access codes
        </h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Give someone every episode free for a stretch of time. They enter it at the paywall under
        "Have a code?", or from their Profile.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CODE"
          className="flex-1 rounded-xl border border-chrome-silver/15 bg-deep-space px-3 py-2 font-accent text-sm tracking-widest text-pure-white placeholder:text-chrome-silver/40"
        />
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-xl border border-chrome-silver/15 bg-deep-space px-3 py-2 text-sm text-pure-white"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>1 year</option>
          <option value={3650}>10 years</option>
        </select>
        <input
          value={limit}
          onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))}
          placeholder="Uses (blank = ∞)"
          className="w-full sm:w-36 rounded-xl border border-chrome-silver/15 bg-deep-space px-3 py-2 text-sm text-pure-white placeholder:text-chrome-silver/40"
        />
        <motion.button
          onClick={() => create.mutate()}
          disabled={create.isPending || code.trim().length < 4}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-button px-4 py-2 font-accent text-sm font-semibold text-pure-white disabled:opacity-50"
        >
          {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create
        </motion.button>
      </div>

      {codes.isLoading && <Loader2 className="w-5 h-5 animate-spin text-electric-violet" />}

      <ul className="divide-y divide-chrome-silver/5">
        {(codes.data ?? []).map((c) => (
          <li key={c.code} className="flex flex-wrap items-center gap-2 py-3">
            <button
              onClick={() => copy(c.code)}
              className="flex items-center gap-1.5 font-accent text-sm font-bold tracking-widest text-pure-white"
              title="Copy"
            >
              {c.code}
              {copied === c.code ? (
                <Check className="w-3.5 h-3.5 text-liquid-gold" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-chrome-silver/50" />
              )}
            </button>
            <span className="text-xs text-muted-foreground">
              {c.grants_days >= 3650 ? "lifetime" : `${c.grants_days} days`} ·{" "}
              {c.redeemed_count} used
              {c.max_redemptions !== null && ` of ${c.max_redemptions}`}
            </span>
            <button
              onClick={() => toggle.mutate(c)}
              className={cn(
                "ml-auto rounded-full px-3 py-1 font-accent text-[11px] font-semibold transition-colors",
                c.active
                  ? "bg-liquid-gold/15 text-liquid-gold"
                  : "bg-pure-white/5 text-chrome-silver/60",
              )}
            >
              {c.active ? "Active" : "Off"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
