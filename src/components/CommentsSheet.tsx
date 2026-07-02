import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePlatform } from "@/contexts/PlatformContext";
import { toast } from "@/hooks/use-toast";

interface Comment {
  id: number | string;
  username: string;
  body: string;
  createdAt: string;
  mine?: boolean;
}

const DEMO_KEY = "dopamine.demo.comments";

function readDemoComments(): Record<string, Comment[]> {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

interface CommentsSheetProps {
  episodeId: string;
  episodeLabel: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsSheet({ episodeId, episodeLabel, isOpen, onClose }: CommentsSheetProps) {
  const { demoMode, user, username } = usePlatform();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", episodeId],
    enabled: isOpen,
    queryFn: async (): Promise<Comment[]> => {
      if (demoMode || !supabase) {
        return readDemoComments()[episodeId] ?? [];
      }
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, created_at, user_id, profiles:user_id(username)")
        .eq("episode_id", episodeId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.created_at,
        username: (c.profiles as { username?: string } | null)?.username ?? "viewer",
        mine: c.user_id === user?.id,
      }));
    },
  });

  const post = async () => {
    const body = draft.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      if (demoMode || !supabase) {
        const all = readDemoComments();
        (all[episodeId] ??= []).unshift({
          id: `local-${Math.random().toString(36).slice(2)}`,
          username: "you",
          body,
          createdAt: new Date().toISOString(),
          mine: true,
        });
        localStorage.setItem(DEMO_KEY, JSON.stringify(all));
      } else {
        if (!user) return;
        const { error } = await supabase.from("comments").insert({
          episode_id: episodeId,
          user_id: user.id,
          body,
        });
        if (error) throw error;
      }
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["comments", episodeId] });
    } catch (err) {
      toast({ title: "Couldn't post", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const canPost = demoMode || Boolean(user);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-deep-space/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-x-0 bottom-0 z-50 h-[60%] rounded-t-3xl bg-obsidian border-t border-chrome-silver/10 flex flex-col"
          >
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-chrome-silver/30" />
            </div>
            <div className="px-4 pb-3 border-b border-border flex-shrink-0">
              <h3 className="font-display text-lg text-pure-white text-center">
                {episodeLabel} — Chat
              </h3>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {isLoading && <Loader2 className="w-5 h-5 text-electric-violet animate-spin mx-auto" />}
              {!isLoading && (comments?.length ?? 0) === 0 && (
                <p className="text-center text-sm text-muted-foreground pt-6">
                  No comments yet — say something first. 🍞
                </p>
              )}
              {comments?.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-button flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-pure-white uppercase">
                      {c.username.slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-chrome-silver">
                        @{c.username}{c.mine && <span className="text-electric-violet"> · you</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-chrome-silver/85 break-words">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Composer */}
            <div className="flex-shrink-0 p-3 border-t border-border bg-obsidian pb-safe">
              {canPost ? (
                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") post(); }}
                    maxLength={500}
                    placeholder={`Comment as @${username ?? "you"}...`}
                    className="flex-1 px-4 py-3 rounded-full bg-deep-space border border-chrome-silver/10 text-sm text-chrome-silver outline-none focus:border-electric-violet placeholder:text-muted-foreground"
                  />
                  <motion.button
                    onClick={post}
                    disabled={!draft.trim() || posting}
                    className="w-11 h-11 rounded-full bg-gradient-button flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                    whileTap={{ scale: 0.9 }}
                  >
                    {posting ? <Loader2 className="w-4 h-4 text-pure-white animate-spin" /> : <Send className="w-4 h-4 text-pure-white" />}
                  </motion.button>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="w-full py-3 rounded-full bg-gradient-button text-sm font-bold text-pure-white flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Sign in to join the chat
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
