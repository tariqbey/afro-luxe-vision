import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Episode, Series } from "@/lib/types";

const ANON_KEY = "dopamine.anon";

/** A stable per-device id so signed-out trailer views can still be counted
 *  as one viewer instead of many. Never leaves the device except as this id. */
function anonId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

const GEO_KEY = "dopamine.geo";

interface Geo { country: string | null; region: string | null; city: string | null }

/** Country/region from the edge, fetched once per device and cached. Nothing is
 *  asked of the viewer and no coordinates are involved. */
async function geo(): Promise<Geo> {
  try {
    const cached = localStorage.getItem(GEO_KEY);
    if (cached) return JSON.parse(cached) as Geo;
  } catch {
    /* private mode */
  }
  try {
    const res = await fetch("/api/geo");
    if (!res.ok) throw new Error("no geo");
    const g = (await res.json()) as Geo;
    try {
      localStorage.setItem(GEO_KEY, JSON.stringify(g));
    } catch {
      /* private mode */
    }
    return g;
  } catch {
    return { country: null, region: null, city: null };
  }
}

function device(): string {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/iPhone|iPod|Android/i.test(ua)) return "mobile";
  return "desktop";
}

interface PendingPlay {
  series: Series;
  episode: Episode;
  seconds: number;
  duration: number;
}

/**
 * Logs one row per episode *watched*, written when the viewer leaves it — on
 * autoplay to the next one, on closing the player, or on tab close. Recording
 * on exit rather than on start is what makes seconds-watched and drop-off real
 * instead of a count of things that merely began loading.
 */
export function usePlayLog(userId: string | null) {
  const pending = useRef<PendingPlay | null>(null);
  // Resolved once and reused, so logging a play never waits on a round trip.
  const geoRef = useRef<Geo>({ country: null, region: null, city: null });

  useEffect(() => {
    let live = true;
    geo().then((g) => {
      if (live) geoRef.current = g;
    });
    return () => {
      live = false;
    };
  }, []);

  const flush = useCallback(() => {
    const p = pending.current;
    pending.current = null;
    if (!p || !supabase) return;
    // A tap-through that never played isn't a view.
    if (p.seconds < 2) return;

    const row = {
      user_id: userId,
      anon_id: userId ? null : anonId(),
      series_id: p.series.id,
      episode_id: p.episode.id.endsWith("-trailer") ? null : p.episode.id,
      episode_number: p.episode.episodeNumber,
      seconds_watched: Math.round(p.seconds),
      completed: p.duration > 0 && p.seconds >= p.duration * 0.9,
      is_trailer: p.episode.episodeNumber === 0,
      device: device(),
      country: geoRef.current.country,
      region: geoRef.current.region,
      city: geoRef.current.city,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    };
    // Fire and forget: analytics must never block or break playback.
    supabase.from("play_events").insert(row).then(
      () => undefined,
      () => undefined,
    );
  }, [userId]);

  /** Called on every timeupdate — cheap, just keeps the latest position. */
  const track = useCallback((series: Series, episode: Episode, seconds: number, duration: number) => {
    const p = pending.current;
    if (p && p.episode.id !== episode.id) flush();
    pending.current = { series, episode, seconds, duration };
  }, [flush]);

  // Closing the tab mid-episode still counts.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  return { track, flush };
}
