import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Film, ChevronRight, Check, Loader2, ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { usePlatform } from "@/contexts/PlatformContext";
import { toast } from "@/hooks/use-toast";

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const channels = [
  { id: "afropunk", label: "AFROPUNK", color: "bg-afropunk" },
  { id: "codeblack", label: "CODEBLACK", color: "bg-codeblack" },
  { id: "lol", label: "LOL!", color: "bg-lol" },
  { id: "essence", label: "ESSENCE", color: "bg-essence" },
];

export function VideoUploadModal({ isOpen, onClose }: VideoUploadModalProps) {
  const { demoMode, user } = usePlatform();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"details" | "uploading" | "success">("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [episodePrice, setEpisodePrice] = useState(30);
  const [freeEpisodes, setFreeEpisodes] = useState(5);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("details");
    setTitle("");
    setDescription("");
    setSelectedChannel("");
    setVideoFiles([]);
    setCoverFile(null);
    setUploadedCount(0);
  };

  const resetAndClose = () => { reset(); onClose(); };

  // storage keys choke on chars like # ? % — keep names boring
  const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const canSaveDraft = Boolean(title.trim() && selectedChannel);
  const canPublish = canSaveDraft && videoFiles.length > 0;
  const missing = [
    !title.trim() && "a title",
    !selectedChannel && "a channel",
    videoFiles.length === 0 && "episode videos",
  ].filter(Boolean).join(", ");

  const save = async (publish: boolean) => {
    if (publish ? !canPublish : !canSaveDraft) return;
    if (demoMode || !supabase || !user) {
      toast({
        title: demoMode ? "Demo mode" : "Sign in required",
        description: demoMode
          ? "Connect Supabase (see SETUP.md) to publish real series."
          : "Sign in to publish your series.",
      });
      return;
    }

    setStep("uploading");
    try {
      // 1. Create the series (draft until all episodes land)
      const { data: series, error: sErr } = await supabase
        .from("series")
        .insert({
          creator_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          channel: selectedChannel,
          episode_price: episodePrice,
          free_episodes: freeEpisodes,
          status: "draft",
        })
        .select()
        .single();
      if (sErr) throw sErr;

      // 2. Cover image
      let coverUrl: string | null = null;
      if (coverFile) {
        const path = `${series.id}/cover-${safeName(coverFile.name)}`;
        const { error } = await supabase.storage.from("covers").upload(path, coverFile);
        if (error) throw error;
        coverUrl = supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
      }

      // 3. Episodes, in selection order
      for (let i = 0; i < videoFiles.length; i++) {
        const file = videoFiles[i];
        const path = `${series.id}/ep-${i + 1}-${safeName(file.name)}`;
        const { error: upErr } = await supabase.storage.from("videos").upload(path, file);
        if (upErr) throw upErr;
        const videoUrl = supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;

        const { error: epErr } = await supabase.from("episodes").insert({
          series_id: series.id,
          episode_number: i + 1,
          title: `Episode ${i + 1}`,
          video_url: videoUrl,
          thumbnail_url: coverUrl,
          status: "ready",
        });
        if (epErr) throw epErr;
        setUploadedCount(i + 1);
      }

      // 4. Save cover; publish only when episodes exist
      const { error: pubErr } = await supabase
        .from("series")
        .update({ cover_url: coverUrl, status: publish ? "published" : "draft" })
        .eq("id", series.id);
      if (pubErr) throw pubErr;

      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      if (publish) {
        setStep("success");
        setTimeout(resetAndClose, 2000);
      } else {
        toast({ title: "Draft saved", description: `"${title.trim()}" is saved with its cover art. Add episodes and publish when you're ready.` });
        resetAndClose();
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong. Try again.",
        variant: "destructive",
      });
      setStep("details");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-deep-space/80 backdrop-blur-sm z-[60]"
            onClick={step === "uploading" ? undefined : resetAndClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl bg-obsidian border-t border-chrome-silver/10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-chrome-silver/30" />
            </div>

            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="font-display text-xl text-pure-white">
                {step === "details" ? "New Series" : step === "uploading" ? "Publishing..." : "Published!"}
              </h2>
              {step !== "uploading" && (
                <button onClick={resetAndClose}>
                  <X className="w-6 h-6 text-chrome-silver" />
                </button>
              )}
            </div>

            <div className="px-6 pb-8">
              {step === "details" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {demoMode && (
                    <div className="rounded-xl border border-liquid-gold/30 bg-liquid-gold/5 p-3 text-xs text-liquid-gold">
                      Demo mode — uploads publish for real once Supabase is connected (SETUP.md).
                    </div>
                  )}

                  {/* Episode files */}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => setVideoFiles(Array.from(e.target.files ?? []))}
                  />
                  <motion.button
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full aspect-video rounded-2xl border-2 border-dashed border-chrome-silver/20 flex flex-col items-center justify-center gap-4 hover:border-electric-violet transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    {videoFiles.length > 0 ? (
                      <div className="text-center">
                        <Film className="w-10 h-10 text-electric-violet mx-auto mb-2" />
                        <p className="font-body font-semibold text-chrome-silver">
                          {videoFiles.length} episode{videoFiles.length > 1 ? "s" : ""} selected
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Order follows your selection — Episode 1 first
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-deep-space flex items-center justify-center">
                          <Upload className="w-7 h-7 text-electric-violet" />
                        </div>
                        <div className="text-center">
                          <p className="font-body font-semibold text-chrome-silver">Select episode videos</p>
                          <p className="text-xs text-muted-foreground mt-1">Vertical MP4/MOV · multi-select in order</p>
                        </div>
                      </>
                    )}
                  </motion.button>

                  {/* Cover */}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="w-full rounded-xl bg-deep-space border border-chrome-silver/10 font-body font-medium text-sm text-chrome-silver flex items-center justify-center gap-3 overflow-hidden"
                  >
                    {coverFile ? (
                      <div className="flex items-center gap-3 w-full p-2">
                        <img
                          src={URL.createObjectURL(coverFile)}
                          alt="Cover preview"
                          className="w-14 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-chrome-silver truncate">{coverFile.name}</p>
                          <p className="text-xs text-liquid-gold">Cover selected — tap to change</p>
                        </div>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2 py-3">
                        <ImageIcon className="w-4 h-4" /> Add cover image
                      </span>
                    )}
                  </button>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Series Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Name your series..."
                      className="w-full px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none transition-colors placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this series about?"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none transition-colors resize-none placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Monetization */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Free Episodes</label>
                      <input
                        type="number"
                        min={0}
                        value={freeEpisodes}
                        onChange={(e) => setFreeEpisodes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">🍞 Per Episode</label>
                      <input
                        type="number"
                        min={0}
                        value={episodePrice}
                        onChange={(e) => setEpisodePrice(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Channel</label>
                    <div className="grid grid-cols-2 gap-2">
                      {channels.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => setSelectedChannel(ch.id)}
                          className={`py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all border ${
                            selectedChannel === ch.id
                              ? "border-electric-violet bg-electric-violet/10 text-pure-white"
                              : "border-chrome-silver/10 bg-deep-space text-chrome-silver/70"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${ch.color}`} />
                          {ch.label}
                          {selectedChannel === ch.id && <Check className="w-4 h-4 text-electric-violet" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <motion.button
                      onClick={() => save(true)}
                      disabled={!canPublish}
                      className="w-full py-3.5 rounded-xl bg-gradient-button font-body font-bold text-pure-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.97 }}
                    >
                      Publish Series <ChevronRight className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => save(false)}
                      disabled={!canSaveDraft}
                      className="w-full py-3 rounded-xl bg-deep-space border border-chrome-silver/15 font-body font-medium text-sm text-chrome-silver disabled:opacity-40 disabled:cursor-not-allowed"
                      whileTap={{ scale: 0.97 }}
                    >
                      Save as Draft (no episodes yet)
                    </motion.button>
                    {!canPublish && (
                      <p className="text-center text-xs text-muted-foreground">
                        To publish, add {missing}.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {step === "uploading" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <Loader2 className="w-12 h-12 text-electric-violet animate-spin" />
                  <p className="font-body text-chrome-silver">
                    Uploading episode {Math.min(uploadedCount + 1, videoFiles.length)} of {videoFiles.length}...
                  </p>
                  <p className="text-xs text-muted-foreground">Keep this open until it finishes</p>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-20 h-20 rounded-full bg-gradient-button flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-pure-white" />
                  </motion.div>
                  <h3 className="font-display text-2xl text-pure-white">Published!</h3>
                  <p className="text-sm text-chrome-silver/70 text-center">Your series is now live on Dopamine</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
