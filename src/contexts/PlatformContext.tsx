import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Series, Episode, BreadTransaction, WatchPoint } from "@/lib/types";

const LS = {
  bread: "dopamine.demo.bread",
  unlocks: "dopamine.demo.unlocks",
  progress: "dopamine.demo.progress",
  saved: "dopamine.saved",
  subscriber: "dopamine.demo.subscriber",
};

interface UnlockResult {
  ok: boolean;
  error?: "insufficient_bread" | "not_authenticated" | "unknown";
}

interface PlatformContextValue {
  demoMode: boolean;
  loading: boolean;
  user: User | null;
  username: string | null;
  isAdmin: boolean;
  breadBalance: number;
  transactions: BreadTransaction[];
  unlockedIds: Set<string>;
  /** Series in the user's My List. DB-backed when signed in, device-local otherwise. */
  savedIds: Set<string>;
  toggleSaved: (seriesId: string) => Promise<void>;
  /** Dopamine Unlimited — $5.99/mo, every episode of every series. */
  isSubscriber: boolean;
  subscriptionEnd: string | null;
  subscribe: () => Promise<{ ok: boolean; error?: string }>;
  manageSubscription: () => Promise<{ ok: boolean; error?: string }>;
  /** Can this episode play right now (free window or already unlocked)? */
  isWatchable: (ep: Episode, series: Series) => boolean;
  unlockEpisode: (ep: Episode, series: Series) => Promise<UnlockResult>;
  /** Real mode: redirects to Stripe Checkout. Demo mode: credits instantly. */
  buyBread: (packageId: string, amount: number) => Promise<{ ok: boolean; error?: string }>;
  refreshWallet: () => Promise<void>;
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
  const [breadBalance, setBreadBalance] = useState<number>(() =>
    demoMode ? readLocal(LS.bread, 100) : 0,
  );
  const [transactions, setTransactions] = useState<BreadTransaction[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(() =>
    demoMode ? new Set(readLocal<string[]>(LS.unlocks, [])) : new Set(),
  );
  const [savedIds, setSavedIds] = useState<Set<string>>(() =>
    new Set(readLocal<string[]>(LS.saved, [])),
  );
  const [isSubscriber, setIsSubscriber] = useState<boolean>(() =>
    demoMode ? readLocal(LS.subscriber, false) : false,
  );
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const refreshWallet = useCallback(async () => {
    if (demoMode || !supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const [{ data: wallet }, { data: txs }, { data: unlocks }, { data: saves }, { data: sub }] = await Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", auth.user.id).single(),
      supabase.from("bread_transactions").select("*").order("created_at", { ascending: false }).limit(25),
      supabase.from("unlocks").select("episode_id"),
      supabase.from("saved_series").select("series_id"),
      supabase.from("subscriptions").select("status, current_period_end").eq("user_id", auth.user.id).maybeSingle(),
    ]);
    if (wallet) setBreadBalance(wallet.balance);
    if (txs) {
      setTransactions(txs.map((t) => ({
        id: t.id, amount: t.amount, kind: t.kind, refId: t.ref_id, note: t.note, createdAt: t.created_at,
      })));
    }
    if (unlocks) setUnlockedIds(new Set(unlocks.map((u) => u.episode_id as string)));
    if (saves) setSavedIds(new Set(saves.map((s) => s.series_id as string)));
    setIsSubscriber(Boolean(
      sub && sub.status === "active" &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date()),
    ));
    setSubscriptionEnd(sub?.current_period_end ?? null);
  }, [demoMode]);

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
    supabase.from("profiles").select("username, is_admin, is_creator").eq("id", user.id).single()
      .then(({ data }) => {
        setUsername(data?.username ?? null);
        setIsAdmin(Boolean(data?.is_admin || data?.is_creator));
      });
    refreshWallet();
  }, [demoMode, user, refreshWallet]);

  const isWatchable = useCallback(
    (ep: Episode, series: Series) =>
      isSubscriber || ep.episodeNumber <= series.freeEpisodes || unlockedIds.has(ep.id),
    [unlockedIds, isSubscriber],
  );

  const unlockEpisode = useCallback(
    async (ep: Episode, series: Series): Promise<UnlockResult> => {
      if (demoMode) {
        const balance = readLocal(LS.bread, 100);
        if (balance < series.episodePrice) return { ok: false, error: "insufficient_bread" };
        const newBalance = balance - series.episodePrice;
        const unlocks = [...readLocal<string[]>(LS.unlocks, []), ep.id];
        localStorage.setItem(LS.bread, JSON.stringify(newBalance));
        localStorage.setItem(LS.unlocks, JSON.stringify(unlocks));
        setBreadBalance(newBalance);
        setUnlockedIds(new Set(unlocks));
        return { ok: true };
      }
      if (!supabase || !user) return { ok: false, error: "not_authenticated" };
      const { data, error } = await supabase.rpc("unlock_episode", { p_episode_id: ep.id });
      if (error) return { ok: false, error: "unknown" };
      if (!data?.ok) {
        return { ok: false, error: data?.error === "insufficient_bread" ? "insufficient_bread" : "unknown" };
      }
      setUnlockedIds((prev) => new Set([...prev, ep.id]));
      if (typeof data.new_balance === "number") setBreadBalance(data.new_balance);
      return { ok: true };
    },
    [demoMode, user],
  );

  const buyBread = useCallback(
    async (packageId: string, amount: number) => {
      if (demoMode) {
        const newBalance = readLocal(LS.bread, 100) + amount;
        localStorage.setItem(LS.bread, JSON.stringify(newBalance));
        setBreadBalance(newBalance);
        return { ok: true };
      }
      if (!supabase || !user) return { ok: false, error: "not_authenticated" };
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { packageId, returnUrl: window.location.origin },
      });
      if (error || !data?.url) return { ok: false, error: "checkout_failed" };
      window.location.href = data.url;
      return { ok: true };
    },
    [demoMode, user],
  );

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
    setBreadBalance(demoMode ? readLocal(LS.bread, 100) : 0);
    setUnlockedIds(demoMode ? new Set(readLocal<string[]>(LS.unlocks, [])) : new Set());
  }, [demoMode]);

  return (
    <PlatformContext.Provider
      value={{
        demoMode, loading, user, username, isAdmin, breadBalance, transactions, unlockedIds,
        savedIds, toggleSaved, isSubscriber, subscriptionEnd, subscribe, manageSubscription,
        isWatchable, unlockEpisode, buyBread, refreshWallet, saveProgress, getProgress, signOut,
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
