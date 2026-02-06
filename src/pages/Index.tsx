import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { ChannelSwitcher, Channel } from "@/components/ChannelSwitcher";
import { FeaturedHero } from "@/components/FeaturedHero";
import { VideoRow } from "@/components/VideoRow";
import { VideoCardProps } from "@/components/VideoCard";
import { CoinPurchaseModal } from "@/components/CoinPurchaseModal";
import { PremiumUnlockModal } from "@/components/PremiumUnlockModal";
import { VideoPlayer } from "@/components/VideoPlayer";

import heroFeatured from "@/assets/hero-featured.jpg";
import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";

import { trendingVideos, continueWatching, newReleases, allVideos, popularCreators } from "@/data/videos";

const Index = () => {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState<Channel>("all");
  const [activeTab, setActiveTab] = useState("home");
  const [coinBalance, setCoinBalance] = useState(1250);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [playerVideoIndex, setPlayerVideoIndex] = useState(0);

  const filterByChannel = (videos: VideoCardProps[]) => {
    if (activeChannel === "all") return videos;
    return videos.filter((v) => v.channel === activeChannel);
  };

  const handleVideoClick = (videoId: string) => {
    const index = allVideos.findIndex((v) => v.id === videoId);
    if (index !== -1) {
      setPlayerVideoIndex(index);
      setShowVideoPlayer(true);
    }
  };

  return (
    <div className="min-h-screen bg-deep-space grain-overlay">
      <TopNav
        coinBalance={coinBalance}
        onCoinsClick={() => setShowCoinModal(true)}
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
            {activeChannel === "all" && continueWatching.length > 0 && (
              <VideoRow title="Continue Watching" videos={continueWatching} onVideoClick={handleVideoClick} />
            )}

            <VideoRow
              title={activeChannel === "all" ? "Trending Now 🔥" : `Trending in ${activeChannel.toUpperCase()}`}
              videos={filterByChannel(trendingVideos)}
              onVideoClick={handleVideoClick}
            />

            <VideoRow
              title="New This Week"
              videos={filterByChannel(newReleases)}
              onVideoClick={handleVideoClick}
            />

            {activeChannel === "afropunk" && (
              <VideoRow title="AFROPUNK Exclusives" videos={trendingVideos.filter((v) => v.channel === "afropunk")} onVideoClick={handleVideoClick} />
            )}
            {activeChannel === "codeblack" && (
              <VideoRow title="CODEBLACK Originals" videos={trendingVideos.filter((v) => v.channel === "codeblack")} onVideoClick={handleVideoClick} />
            )}
            {activeChannel === "lol" && (
              <VideoRow title="LOL! Best of Comedy" videos={trendingVideos.filter((v) => v.channel === "lol")} onVideoClick={handleVideoClick} />
            )}
            {activeChannel === "essence" && (
              <VideoRow title="ESSENCE Lifestyle" videos={trendingVideos.filter((v) => v.channel === "essence")} onVideoClick={handleVideoClick} />
            )}

            {activeChannel === "all" && (
              <section className="px-4 space-y-4">
                <h2 className="text-section text-pure-white">Popular Creators</h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {popularCreators.map((creator, index) => (
                    <motion.div
                      key={creator.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex-shrink-0 flex flex-col items-center gap-2"
                    >
                      <div className="relative">
                        <img src={creator.avatar} alt={creator.name} className="w-20 h-20 rounded-full object-cover ring-2 ring-electric-violet" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neon-magenta flex items-center justify-center">
                          <span className="text-[10px] text-pure-white font-bold">+</span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-chrome-silver text-center w-20 truncate">{creator.name}</span>
                      <span className="text-xs text-muted-foreground">{creator.followers}</span>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={(tab) => {
        if (tab === "profile") navigate("/profile");
        else if (tab === "discover") navigate("/discover");
        else setActiveTab(tab);
      }} notificationCount={3} />

      {/* Modals */}
      <CoinPurchaseModal isOpen={showCoinModal} onClose={() => setShowCoinModal(false)} currentBalance={coinBalance} />
      <PremiumUnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        videoTitle="Operation Freedom"
        thumbnail={thumb4}
        coinCost={50}
        currentBalance={coinBalance}
        onUnlock={() => { setCoinBalance((b) => b - 50); setShowUnlockModal(false); }}
        onBuyCoins={() => { setShowUnlockModal(false); setShowCoinModal(true); }}
      />

      <AnimatePresence>
        {showVideoPlayer && (
          <VideoPlayer
            videos={allVideos}
            initialIndex={playerVideoIndex}
            isOpen={showVideoPlayer}
            onClose={() => setShowVideoPlayer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
