import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { ChannelSwitcher, Channel } from "@/components/ChannelSwitcher";
import { FeaturedHero, FeaturedSlide } from "@/components/FeaturedHero";
import { VideoRow } from "@/components/VideoRow";
import { VideoCardProps } from "@/components/VideoCard";
import { EpisodePlayer } from "@/components/EpisodePlayer";
import { useCatalog } from "@/hooks/useCatalog";
import { usePlatform } from "@/contexts/PlatformContext";
import { Series } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

import heroFeatured from "@/assets/hero-featured.jpg";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: catalog, isLoading } = useCatalog();
  const { user, isSubscriber, subscribe, refreshEntitlements, getProgress, savedIds, toggleSaved } = usePlatform();

  const [activeChannel, setActiveChannel] = useState<Channel>("all");
  const [activeTab, setActiveTab] = useState("home");
  const [playingSeries, setPlayingSeries] = useState<Series | null>(null);
  const [trailerSeries, setTrailerSeries] = useState<Series | null>(null);

  // Stripe checkout return
  useEffect(() => {
    const sub = searchParams.get("subscription");
    if (!sub) return;
    if (sub === "success") {
      toast({ title: "Welcome to Dopamine Unlimited 👑", description: "Every episode of every series is yours. Enjoy." });
      refreshEntitlements();
    } else if (sub === "cancelled") {
      toast({ title: "Subscription cancelled", description: "No charge was made." });
    }
    searchParams.delete("subscription");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, refreshEntitlements]);

  const handleUnlimitedClick = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const result = await subscribe();
    if (!result.ok) {
      toast({ title: "Checkout unavailable", description: "Please try again in a moment.", variant: "destructive" });
    }
  };

  const seriesList = catalog?.seriesList ?? [];
  const episodesBySeries = catalog?.episodesBySeries ?? {};

  // Shared links (/?s=<seriesId>) open the series directly
  useEffect(() => {
    const sharedId = searchParams.get("s");
    if (!sharedId || seriesList.length === 0) return;
    const s = seriesList.find((x) => x.id === sharedId);
    if (s) setPlayingSeries(s);
    searchParams.delete("s");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesList.length]);

  const toCard = (s: Series): VideoCardProps => ({
    id: s.id,
    title: s.title,
    thumbnail: s.coverUrl ?? "",
    creator: s.creatorName ?? "Creator",
    duration: `${episodesBySeries[s.id]?.length ?? 0} eps`,
    views: "",
    likes: "",
    isNew: Date.now() - new Date(s.createdAt).getTime() < TWO_WEEKS_MS,
    isVerified: true,
    channel: s.channel ?? undefined,
  });

  const filterByChannel = (list: Series[]) =>
    activeChannel === "all" ? list : list.filter((s) => s.channel === activeChannel);

  const continueWatchingSeries = useMemo(
    () => seriesList.filter((s) => getProgress(s.id) !== null),
    [seriesList, getProgress],
  );

  const newReleases = useMemo(
    () => [...seriesList].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ).slice(0, 6),
    [seriesList],
  );

  // Admin-featured series drive the hero; fall back to the 3 newest.
  const heroSlides: FeaturedSlide[] = useMemo(() => {
    const featured = seriesList
      .filter((s) => s.featuredAt)
      .sort((a, b) => new Date(b.featuredAt!).getTime() - new Date(a.featuredAt!).getTime());
    const pool = featured.length > 0 ? featured : newReleases.slice(0, 3);
    return pool.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: `${s.creatorName ?? "Dopamine Original"} · ${episodesBySeries[s.id]?.length ?? 0} episodes`,
      description: s.description ?? "",
      backgroundImage: s.coverUrl ?? "",
      channel: s.channel ?? undefined,
      hasTrailer: Boolean(s.trailerUrl),
      saved: savedIds.has(s.id),
    }));
  }, [seriesList, newReleases, episodesBySeries, savedIds]);

  const openTrailer = (seriesId: string) => {
    const s = seriesList.find((x) => x.id === seriesId);
    if (s?.trailerUrl) setTrailerSeries(s);
  };

  const openSeries = (seriesId: string) => {
    const s = seriesList.find((x) => x.id === seriesId);
    if (s) setPlayingSeries(s);
  };

  return (
    <div className="min-h-screen bg-deep-space grain-overlay">
      <TopNav
        isSubscriber={isSubscriber}
        onUnlimitedClick={handleUnlimitedClick}
      />

      <main className="pb-28">
        {heroSlides.length > 0 ? (
          <FeaturedHero slides={heroSlides} onWatch={openSeries} onTrailer={openTrailer} onSave={toggleSaved} />
        ) : (
          <FeaturedHero
            slides={[{
              id: "placeholder",
              title: "DOPAMINE",
              subtitle: "Micro Verticals, Maximum Story",
              description: "Fresh series are on the way. Check back soon.",
              backgroundImage: heroFeatured,
              channel: "afropunk",
            }]}
          />
        )}

        <div className="sticky top-16 z-40 bg-gradient-to-b from-deep-space via-deep-space to-transparent pt-4 pb-6 px-4">
          <ChannelSwitcher
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeChannel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {isLoading && (
              <p className="px-4 text-sm text-muted-foreground">Loading series…</p>
            )}

            {activeChannel === "all" && continueWatchingSeries.length > 0 && (
              <VideoRow
                title="Continue Watching"
                videos={continueWatchingSeries.map((s) => {
                  const p = getProgress(s.id);
                  const epCount = episodesBySeries[s.id]?.length ?? 1;
                  return {
                    ...toCard(s),
                    episode: p?.episodeNumber,
                    progress: p ? Math.round((p.episodeNumber / epCount) * 100) : undefined,
                  };
                })}
                onVideoClick={openSeries}
              />
            )}

            <VideoRow
              title={activeChannel === "all" ? "Trending Now 🔥" : `Trending in ${activeChannel.toUpperCase()}`}
              videos={filterByChannel(seriesList).map(toCard)}
              onVideoClick={openSeries}
            />

            <VideoRow
              title="New This Week"
              videos={filterByChannel(newReleases).map(toCard)}
              onVideoClick={openSeries}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={(tab) => {
        if (tab === "profile") navigate("/profile");
        else if (tab === "discover") navigate("/discover");
        else setActiveTab(tab);
      }} notificationCount={0} />

      <AnimatePresence>
        {playingSeries && (
          <EpisodePlayer
            series={playingSeries}
            episodes={episodesBySeries[playingSeries.id] ?? []}
            initialEpisodeNumber={getProgress(playingSeries.id)?.episodeNumber ?? 1}
            isOpen
            onClose={() => setPlayingSeries(null)}
          />
        )}
        {trailerSeries && (
          <EpisodePlayer
            series={trailerSeries}
            episodes={[{
              id: `${trailerSeries.id}-trailer`,
              seriesId: trailerSeries.id,
              episodeNumber: 0,
              title: "Trailer",
              videoUrl: trailerSeries.trailerUrl,
              thumbnailUrl: trailerSeries.coverUrl,
              durationSeconds: null,
            }]}
            initialEpisodeNumber={0}
            isOpen
            onClose={() => setTrailerSeries(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
