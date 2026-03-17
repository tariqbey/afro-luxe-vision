import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Plus, Film, Tv, Layers, Upload, Image, Trash2,
  Edit3, Eye, MoreVertical, Search, X, Check, GripVertical,
} from "lucide-react";

import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";

// Types
interface Episode {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  status: "draft" | "published" | "scheduled";
  views: string;
  uploadDate: string;
}

interface Series {
  id: string;
  title: string;
  description: string;
  coverArt: string;
  channel: string;
  episodes: Episode[];
  status: "active" | "draft" | "completed";
}

interface Vertical {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  duration: string;
  views: string;
  status: "draft" | "published";
  channel: string;
  uploadDate: string;
}

// Mock data
const initialSeries: Series[] = [
  {
    id: "s1",
    title: "Crown Heights Chronicles",
    description: "A gripping drama following five families in Brooklyn navigating love, loss, and legacy.",
    coverArt: thumb1,
    channel: "codeblack",
    status: "active",
    episodes: [
      { id: "e1", title: "Pilot - New Beginnings", description: "We meet the five families of Crown Heights.", duration: "24:35", thumbnail: thumb1, status: "published", views: "2.4M", uploadDate: "2026-01-15" },
      { id: "e2", title: "The Reckoning", description: "Tensions rise as old secrets surface.", duration: "26:10", thumbnail: thumb2, status: "published", views: "1.8M", uploadDate: "2026-01-22" },
      { id: "e3", title: "Crossroads", description: "Each family faces a pivotal decision.", duration: "28:45", thumbnail: thumb3, status: "draft", views: "0", uploadDate: "2026-01-29" },
    ],
  },
  {
    id: "s2",
    title: "Golden Hour Diaries",
    description: "Lifestyle and culture docuseries exploring Black joy in everyday moments.",
    coverArt: thumb2,
    channel: "essence",
    status: "active",
    episodes: [
      { id: "e4", title: "Morning Rituals", description: "How creators start their day.", duration: "18:22", thumbnail: thumb2, status: "published", views: "1.2M", uploadDate: "2026-02-01" },
    ],
  },
];

const initialVerticals: Vertical[] = [
  { id: "v1", title: "Behind the Scenes - Neon Queens", thumbnail: thumb5, description: "Exclusive BTS footage from the set.", duration: "0:58", views: "890K", status: "published", channel: "afropunk", uploadDate: "2026-03-01" },
  { id: "v2", title: "Quick Comedy Skit #47", thumbnail: thumb3, description: "When your barber says 'I got you' 😂", duration: "0:32", views: "3.2M", status: "published", channel: "lol", uploadDate: "2026-03-05" },
  { id: "v3", title: "Style Check - Spring 2026", thumbnail: thumb6, description: "Spring fashion inspo for the culture.", duration: "0:45", views: "456K", status: "draft", channel: "essence", uploadDate: "2026-03-10" },
];

type AdminTab = "verticals" | "series" | "episodes";
type ModalMode = "create-vertical" | "edit-vertical" | "create-series" | "edit-series" | "create-episode" | "edit-episode" | null;

