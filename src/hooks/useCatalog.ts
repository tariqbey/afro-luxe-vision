import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Series, Episode, Channel } from "@/lib/types";
import { demoSeries, demoEpisodes } from "@/data/demoSeries";

export interface Catalog {
  seriesList: Series[];
  episodesBySeries: Record<string, Episode[]>;
}

async function fetchCatalog(): Promise<Catalog> {
  if (!isSupabaseConfigured || !supabase) {
    return { seriesList: demoSeries, episodesBySeries: demoEpisodes };
  }

  const [{ data: series, error: sErr }, { data: episodes, error: eErr }] = await Promise.all([
    supabase
      .from("series")
      .select("*, profiles:creator_id(username)")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("episodes")
      .select("*")
      .eq("status", "ready")
      .order("episode_number", { ascending: true }),
  ]);
  if (sErr || eErr) throw sErr ?? eErr;

  const seriesList: Series[] = (series ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    coverUrl: s.cover_url,
    channel: s.channel as Channel | null,
    freeEpisodes: s.free_episodes,
    episodePrice: s.episode_price,
    creatorId: s.creator_id,
    creatorName: (s.profiles as { username?: string } | null)?.username ?? "Creator",
    status: s.status,
    createdAt: s.created_at,
    featuredAt: s.featured_at ?? null,
    trailerUrl: s.trailer_url ?? null,
  }));

  const episodesBySeries: Record<string, Episode[]> = {};
  for (const e of episodes ?? []) {
    (episodesBySeries[e.series_id] ??= []).push({
      id: e.id,
      seriesId: e.series_id,
      episodeNumber: e.episode_number,
      title: e.title,
      videoUrl: e.video_url,
      thumbnailUrl: e.thumbnail_url,
      durationSeconds: e.duration_seconds,
    });
  }

  // A published series with no ready episodes shouldn't render an empty rail
  return {
    seriesList: seriesList.filter((s) => (episodesBySeries[s.id]?.length ?? 0) > 0),
    episodesBySeries,
  };
}

export function useCatalog() {
  return useQuery({ queryKey: ["catalog"], queryFn: fetchCatalog });
}
