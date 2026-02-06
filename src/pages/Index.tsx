import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { ChannelSwitcher, Channel } from "@/components/ChannelSwitcher";
import { FeaturedHero } from "@/components/FeaturedHero";
import { VideoRow } from "@/components/VideoRow";
import { VideoCardProps } from "@/components/VideoCard";

// Import images
import heroFeatured from "@/assets/hero-featured.jpg";
import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";

// Mock data
const trendingVideos: VideoCardProps[] = [
  {
    id: "1",
    title: "Crown Heights Chronicles",
    thumbnail: thumb1,
    creator: "Marcus Cole",
    duration: "24:35",
    views: "2.4M",
    likes: "145K",
    episode: 1,
    isNew: true,
    isVerified: true,
    channel: "afropunk",
  },
  {
    id: "2",
    title: "Golden Hour Diaries",
    thumbnail: thumb2,
    creator: "Jasmine Rivers",
    duration: "18:22",
    views: "1.8M",
    likes: "98K",
    episode: 5,
    isVerified: true,
    channel: "essence",
  },
  {
    id: "3",
    title: "Laugh Out Loud Live",
    thumbnail: thumb3,
    creator: "DeShawn Comedy",
    duration: "32:15",
    views: "3.2M",
    likes: "287K",
    isVerified: true,
    channel: "lol",
  },
  {
    id: "4",
    title: "Operation Freedom",
    thumbnail: thumb4,
    creator: "Elite Studios",
    duration: "45:00",
    views: "5.1M",
    likes: "412K",
    episode: 3,
    isPremium: false,
    coinCost: 50,
    isVerified: true,
    channel: "codeblack",
  },
  {
    id: "5",
    title: "Neon Dreams Tour",
    thumbnail: thumb5,
    creator: "ZAE Official",
    duration: "15:45",
    views: "890K",
    likes: "76K",
    channel: "afropunk",
  },
  {
    id: "6",
    title: "Boss Moves Weekly",
    thumbnail: thumb6,
    creator: "Keisha Brooks",
    duration: "28:10",
    views: "1.2M",
    likes: "89K",
    episode: 12,
    progress: 65,
    isVerified: true,
    channel: "essence",
  },
];

const continueWatching: VideoCardProps[] = [
  {
    id: "7",
    title: "Boss Moves Weekly",
    thumbnail: thumb6,
    creator: "Keisha Brooks",
    duration: "28:10",
    views: "1.2M",
    likes: "89K",
    episode: 12,
    progress: 65,
    isVerified: true,
    channel: "essence",
  },
  {
    id: "8",
    title: "Crown Heights Chronicles",
    thumbnail: thumb1,
    creator: "Marcus Cole",
    duration: "24:35",
    views: "2.4M",
    likes: "145K",
    episode: 4,
    progress: 35,
    isVerified: true,
    channel: "afropunk",
  },
  {
    id: "9",
    title: "Operation Freedom",
    thumbnail: thumb4,
    creator: "Elite Studios",
    duration: "45:00",
    views: "5.1M",
    likes: "412K",
    episode: 2,
    progress: 80,
    isVerified: true,
    channel: "codeblack",
  },
];

const newReleases: VideoCardProps[] = [
  {
    id: "10",
    title: "Laugh Out Loud Live",
    thumbnail: thumb3,
    creator: "DeShawn Comedy",
    duration: "32:15",
    views: "3.2M",
    likes: "287K",
    isNew: true,
    isVerified: true,
    channel: "lol",
  },
  {
    id: "11",
    title: "Neon Dreams Tour",
    thumbnail: thumb5,
    creator: "ZAE Official",
    duration: "15:45",
    views: "890K",
    likes: "76K",
    isNew: true,
    channel: "afropunk",
  },
  {
    id: "12",
    title: "Golden Hour Diaries",
    thumbnail: thumb2,
    creator: "Jasmine Rivers",
    duration: "18:22",
    views: "1.8M",
    likes: "98K",
    episode: 6,
    isNew: true,
    isVerified: true,
    channel: "essence",
  },
  {
    id: "13",
    title: "Crown Heights Chronicles",
    thumbnail: thumb1,
    creator: "Marcus Cole",
    duration: "24:35",
    views: "2.4M",
    likes: "145K",
    episode: 5,
    isNew: true,
    isVerified: true,
    channel: "afropunk",
  },
];

