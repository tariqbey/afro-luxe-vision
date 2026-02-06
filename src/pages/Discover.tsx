import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Hash, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { VideoCard } from "@/components/VideoCard";
import { allVideos, popularCreators } from "@/data/videos";

const categories = [
  { id: "all", label: "All", emoji: "🔥" },
  { id: "drama", label: "Drama", emoji: "🎭" },
  { id: "comedy", label: "Comedy", emoji: "😂" },
  { id: "action", label: "Action", emoji: "💥" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "lifestyle", label: "Lifestyle", emoji: "✨" },
  { id: "documentary", label: "Docs", emoji: "📽️" },
];

const trendingTags = [
  { tag: "#NeonQueens", count: "2.4M views" },
  { tag: "#CrownHeights", count: "1.8M views" },
  { tag: "#BlackExcellence", count: "5.2M views" },
  { tag: "#AFROPUNKLive", count: "890K views" },
  { tag: "#CodeBlackS3", count: "3.1M views" },
  { tag: "#GoldenHour", count: "1.2M views" },
];

const suggestions = [
  "Crown Heights Chronicles",
  "Neon Queens",
  "Marcus Cole",
  "Operation Freedom",
  "AFROPUNK Live",
  "Golden Hour Diaries",
  "DeShawn Comedy",
  "Boss Moves Weekly",
];

const Discover = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!searchQuery) return [];
    return suggestions.filter((s) =>
      s.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredVideos = useMemo(() => {
    let videos = allVideos;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      videos = videos.filter(
        (v) => v.title.toLowerCase().includes(q) || v.creator.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== "all") {
      // Simple channel mapping for demo
      const channelMap: Record<string, string> = {
        drama: "codeblack",
        comedy: "lol",
        lifestyle: "essence",
        music: "afropunk",
      };
      const channel = channelMap[activeCategory];
      if (channel) videos = videos.filter((v) => v.channel === channel);
    }
    return videos;
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-deep-space grain-overlay">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-deep-space/95 backdrop-blur-xl pt-safe px-4 pb-3">
        <div className="flex items-center gap-3 h-14">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search videos, creators, tags..."
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-obsidian border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none transition-colors placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setIsSearchFocused(false); }}
              className="text-sm text-electric-violet font-medium"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Autocomplete Suggestions */}
        <AnimatePresence>
          {isSearchFocused && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute left-4 right-4 top-full mt-1 rounded-xl bg-obsidian border border-chrome-silver/10 shadow-elevated overflow-hidden z-50"
            >
              {filteredSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSearchQuery(s); setIsSearchFocused(false); }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-deep-space transition-colors text-left"
                >
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-chrome-silver">{s}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-2">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-gradient-button text-pure-white"
                  : "bg-obsidian text-chrome-silver/70 border border-chrome-silver/10"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {cat.emoji} {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      <main className="px-4 pb-32 space-y-6 mt-4">
        {/* If no search, show trending */}
        {!searchQuery && (
          <>
            {/* Trending Hashtags */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-neon-magenta" />
                <h2 className="font-display text-lg text-pure-white">Trending Now</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((t) => (
                  <motion.button
                    key={t.tag}
                    onClick={() => setSearchQuery(t.tag.replace("#", ""))}
                    className="px-4 py-2 rounded-full bg-obsidian border border-chrome-silver/10 flex items-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Hash className="w-3 h-3 text-electric-violet" />
                    <span className="text-sm text-chrome-silver">{t.tag}</span>
                    <span className="text-[10px] text-muted-foreground">{t.count}</span>
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Featured Creators */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-liquid-gold" />
                <h2 className="font-display text-lg text-pure-white">Top Creators</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {popularCreators.map((creator) => (
                  <motion.button
                    key={creator.name}
                    onClick={() => navigate(`/creator/${creator.name.replace(/\s/g, "").toLowerCase()}`)}
                    className="flex-shrink-0 flex flex-col items-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <img src={creator.avatar} alt={creator.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-electric-violet" />
                    <span className="text-xs font-medium text-chrome-silver text-center w-16 truncate">{creator.name}</span>
                  </motion.button>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Video Results */}
        <section>
          <h2 className="font-display text-lg text-pure-white mb-3">
            {searchQuery ? `Results for "${searchQuery}"` : "Explore"}
          </h2>
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredVideos.map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-chrome-silver font-medium">No results found</p>
              <p className="text-sm text-muted-foreground mt-1">Try different keywords</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav activeTab="discover" onTabChange={(tab) => {
        if (tab === "home") navigate("/");
        if (tab === "profile") navigate("/profile");
      }} />
    </div>
  );
};

export default Discover;