const channelOptions = [
  { id: "afropunk", label: "AFROPUNK", color: "bg-afropunk" },
  { id: "codeblack", label: "CODEBLACK", color: "bg-codeblack" },
  { id: "lol", label: "LOL!", color: "bg-lol" },
  { id: "essence", label: "ESSENCE", color: "bg-essence" },
];

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("verticals");
  const [series, setSeries] = useState<Series[]>(initialSeries);
  const [verticals, setVerticals] = useState<Vertical[]>(initialVerticals);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formChannel, setFormChannel] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formStatus, setFormStatus] = useState<string>("draft");

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormChannel("");
    setFormDuration("");
    setFormStatus("draft");
    setEditingItem(null);
  };

  const openCreateModal = (mode: ModalMode) => {
    resetForm();
    setModalMode(mode);
  };

  const openEditModal = (mode: ModalMode, item: any) => {
    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormChannel(item.channel || "");
    setFormDuration(item.duration || "");
    setFormStatus(item.status || "draft");
    setEditingItem(item);
    setModalMode(mode);
  };

  const handleSaveVertical = () => {
    if (editingItem) {
      setVerticals((prev) =>
        prev.map((v) =>
          v.id === editingItem.id
            ? { ...v, title: formTitle, description: formDescription, channel: formChannel, duration: formDuration, status: formStatus as any }
            : v
        )
      );
    } else {
      const newVertical: Vertical = {
        id: `v${Date.now()}`,
        title: formTitle,
        description: formDescription,
        thumbnail: thumb4,
        channel: formChannel,
        duration: formDuration || "0:00",
        views: "0",
        status: formStatus as any,
        uploadDate: new Date().toISOString().split("T")[0],
      };
      setVerticals((prev) => [newVertical, ...prev]);
    }
    setModalMode(null);
    resetForm();
  };

  const handleSaveSeries = () => {
    if (editingItem) {
      setSeries((prev) =>
        prev.map((s) =>
          s.id === editingItem.id
            ? { ...s, title: formTitle, description: formDescription, channel: formChannel, status: formStatus as any }
            : s
        )
      );
    } else {
      const newSeries: Series = {
        id: `s${Date.now()}`,
        title: formTitle,
        description: formDescription,
        coverArt: thumb4,
        channel: formChannel,
        episodes: [],
        status: formStatus as any,
      };
      setSeries((prev) => [newSeries, ...prev]);
    }
    setModalMode(null);
    resetForm();
  };

  const handleSaveEpisode = () => {
    if (!selectedSeries) return;
    const episode: Episode = {
      id: editingItem?.id || `e${Date.now()}`,
      title: formTitle,
      description: formDescription,
      duration: formDuration || "0:00",
      thumbnail: thumb4,
      status: formStatus as any,
      views: editingItem?.views || "0",
      uploadDate: new Date().toISOString().split("T")[0],
    };

    setSeries((prev) =>
      prev.map((s) => {
        if (s.id !== selectedSeries) return s;
        if (editingItem) {
          return { ...s, episodes: s.episodes.map((e) => (e.id === editingItem.id ? episode : e)) };
        }
        return { ...s, episodes: [...s.episodes, episode] };
      })
    );
    setModalMode(null);
    resetForm();
  };

  const handleDelete = (type: "vertical" | "series" | "episode", id: string) => {
    if (type === "vertical") {
      setVerticals((prev) => prev.filter((v) => v.id !== id));
    } else if (type === "series") {
      setSeries((prev) => prev.filter((s) => s.id !== id));
      if (selectedSeries === id) setSelectedSeries(null);
    } else if (type === "episode" && selectedSeries) {
      setSeries((prev) =>
        prev.map((s) =>
          s.id === selectedSeries ? { ...s, episodes: s.episodes.filter((e) => e.id !== id) } : s
        )
      );
    }
  };

  const currentSeries = series.find((s) => s.id === selectedSeries);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      published: "bg-afropunk/20 text-afropunk-blue border-afropunk-blue/30",
      active: "bg-afropunk/20 text-afropunk-blue border-afropunk-blue/30",
      draft: "bg-liquid-gold/20 text-liquid-gold border-liquid-gold/30",
      scheduled: "bg-electric-violet/20 text-electric-violet border-electric-violet/30",
      completed: "bg-chrome-silver/20 text-chrome-silver border-chrome-silver/30",
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colors[status] || colors.draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-deep-space grain-overlay">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-deep-space/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-obsidian flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-chrome-silver" />
            </button>
            <h1 className="font-display text-lg text-pure-white">Admin Studio</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm text-gradient-hero">DOPAMINE</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4">
          {([
            { key: "verticals" as AdminTab, icon: Film, label: "Verticals" },
            { key: "series" as AdminTab, icon: Tv, label: "Series" },
            { key: "episodes" as AdminTab, icon: Layers, label: "Episodes" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); if (tab.key !== "episodes") setSelectedSeries(null); }}
              className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.key ? "text-pure-white" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.key && (
                <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-button" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-obsidian border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none transition-colors placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-32">
        <AnimatePresence mode="wait">
          {/* VERTICALS TAB */}
          {activeTab === "verticals" && (
            <motion.div key="verticals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{verticals.length} verticals</p>
                <motion.button
                  onClick={() => openCreateModal("create-vertical")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-button text-sm font-bold text-pure-white"
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" /> New Vertical
                </motion.button>
              </div>

              {verticals
                .filter((v) => !searchQuery || v.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((vertical) => (
                  <motion.div
                    key={vertical.id}
                    layout
                    className="flex gap-3 p-3 rounded-xl bg-obsidian border border-chrome-silver/5"
                  >
                    <div className="relative w-20 h-28 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={vertical.thumbnail} alt={vertical.title} className="w-full h-full object-cover" />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-deep-space/80 text-[10px] text-pure-white font-medium">
                        {vertical.duration}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h3 className="font-body font-semibold text-sm text-pure-white truncate">{vertical.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{vertical.description}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {statusBadge(vertical.status)}
                        <span className="text-[10px] text-muted-foreground">{vertical.views} views</span>
                        <span className="text-[10px] text-muted-foreground">{vertical.uploadDate}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 justify-center">
                      <button onClick={() => openEditModal("edit-vertical", vertical)} className="w-8 h-8 rounded-lg bg-deep-space flex items-center justify-center">
                        <Edit3 className="w-3.5 h-3.5 text-chrome-silver" />
                      </button>
                      <button onClick={() => handleDelete("vertical", vertical.id)} className="w-8 h-8 rounded-lg bg-deep-space flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          )}

          {/* SERIES TAB */}
          {activeTab === "series" && (
            <motion.div key="series" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{series.length} series</p>
                <motion.button
                  onClick={() => openCreateModal("create-series")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-button text-sm font-bold text-pure-white"
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-4 h-4" /> New Series
                </motion.button>
              </div>

              {series
                .filter((s) => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    className="p-3 rounded-xl bg-obsidian border border-chrome-silver/5"
                  >
                    <div className="flex gap-3">
                      <div className="relative w-24 h-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={s.coverArt} alt={s.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h3 className="font-body font-semibold text-sm text-pure-white">{s.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {statusBadge(s.status)}
                          <span className="text-[10px] text-muted-foreground">{s.episodes.length} episodes</span>
                          <div className={`w-2 h-2 rounded-full ${channelOptions.find((c) => c.id === s.channel)?.color || "bg-muted"}`} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 justify-center">
                        <button
                          onClick={() => { setSelectedSeries(s.id); setActiveTab("episodes"); }}
                          className="w-8 h-8 rounded-lg bg-deep-space flex items-center justify-center"
                        >
                          <Layers className="w-3.5 h-3.5 text-electric-violet" />
                        </button>
                        <button onClick={() => openEditModal("edit-series", s)} className="w-8 h-8 rounded-lg bg-deep-space flex items-center justify-center">
                          <Edit3 className="w-3.5 h-3.5 text-chrome-silver" />
                        </button>
                        <button onClick={() => handleDelete("series", s.id)} className="w-8 h-8 rounded-lg bg-deep-space flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          )}

          {/* EPISODES TAB */}
          {activeTab === "episodes" && (
            <motion.div key="episodes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Series Selector */}
              {!selectedSeries ? (
                <div className="text-center py-12 space-y-3">
                  <Tv className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-chrome-silver font-medium">Select a series to manage episodes</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {series.map((s) => (
                      <motion.button
                        key={s.id}
                        onClick={() => setSelectedSeries(s.id)}
                        className="px-4 py-2 rounded-xl bg-obsidian border border-chrome-silver/10 text-sm text-chrome-silver"
                        whileTap={{ scale: 0.95 }}
                      >
                        {s.title}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedSeries(null)} className="text-xs text-electric-violet">← All Series</button>
                      <span className="text-xs text-muted-foreground">|</span>
                      <p className="text-sm text-pure-white font-medium">{currentSeries?.title}</p>
                    </div>
                    <motion.button
                      onClick={() => openCreateModal("create-episode")}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-button text-sm font-bold text-pure-white"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-4 h-4" /> New Episode
                    </motion.button>
                  </div>

                  {currentSeries?.episodes
                    .filter((e) => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((episode, index) => (
                      <motion.div
                        key={episode.id}
                        layout
                        className="flex gap-3 p-3 rounded-xl bg-obsidian border border-chrome-silver/5"
                      >
                        <div className="flex items-center text-muted-foreground mr-1">
                          <span className="font-accent font-bold text-lg tabular-nums">{index + 1}</span>
                        </div>
                        <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={episode.thumbnail} alt={episode.title} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded bg-deep-space/80 text-[9px] text-pure-white font-medium">
                            {episode.duration}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h3 className="font-body font-semibold text-sm text-pure-white truncate">{episode.title}</h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{episode.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusBadge(episode.status)}
                            <span className="text-[10px] text-muted-foreground">{episode.views} views</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 justify-center">
                          <button onClick={() => openEditModal("edit-episode", episode)} className="w-7 h-7 rounded-lg bg-deep-space flex items-center justify-center">
                            <Edit3 className="w-3 h-3 text-chrome-silver" />
                          </button>
                          <button onClick={() => handleDelete("episode", episode.id)} className="w-7 h-7 rounded-lg bg-deep-space flex items-center justify-center">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                  {currentSeries?.episodes.length === 0 && (
                    <div className="text-center py-8">
                      <Film className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No episodes yet. Add your first one!</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalMode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-deep-space/80 backdrop-blur-sm z-[60]"
              onClick={() => { setModalMode(null); resetForm(); }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl bg-obsidian border-t border-chrome-silver/10 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-chrome-silver/30" />
              </div>

              <div className="flex items-center justify-between px-6 pb-4">
                <h2 className="font-display text-xl text-pure-white">
                  {modalMode.startsWith("create") ? "Create" : "Edit"}{" "}
                  {modalMode.includes("vertical") ? "Vertical" : modalMode.includes("series") ? "Series" : "Episode"}
                </h2>
                <button onClick={() => { setModalMode(null); resetForm(); }}>
                  <X className="w-6 h-6 text-chrome-silver" />
                </button>
              </div>

              <div className="px-6 pb-8 space-y-5">
                {/* Cover Art / Thumbnail Upload */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                    {modalMode.includes("series") ? "Cover Art" : "Thumbnail"}
                  </label>
                  <motion.button
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-chrome-silver/20 flex flex-col items-center justify-center gap-2 hover:border-electric-violet transition-colors bg-deep-space"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Image className="w-8 h-8 text-electric-violet" />
                    <p className="text-xs text-muted-foreground">Tap to upload image</p>
                  </motion.button>
                </div>

                {/* Video Upload (for verticals & episodes) */}
                {!modalMode.includes("series") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Video File</label>
                    <motion.button
                      className="w-full py-4 rounded-xl border-2 border-dashed border-chrome-silver/20 flex items-center justify-center gap-3 hover:border-electric-violet transition-colors bg-deep-space"
                      whileTap={{ scale: 0.98 }}
                    >
                      <Upload className="w-6 h-6 text-electric-violet" />
                      <div className="text-left">
                        <p className="text-sm text-chrome-silver font-medium">Upload Video</p>
                        <p className="text-[10px] text-muted-foreground">MP4, MOV — up to 500MB</p>
                      </div>
                    </motion.button>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Title</label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Enter title..."
                    className="w-full px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none transition-colors placeholder:text-muted-foreground"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe your content..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none transition-colors resize-none placeholder:text-muted-foreground"
                  />
                </div>

                {/* Duration (for verticals & episodes) */}
                {!modalMode.includes("series") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Duration</label>
                    <input
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      placeholder="e.g. 24:35"
                      className="w-full px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none transition-colors placeholder:text-muted-foreground"
                    />
                  </div>
                )}

                {/* Channel (for verticals & series) */}
                {!modalMode.includes("episode") && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Channel</label>
                    <div className="grid grid-cols-2 gap-2">
                      {channelOptions.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => setFormChannel(ch.id)}
                          className={`py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all border ${
                            formChannel === ch.id
                              ? "border-electric-violet bg-electric-violet/10 text-pure-white"
                              : "border-chrome-silver/10 bg-deep-space text-chrome-silver/70"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${ch.color}`} />
                          {ch.label}
                          {formChannel === ch.id && <Check className="w-4 h-4 text-electric-violet" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Status</label>
                  <div className="flex gap-2">
                    {(modalMode.includes("series")
                      ? ["draft", "active", "completed"]
                      : ["draft", "published", "scheduled"]
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFormStatus(s)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border capitalize ${
                          formStatus === s
                            ? "border-electric-violet bg-electric-violet/10 text-pure-white"
                            : "border-chrome-silver/10 bg-deep-space text-chrome-silver/70"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <motion.button
                  onClick={() => {
                    if (modalMode.includes("vertical")) handleSaveVertical();
                    else if (modalMode.includes("series")) handleSaveSeries();
                    else handleSaveEpisode();
                  }}
                  disabled={!formTitle}
                  className="w-full py-3.5 rounded-xl bg-gradient-button font-body font-bold text-pure-white disabled:opacity-40 disabled:cursor-not-allowed"
                  whileTap={{ scale: 0.97 }}
                >
                  {modalMode.startsWith("create") ? "Create" : "Save Changes"} 🚀
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
