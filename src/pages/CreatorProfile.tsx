import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Share2, Eye, Heart, Play, Grid3X3, Film, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { allVideos, popularCreators } from "@/data/videos";

import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";

const CreatorProfile = () => {
  const navigate = useNavigate();
  const { creatorId } = useParams();
  const [activeTab, setActiveTab] = useState<"videos" | "series" | "about">("videos");
  const [isFollowing, setIsFollowing] = useState(false);

  const creator = popularCreators.find(
    (c) => c.name.replace(/\s/g, "").toLowerCase() === creatorId
  ) || { name: "Marcus Cole", avatar: thumb1, followers: "2.4M" };

  const creatorVideos = allVideos.filter(
    (v) => v.creator.replace(/\s/g, "").toLowerCase() === creatorId
  );
  const displayVideos = creatorVideos.length > 0 ? creatorVideos : allVideos.slice(0, 6);

  return (
    <div className="min-h-screen bg-deep-space grain-overlay">
      {/* Cover */}
      <div className="relative h-52 overflow-hidden">
        <img src={thumb2} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-space/30 to-deep-space" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-deep-space/60 backdrop-blur-md flex items-center justify-center z-10"
        >
          <ChevronLeft className="w-6 h-6 text-pure-white" />
        </button>
      </div>

      {/* Creator Info */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4">
          <img
            src={creator.avatar}
            alt={creator.name}
            className="w-28 h-28 rounded-full object-cover ring-4 ring-deep-space"
          />
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl text-pure-white">{creator.name}</h1>
              <svg className="w-5 h-5 text-electric-violet" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">{creator.followers} followers</p>
          </div>
        </div>

        <p className="mt-3 text-sm text-chrome-silver/80 leading-relaxed">
          Award-winning filmmaker and storyteller. Creating content that celebrates Black excellence and culture. 🎬
        </p>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          {[
            { label: "Videos", value: String(displayVideos.length) },
            { label: "Followers", value: creator.followers },
            { label: "Total Views", value: "24.8M" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <span className="font-accent font-bold text-lg text-pure-white tabular-nums">{stat.value}</span>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-5">
          <motion.button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`flex-1 py-3 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              isFollowing
                ? "bg-obsidian border border-chrome-silver/10 text-chrome-silver"
                : "bg-gradient-button text-pure-white"
            }`}
            whileTap={{ scale: 0.97 }}
          >
            <Users className="w-4 h-4" />
            {isFollowing ? "Following" : "Follow"}
          </motion.button>
          <motion.button
            className="flex-1 py-3 rounded-xl bg-obsidian border border-chrome-silver/10 font-body font-semibold text-sm text-chrome-silver flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}
          >
            💰 Tip Creator
          </motion.button>
          <motion.button
            className="w-12 py-3 rounded-xl bg-obsidian border border-chrome-silver/10 flex items-center justify-center"
            whileTap={{ scale: 0.97 }}
          >
            <Share2 className="w-4 h-4 text-chrome-silver" />
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-border">
        <div className="flex">
          {([
            { key: "videos", icon: Grid3X3, label: "Videos" },
            { key: "series", icon: Film, label: "Series" },
            { key: "about", icon: Users, label: "About" },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.key ? "text-pure-white" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="creatorTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-button"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === "videos" && (
            <motion.div
              key="videos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-3 gap-2"
            >
              {displayVideos.map((video) => (
                <motion.div
                  key={video.id}
                  className="relative aspect-[9/16] rounded-lg overflow-hidden bg-obsidian cursor-pointer"
                  whileTap={{ scale: 0.97 }}
                >
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 video-overlay" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs font-medium text-pure-white truncate">{video.title}</p>
                    <div className="flex items-center gap-1 text-[10px] text-chrome-silver/70 mt-0.5">
                      <Eye className="w-3 h-3" />
                      <span>{video.views}</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Play className="w-4 h-4 text-pure-white/80" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          {activeTab === "series" && (
            <motion.div
              key="series"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[{ name: "Crown Heights Chronicles", episodes: 5, thumb: thumb1 }, { name: "Golden Hour Diaries", episodes: 6, thumb: thumb2 }].map((series) => (
                <div key={series.name} className="flex gap-4 p-3 rounded-xl bg-obsidian border border-chrome-silver/5">
                  <img src={series.thumb} alt={series.name} className="w-24 h-32 rounded-lg object-cover" />
                  <div className="flex-1 flex flex-col justify-center gap-2">
                    <h3 className="font-display text-base text-pure-white">{series.name}</h3>
                    <p className="text-xs text-muted-foreground">{series.episodes} Episodes</p>
                    <motion.button
                      className="self-start px-4 py-2 rounded-lg bg-gradient-button text-xs font-bold text-pure-white"
                      whileTap={{ scale: 0.95 }}
                    >
                      Watch Now
                    </motion.button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          {activeTab === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-obsidian border border-chrome-silver/5 space-y-3">
                <h3 className="font-display text-base text-pure-white">About</h3>
                <p className="text-sm text-chrome-silver/80 leading-relaxed">
                  {creator.name} is an award-winning filmmaker and content creator known for groundbreaking stories that celebrate Black culture, resilience, and excellence. Based in Brooklyn, NY.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-obsidian border border-chrome-silver/5 space-y-3">
                <h3 className="font-display text-base text-pure-white">Upload Schedule</h3>
                <p className="text-sm text-chrome-silver/80">New episodes every Tuesday & Friday</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav activeTab="profile" onTabChange={(tab) => {
        if (tab === "home") navigate("/");
        if (tab === "discover") navigate("/discover");
        if (tab === "profile") navigate("/profile");
      }} />
    </div>
  );
};

export default CreatorProfile;
