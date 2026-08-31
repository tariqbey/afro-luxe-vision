import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Series, Episode, WatchPoint } from "@/lib/types";

const LS = {
  progress: "dopamine.demo.progress",
  saved: "dopamine.saved",
  subscriber: "dopamine.demo.subscriber",
  shares: "dopamine.shares",
};

/**
 * Share-to-unlock tier: sharing SHARES_REQUIRED times opens the SHARE_WINDOW
 * episodes after the free ones. Currently PAUSED — the paywall goes straight
 * to subscribe (or promo code). Flip the flag to bring the tier back.
 */
export const SHARE_UNLOCK_ENABLED = false;
export const SHARES_REQUIRED = 5;
export const SHARE_WINDOW = 5;

interface PlatformContextValue {
  demoMode: boolean;
  loading: boolean;
  user: User | null;
  username: string | null;
  isAdmin: boolean;
  /** Episodes bought à la carte before the subscription switch — still honored. */
  unlockedIds: Set<string>;
  /** Series in the user's My List. DB-backed when signed in, device-local otherwise. */
  savedIds: Set<string>;
  toggleSaved: (seriesId: string) => Promise<void>;
  /** Dopamine Unlimited — $5.99/mo, every episode of every series. */
  isSubscriber: boolean;
  subscriptionEnd: string | null;
  subscribe: () => Promise<{ ok: boolean; error?: string }>;
  manageSubscription: () => Promise<{ ok: boolean; error?: string }>;
  /** Redeem a promo code (e.g. UPSCALE) for free Unlimited access. */
  redeemPromo: (code: string) => Promise<{ ok: boolean; error?: string; days?: number }>;
  /** Shares recorded per series (share-to-unlock progress). */
  sharesBySeries: Record<string, number>;
  recordShare: (seriesId: string) => Promise<number>;
  /** Short code appended to invite links so the referral tree is traceable. */
  referralCode: string | null;
  /** Products the viewer saved from sponsored episodes (their shopping list). */
  favoriteProductIds: Set<string>;
  toggleFavoriteProduct: (productId: string) => Promise<"added" | "removed" | "signin">;
  /** Can this episode play right now (subscriber, free window, or legacy unlock)? */
  isWatchable: (ep: Episode, series: Series) => boolean;
  refreshEntitlements: () => Promise<void>;
  saveProgress: (seriesId: string, episode: Episode, seconds: number) => void;
  getProgress: (seriesId: string) => WatchPoint | null;
  signOut: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function PlatformProvider({ children }: { children: ReactNode }) {
  const demoMode = !isSupabaseConfigured;
  const [loading, setLoading] = useState(!demoMode);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(() =>
    new Set(readLocal<string[]>(LS.saved, [])),
  );
  const [isSubscriber, setIsSubscriber] = useState<boolean>(() =>
    demoMode ? readLocal(LS.subscriber, false) : false,
  );
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [sharesBySeries, setSharesBySeries] = useState<Record<string, number>>(() =>
    readLocal(LS.shares, {}),
  );
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<string>>(new Set());

  const refreshEntitlements = useCallback(async () => {
    if (demoMode || !supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const [{ data: unlocks }, { data: saves }, { data: sub }, { data: shares }, { data: favs }] = await Promise.all([
      supabase.from("unlocks").select("episode_id"),
      supabase.from("saved_series").select("series_id"),
      supabase.from("subscriptions").select("status, current_period_end").eq("user_id", auth.user.id).maybeSingle(),
      supabase.from("share_progress").select("series_id, shares"),
      supabase.from("product_favorites").select("product_id"),
    ]);
    if (unlocks) setUnlockedIds(new Set(unlocks.map((u) => u.episode_id as string)));
    if (saves) setSavedIds(new Set(saves.map((s) => s.series_id as string)));
    setIsSubscriber(Boolean(
      sub && sub.status === "active" &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date()),
    ));
    setSubscriptionEnd(sub?.current_period_end ?? null);
    if (shares) {
      setSharesBySeries(Object.fromEntries(shares.map((s) => [s.series_id as string, s.shares as number])));
    }
    if (favs) setFavoriteProductIds(new Set(favs.map((f) => f.product_id as string)));
  }, [demoMode]);

  const toggleFavoriteProduct = useCallback(async (productId: string) => {
    if (!supabase || !user) return "signin" as const;
    const saved = favoriteProductIds.has(productId);
    const next = new Set(favoriteProductIds);
    if (saved) next.delete(productId); else next.add(productId);
    setFavoriteProductIds(next);
    if (saved) {
      await supabase.from("product_favorites").delete()
        .eq("user_id", user.id).eq("product_id", productId);
      return "removed" as const;
    }
    await supabase.from("product_favorites")
      .upsert({ user_id: user.id, product_id: productId });
    return "added" as const;
  }, [favoriteProductIds, user]);

  const recordShare = useCallback(async (seriesId: string): Promise<number> => {
    if (!demoMode && supabase && user) {
      const { data, error } = await supabase.rpc("record_share", { p_series_id: seriesId });
      if (!error && data?.ok) {
        setSharesBySeries((prev) => ({ ...prev, [seriesId]: data.shares }));
        return data.shares as number;
      }
    }
    // anonymous / demo: device-local counting
    const all = readLocal<Record<string, number>>(LS.shares, {});
    const next = (all[seriesId] ?? 0) + 1;
    all[seriesId] = next;
    localStorage.setItem(LS.shares, JSON.stringify(all));
    setSharesBySeries({ ...all });
    return next;
  }, [demoMode, user]);

  useEffect(() => {
    if (demoMode || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [demoMode]);

  useEffect(() => {
    if (demoMode || !supabase || !user) return;
    supabase.from("profiles").select("username, is_admin, is_creator, referral_code").eq("id", user.id).single()
      .then(({ data }) => {
        setUsername(data?.username ?? null);
        setIsAdmin(Boolean(data?.is_admin || data?.is_creator));
        setReferralCode(data?.referral_code ?? null);
      });
    refreshEntitlements();
  }, [demoMode, user, refreshEntitlements]);

  // Long-lived tabs/PWAs: re-check entitlements when the app regains focus,
  // so grants and new subscriptions land without a manual reload.
  useEffect(() => {
    if (demoMode) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshEntitlements();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [demoMode, refreshEntitlements]);

  const isWatchable = useCallback(
    (ep: Episode, series: Series) => {
      if (isAdmin || isSubscriber) return true;
      if (ep.episodeNumber <= series.freeEpisodes) return true;
      if (unlockedIds.has(ep.id)) return true;
      // share tier: the SHARE_WINDOW episodes after the free ones open up
      // once the viewer has shared the series SHARES_REQUIRED times
      if (
        SHARE_UNLOCK_ENABLED &&
        ep.episodeNumber <= series.freeEpisodes + SHARE_WINDOW &&
        (sharesBySeries[series.id] ?? 0) >= SHARES_REQUIRED
      ) return true;
      return false;
    },
    [unlockedIds, isSubscriber, isAdmin, sharesBySeries],
  );

  const subscribe = useCallback(async () => {
    if (demoMode) {
      localStorage.setItem(LS.subscriber, "true");
      setIsSubscriber(true);
      return { ok: true };
    }
    if (!supabase || !user) return { ok: false, error: "not_authenticated" };
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { plan: "monthly", returnUrl: window.location.origin },
    });
    if (error || !data?.url) return { ok: false, error: "checkout_failed" };
    window.location.href = data.url;
    return { ok: true };
  }, [demoMode, user]);

  const manageSubscription = useCallback(async () => {
    if (demoMode) {
      localStorage.setItem(LS.subscriber, "false");
      setIsSubscriber(false);
      return { ok: true };
    }
    if (!supabase || !user) return { ok: false, error: "not_authenticated" };
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { action: "portal", returnUrl: window.location.origin },
    });
    if (error || !data?.url) return { ok: false, error: "portal_failed" };
    window.location.href = data.url;
    return { ok: true };
  }, [demoMode, user]);

