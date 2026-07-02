import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { ChannelSwitcher, Channel } from "@/components/ChannelSwitcher";
import { FeaturedHero } from "@/components/FeaturedHero";
import { VideoRow } from "@/components/VideoRow";
import { VideoCardProps } from "@/components/VideoCard";
import { BreadPurchaseModal } from "@/components/BreadPurchaseModal";
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
  const { breadBalance, refreshWallet, getProgress } = usePlatform();

  const [activeChannel, setActiveChannel] = useState<Channel>("all");
  const [activeTab, setActiveTab] = useState("home");
  const [showBreadModal, setShowBreadModal] = useState(false);
  const [playingSeries, setPlayingSeries] = useState<Series | null>(null);

  // Stripe checkout return
  useEffect(() => {
    const result = searchParams.get("bread_purchase");
    if (!result) return;
    if (result === "success") {
      toast({ title: "Bread is in your wallet 🍞", description: "Payment received. Enjoy the show." });
      refreshWallet();
    } else if (result === "cancelled") {
      toast({ title: "Purchase cancelled", description: "No charge was made." });
    }
    searchParams.delete("bread_purchase");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, refreshWallet]);

  const seriesList = catalog?.seriesList ?? [];
  const episodesBySeries = catalog?.episodesBySeries ?? {};

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

  const openSeries = (seriesId: string) => {
    const s = seriesList.find((x) => x.id === seriesId);
    if (s) setPlayingSeries(s);
  };

  return (
    <div className="min-h-screen bg-deep-space grain-overlay">
      <TopNav
        breadBalance={breadBalance}
        onBreadClick={() => setShowBreadModal(true)}
      />

      <main className="pb-28">
        <FeaturedHero
          title="NEON QUEENS"
          subtitle="A New Era of Power"
          description="Five women. One city. Unlimited ambition. Watch as they redefine what it means to rule in the digital age."
          backgroundImage={heroFeatured}
          channel="afropunk"
        />

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

      <BreadPurchaseModal
        isOpen={showBreadModal}
        onClose={() => setShowBreadModal(false)}
        currentBalance={breadBalance}
      />

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
      </AnimatePresence>
    </div>
  );
};

export default Index;