const Index = () => {
  const [activeChannel, setActiveChannel] = useState<Channel>("all");
  const [activeTab, setActiveTab] = useState("home");
  const [coinBalance] = useState(1250);

  // Filter videos by channel
  const filterByChannel = (videos: VideoCardProps[]) => {
    if (activeChannel === "all") return videos;
    return videos.filter((v) => v.channel === activeChannel);
  };

  return (
    <div className="min-h-screen bg-deep-space grain-overlay">
      {/* Top Navigation */}
      <TopNav coinBalance={coinBalance} />

      {/* Main Content */}
      <main className="pb-28">
        {/* Hero Section */}
        <FeaturedHero
          title="NEON QUEENS"
          subtitle="A New Era of Power"
          description="Five women. One city. Unlimited ambition. Watch as they redefine what it means to rule in the digital age."
          backgroundImage={heroFeatured}
          channel="afropunk"
        />

        {/* Channel Switcher */}
        <div className="sticky top-16 z-40 bg-gradient-to-b from-deep-space via-deep-space to-transparent pt-4 pb-6 px-4">
          <ChannelSwitcher
            activeChannel={activeChannel}
            onChannelChange={setActiveChannel}
          />
        </div>

        {/* Content Sections */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChannel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Continue Watching */}
            {activeChannel === "all" && continueWatching.length > 0 && (
              <VideoRow
                title="Continue Watching"
                videos={continueWatching}
              />
            )}

            {/* Trending Now */}
            <VideoRow
              title={activeChannel === "all" ? "Trending Now 🔥" : `Trending in ${activeChannel.toUpperCase()}`}
              videos={filterByChannel(trendingVideos)}
            />

            {/* New Releases */}
            <VideoRow
              title="New This Week"
              videos={filterByChannel(newReleases)}
            />

            {/* Channel-specific sections */}
            {activeChannel === "afropunk" && (
              <VideoRow
                title="AFROPUNK Exclusives"
                videos={trendingVideos.filter((v) => v.channel === "afropunk")}
              />
            )}

            {activeChannel === "codeblack" && (
              <VideoRow
                title="CODEBLACK Originals"
                videos={trendingVideos.filter((v) => v.channel === "codeblack")}
              />
            )}

            {activeChannel === "lol" && (
              <VideoRow
                title="LOL! Best of Comedy"
                videos={trendingVideos.filter((v) => v.channel === "lol")}
              />
            )}

            {activeChannel === "essence" && (
              <VideoRow
                title="ESSENCE Lifestyle"
                videos={trendingVideos.filter((v) => v.channel === "essence")}
              />
            )}

            {/* Popular Creators - Only on "For You" */}
            {activeChannel === "all" && (
              <section className="px-4 space-y-4">
                <h2 className="text-section text-pure-white">Popular Creators</h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {[
                    { name: "Marcus Cole", avatar: thumb1, followers: "2.4M" },
                    { name: "Jasmine Rivers", avatar: thumb2, followers: "1.8M" },
                    { name: "DeShawn Comedy", avatar: thumb3, followers: "3.2M" },
                    { name: "Elite Studios", avatar: thumb4, followers: "5.1M" },
                    { name: "ZAE Official", avatar: thumb5, followers: "890K" },
                    { name: "Keisha Brooks", avatar: thumb6, followers: "1.2M" },
                  ].map((creator, index) => (
                    <motion.div
                      key={creator.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex-shrink-0 flex flex-col items-center gap-2"
                    >
                      <div className="relative">
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-20 h-20 rounded-full object-cover ring-2 ring-electric-violet"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neon-magenta flex items-center justify-center">
                          <span className="text-[10px] text-pure-white font-bold">+</span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-chrome-silver text-center w-20 truncate">
                        {creator.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {creator.followers}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notificationCount={3}
      />
    </div>
  );
};

export default Index;