  const redeemPromo = useCallback(async (code: string) => {
    if (demoMode) {
      if (code.trim().toUpperCase() === "UPSCALE") {
        localStorage.setItem(LS.subscriber, "true");
        setIsSubscriber(true);
        return { ok: true, days: 30 };
      }
      return { ok: false, error: "invalid_code" };
    }
    if (!supabase || !user) return { ok: false, error: "not_authenticated" };
    const { data, error } = await supabase.rpc("redeem_promo", { p_code: code });
    if (error) return { ok: false, error: "unknown" };
    if (!data?.ok) return { ok: false, error: data?.error ?? "unknown" };
    await refreshEntitlements();
    return { ok: true, days: data.days };
  }, [demoMode, user, refreshEntitlements]);

  const toggleSaved = useCallback(async (seriesId: string) => {
    const isSaved = savedIds.has(seriesId);
    const next = new Set(savedIds);
    if (isSaved) next.delete(seriesId); else next.add(seriesId);
    setSavedIds(next);
    if (!demoMode && supabase && user) {
      if (isSaved) {
        await supabase.from("saved_series").delete()
          .eq("user_id", user.id).eq("series_id", seriesId);
      } else {
        await supabase.from("saved_series").upsert({ user_id: user.id, series_id: seriesId });
      }
    } else {
      localStorage.setItem(LS.saved, JSON.stringify([...next]));
    }
  }, [savedIds, demoMode, user]);

  const saveProgress = useCallback(
    (seriesId: string, episode: Episode, seconds: number) => {
      const all = readLocal<Record<string, WatchPoint>>(LS.progress, {});
      all[seriesId] = { episodeNumber: episode.episodeNumber, seconds };
      localStorage.setItem(LS.progress, JSON.stringify(all));
      if (!demoMode && supabase && user) {
        // fire-and-forget; localStorage covers instant resume
        supabase.from("watch_progress").upsert({
          user_id: user.id,
          episode_id: episode.id,
          seconds,
        }).then(() => undefined, () => undefined);
      }
    },
    [demoMode, user],
  );

  const getProgress = useCallback((seriesId: string): WatchPoint | null => {
    const all = readLocal<Record<string, WatchPoint>>(LS.progress, {});
    return all[seriesId] ?? null;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setUsername(null);
    setIsAdmin(false);
    setUnlockedIds(new Set());
    setIsSubscriber(demoMode ? readLocal(LS.subscriber, false) : false);
    setSubscriptionEnd(null);
    setFavoriteProductIds(new Set());
  }, [demoMode]);

  return (
    <PlatformContext.Provider
      value={{
        demoMode, loading, user, username, isAdmin, unlockedIds,
        savedIds, toggleSaved, isSubscriber, subscriptionEnd, subscribe, manageSubscription, redeemPromo,
        sharesBySeries, recordShare, referralCode, favoriteProductIds, toggleFavoriteProduct,
        isWatchable, refreshEntitlements, saveProgress, getProgress, signOut,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
  return ctx;
}
