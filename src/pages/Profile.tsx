import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Edit3, Grid3X3, Heart, BookmarkCheck, ChevronLeft, Camera, Upload, Play, Eye, X, Film, LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { VideoCardProps } from "@/components/VideoCard";
import { BottomNav } from "@/components/BottomNav";
import { VideoUploadModal } from "@/components/VideoUploadModal";
import { usePlatform } from "@/contexts/PlatformContext";
import { useCatalog } from "@/hooks/useCatalog";
import { allVideos } from "@/data/videos";

import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";

const myVideos = allVideos.slice(0, 6);
const likedVideos = allVideos.slice(2, 8);

const Profile = () => {
  const navigate = useNavigate();
  const platform = usePlatform();
  const [activeTab, setActiveTab] = useState<"videos" | "liked" | "saved">("videos");
  const [isEditing, setIsEditing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  const handleRedeemCode = async () => {
    if (!promoCode.trim()) return;
    const result = await platform.redeemPromo(promoCode);
    if (result.ok) {
      toast({ title: "Code accepted 🎟️", description: `${result.days ?? 30} days of Dopamine Unlimited unlocked.` });
      setPromoCode("");
    } else {
      const msgs: Record<string, string> = {
        invalid_code: "That code isn't valid.",
        code_exhausted: "That code has been fully claimed.",
        already_redeemed: "You've already used this code.",
        not_authenticated: "Sign in first, then redeem.",
      };
      toast({ title: "Couldn't redeem", description: msgs[result.error ?? ""] ?? "Try again.", variant: "destructive" });
    }
  };
  const [username, setUsername] = useState(platform.username ?? "KingCreator");
  const [bio, setBio] = useState("Filmmaker. Storyteller. Culture Architect. 🎬✨");
  const [editUsername, setEditUsername] = useState(username);
  const [editBio, setEditBio] = useState(bio);

  const stats = [
    { label: "Videos", value: "42" },
    { label: "Followers", value: "12.4K" },
    { label: "Following", value: "328" },
    { label: "Likes", value: "89K" },
  ];

  const { data: catalog } = useCatalog();
  const savedSeries: VideoCardProps[] = (catalog?.seriesList ?? [])
    .filter((s) => platform.savedIds.has(s.id))
    .map((s) => ({
      id: s.id,
      title: s.title,
      thumbnail: s.coverUrl ?? "",
      creator: s.creatorName ?? "Dopamine",
      duration: `${catalog?.episodesBySeries[s.id]?.length ?? 0} eps`,
      views: "",
      likes: "",
      channel: s.channel ?? undefined,
    }));

  const tabContent: Record<string, VideoCardProps[]> = {
    videos: myVideos,
    liked: likedVideos,
    saved: savedSeries,
  };

  const handleSaveEdit = () => {
    setUsername(editUsername);
    setBio(editBio);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-deep-space grain-overlay">
      {/* Cover Photo */}
      <div className="relative h-48 overflow-hidden">
        <img src={thumb2} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-space/40 to-deep-space" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-deep-space/60 backdrop-blur-md flex items-center justify-center z-10"
        >
          <ChevronLeft className="w-6 h-6 text-pure-white" />
        </button>
        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-deep-space/60 backdrop-blur-md flex items-center justify-center z-10">
          <Settings className="w-5 h-5 text-chrome-silver" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4">
          <div className="relative">
            <img
              src={thumb1}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover ring-4 ring-deep-space"
            />
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-electric-violet flex items-center justify-center">
              <Camera className="w-4 h-4 text-pure-white" />
            </button>
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-pure-white">@{username}</h1>
              <svg className="w-5 h-5 text-electric-violet" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm text-chrome-silver/80 leading-relaxed">{bio}</p>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <span className="font-accent font-bold text-lg text-pure-white tabular-nums">{stat.value}</span>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-5">
          <motion.button
            onClick={() => { setEditUsername(username); setEditBio(bio); setIsEditing(true); }}
            className="flex-1 py-3 rounded-xl bg-obsidian border border-chrome-silver/10 font-body font-semibold text-sm text-chrome-silver flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </motion.button>
          {(platform.demoMode || platform.isAdmin) && (
            <>
              <motion.button
                onClick={() => navigate("/admin")}
                className="flex-1 py-3 rounded-xl bg-gradient-button font-body font-semibold text-sm text-pure-white flex items-center justify-center gap-2"
                whileTap={{ scale: 0.97 }}
              >
                <Film className="w-4 h-4" /> Admin Studio
              </motion.button>
              <motion.button
                onClick={() => setShowUploadModal(true)}
                className="w-12 py-3 rounded-xl bg-obsidian border border-chrome-silver/10 flex items-center justify-center"
                whileTap={{ scale: 0.97 }}
              >
                <Upload className="w-4 h-4 text-chrome-silver" />
              </motion.button>
            </>
          )}
        </div>

        {/* Subscription */}
        <div className="mt-5 rounded-2xl border border-electric-violet/30 bg-gradient-to-br from-obsidian to-deep-space p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Dopamine Unlimited</p>
              {platform.isSubscriber ? (
                <p className="mt-1 text-sm text-pure-white font-medium">
                  👑 Active
                  {platform.subscriptionEnd && (
                    <span className="text-muted-foreground font-normal">
                      {" "}· renews {new Date(platform.subscriptionEnd).toLocaleDateString()}
                    </span>
                  )}
                </p>
              ) : (
                <p className="mt-1 text-sm text-chrome-silver/80">
                  Every episode, every series — <span className="text-pure-white font-bold">$5.99/mo</span>
                </p>
              )}
            </div>
            {platform.isSubscriber ? (
              <button
                onClick={() => platform.manageSubscription()}
                className="px-4 py-2.5 rounded-xl border border-chrome-silver/20 text-xs font-medium text-chrome-silver flex-shrink-0"
              >
                Manage
              </button>
            ) : (
              <motion.button
                onClick={() => platform.subscribe()}
                className="px-5 py-2.5 rounded-xl bg-gradient-button font-display text-sm text-pure-white uppercase tracking-wide flex-shrink-0"
                whileTap={{ scale: 0.95 }}
              >
                Subscribe
              </motion.button>
            )}
          </div>

          {!platform.isSubscriber && (
            <div className="mt-3 flex items-center gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRedeemCode(); }}
                placeholder="Have a code?"
                className="flex-1 px-4 py-2.5 rounded-xl bg-deep-space border border-chrome-silver/15 text-sm text-chrome-silver uppercase tracking-widest outline-none focus:border-liquid-gold placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground"
              />
              <button
                onClick={handleRedeemCode}
                disabled={!promoCode.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-gold font-display text-xs text-deep-space uppercase tracking-wide disabled:opacity-50"
              >
                Redeem
              </button>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="mt-3">
          {platform.demoMode ? null : platform.user ? (
            <button
              onClick={() => platform.signOut()}
              className="w-full py-3 rounded-xl bg-obsidian border border-chrome-silver/10 text-sm text-chrome-silver flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out ({platform.user.email})
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="w-full py-3 rounded-xl bg-gradient-button text-sm font-bold text-pure-white flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Sign In — your subscription follows your account
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-border">
        <div className="flex">
          {([
            { key: "videos", icon: Grid3X3, label: "Videos" },
            { key: "liked", icon: Heart, label: "Liked" },
            { key: "saved", icon: BookmarkCheck, label: "Saved" },
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
                  layoutId="profileTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-button"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="px-4 py-4 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-3 gap-2"
          >
            {activeTab === "saved" && tabContent.saved.length === 0 && (
              <p className="col-span-3 text-center text-sm text-muted-foreground py-10">
                Nothing saved yet — tap Save in the player or MY LIST on the home page.
              </p>
            )}
            {tabContent[activeTab].map((video) => (
              <motion.div
                key={video.id}
                className="relative aspect-[9/16] rounded-lg overflow-hidden bg-obsidian"
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  activeTab === "saved"
                    ? navigate(`/?s=${video.id}`)
                    : navigate(`/creator/${video.creator.replace(/\s/g, "").toLowerCase()}`)
                }
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
        </AnimatePresence>
      </div>

      <BottomNav activeTab="profile" onTabChange={(tab) => {
        if (tab === "home") navigate("/");
        if (tab === "discover") navigate("/discover");
      }} />

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-deep-space/80 backdrop-blur-sm z-50"
              onClick={() => setIsEditing(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-obsidian border-t border-chrome-silver/10 p-6 max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-pure-white">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)}>
                  <X className="w-6 h-6 text-chrome-silver" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Username</label>
                  <input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body focus:border-electric-violet outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body focus:border-electric-violet outline-none transition-colors resize-none"
                  />
                </div>
                <motion.button
                  onClick={handleSaveEdit}
                  className="w-full py-3.5 rounded-xl bg-gradient-button font-body font-bold text-pure-white"
                  whileTap={{ scale: 0.97 }}
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <VideoUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
};

export default Profile;
