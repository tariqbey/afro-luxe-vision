import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Lock, Mail, ShieldCheck, Upload, LogOut } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { usePlatform } from "@/contexts/PlatformContext";
import { VideoUploadModal } from "@/components/VideoUploadModal";
import { toast } from "@/hooks/use-toast";

/**
 * Wraps the admin CMS. Content is curated: only accounts flagged
 * is_admin / is_creator can get past this gate (and RLS enforces the
 * same rule server-side, so the gate is UX — not the security boundary).
 */
/**
 * `allow` names the access levels this route accepts. Analytics admits analysts,
 * who deliberately have no catalog rights — so the gate can't just ask "is this
 * an admin?". RLS still enforces the same rule server-side; this is UX.
 */
export function AdminGate({ children, allow }: { children: ReactNode; allow?: string[] }) {
  const navigate = useNavigate();
  const { user, isAdmin, accessLevel, loading, demoMode, signOut } = usePlatform();
  const permitted = allow ? allow.includes(accessLevel) || isAdmin : isAdmin;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  };

  if (demoMode || !isSupabaseConfigured) {
    return (
      <Shell onBack={() => navigate("/")}>
        <p className="text-sm text-liquid-gold">Demo mode — connect Supabase to enable the admin studio.</p>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell onBack={() => navigate("/")}>
        <Loader2 className="w-6 h-6 text-electric-violet animate-spin" />
      </Shell>
    );
  }

  // Signed in as admin → real toolbar + CMS
  if (user && permitted) {
    return (
      <div className="min-h-screen bg-deep-space">
        <div className="sticky top-0 z-50 px-4 py-3 bg-obsidian/95 backdrop-blur-md border-b border-electric-violet/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-electric-violet" />
            <span className="font-display text-sm text-pure-white uppercase tracking-wide">
              Admin Studio — {user.email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 rounded-xl bg-gradient-button font-body font-bold text-sm text-pure-white flex items-center gap-2"
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="w-4 h-4" /> Upload Series
            </motion.button>
            <button
              onClick={() => signOut()}
              className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-chrome-silver" />
            </button>
          </div>
        </div>
        {children}
        <VideoUploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} />
      </div>
    );
  }

  // Signed in but not an admin
  if (user && !permitted) {
    return (
      <Shell onBack={() => navigate("/")}>
        <Lock className="w-10 h-10 text-destructive" />
        <h2 className="font-display text-xl text-pure-white uppercase">Admins Only</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          This account ({user.email}) doesn't have admin access. Dopamine is a
          curated platform — content is published by the studio.
        </p>
        <button onClick={() => signOut()} className="text-sm text-electric-violet font-medium">
          Sign in with a different account
        </button>
      </Shell>
    );
  }

  // Not signed in → admin login
  return (
    <Shell onBack={() => navigate("/")}>
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-6 h-6 text-electric-violet" />
        <h1 className="font-display text-2xl text-pure-white uppercase tracking-tight">Admin Login</h1>
      </div>
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-obsidian border border-chrome-silver/10 text-chrome-silver text-sm focus:border-electric-violet outline-none transition-colors placeholder:text-muted-foreground"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-obsidian border border-chrome-silver/10 text-chrome-silver text-sm focus:border-electric-violet outline-none transition-colors placeholder:text-muted-foreground"
          />
        </div>
        <motion.button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 rounded-xl bg-gradient-button font-display text-base text-pure-white uppercase tracking-wide flex items-center justify-center gap-2 shadow-glow-magenta disabled:opacity-60"
          whileTap={{ scale: 0.98 }}
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Enter Studio
        </motion.button>
      </form>
    </Shell>
  );
}

function Shell({ children, onBack }: { children: ReactNode; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-deep-space grain-overlay flex flex-col">
      <div className="p-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-obsidian/80 flex items-center justify-center">
          <ChevronLeft className="w-6 h-6 text-pure-white" />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 pb-24">
        {children}
      </div>
    </div>
  );
}
