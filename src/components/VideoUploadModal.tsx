import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Film, Hash, ChevronDown, Check } from "lucide-react";

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
  const [step, setStep] = useState<"upload" | "details" | "success">("upload");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = () => {
    // Simulate upload
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          setStep("details");
          return 100;
        }
        return p + 8;
      });
    }, 150);
  };

  const handlePublish = () => {
    setStep("success");
    setTimeout(() => {
      setStep("upload");
      setTitle("");
      setDescription("");
      setTags("");
      setSelectedChannel("");
      onClose();
    }, 2000);
  };

  const resetAndClose = () => {
    setStep("upload");
    setUploadProgress(0);
    setUploading(false);
    onClose();
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
            onClick={resetAndClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl bg-obsidian border-t border-chrome-silver/10 max-h-[90vh] overflow-y-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-chrome-silver/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="font-display text-xl text-pure-white">
                {step === "upload" ? "Upload Video" : step === "details" ? "Video Details" : "Published!"}
              </h2>
              <button onClick={resetAndClose}>
                <X className="w-6 h-6 text-chrome-silver" />
              </button>
            </div>

            <div className="px-6 pb-8">
              {step === "upload" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Upload Zone */}
                  <motion.button
                    onClick={handleFileSelect}
                    className="w-full aspect-video rounded-2xl border-2 border-dashed border-chrome-silver/20 flex flex-col items-center justify-center gap-4 hover:border-electric-violet transition-colors"
                    whileTap={{ scale: 0.98 }}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="36" className="stroke-chrome-silver/10" strokeWidth="4" fill="none" />
                            <circle
                              cx="40" cy="40" r="36"
                              className="stroke-neon-magenta"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={226}
                              strokeDashoffset={226 - (226 * uploadProgress) / 100}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center font-accent font-bold text-pure-white">
                            {uploadProgress}%
                          </span>
                        </div>
                        <p className="text-sm text-chrome-silver">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-deep-space flex items-center justify-center">
                          <Upload className="w-7 h-7 text-electric-violet" />
                        </div>
                        <div className="text-center">
                          <p className="font-body font-semibold text-chrome-silver">Tap to select video</p>
                          <p className="text-xs text-muted-foreground mt-1">MP4, MOV, up to 500MB</p>
                        </div>
                      </>
                    )}
                  </motion.button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-chrome-silver/10" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-chrome-silver/10" />
                  </div>

                  <motion.button
                    onClick={handleFileSelect}
                    className="w-full py-3 rounded-xl bg-deep-space border border-chrome-silver/10 font-body font-medium text-sm text-chrome-silver flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.97 }}
                  >
                    <Film className="w-4 h-4" /> Record from Camera
                  </motion.button>
                </motion.div>
              )}

              {step === "details" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {/* Video preview placeholder */}
                  <div className="w-full aspect-video rounded-xl bg-deep-space flex items-center justify-center">
                    <div className="text-center">
                      <Film className="w-10 h-10 text-electric-violet mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Video uploaded ✓</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Give your video a title..."
                      className="w-full px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none transition-colors placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this video about?"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none transition-colors resize-none placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Tags</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="drama, culture, series..."
                        className="w-full pl-9 pr-4 py-3 rounded-xl bg-deep-space border border-chrome-silver/10 text-chrome-silver font-body text-sm focus:border-electric-violet outline-none transition-colors placeholder:text-muted-foreground"
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

                  <motion.button
                    onClick={handlePublish}
                    disabled={!title || !selectedChannel}
                    className="w-full py-3.5 rounded-xl bg-gradient-button font-body font-bold text-pure-white disabled:opacity-40 disabled:cursor-not-allowed"
                    whileTap={{ scale: 0.97 }}
                  >
                    Publish Video 🚀
                  </motion.button>
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
                  <p className="text-sm text-chrome-silver/70 text-center">Your video is now live on BLKTOPIA</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
