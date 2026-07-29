import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, Mail, Lock } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      toast({ title: "Authentication failed", description: error.message, variant: "destructive" });
      return;
    }
    if (mode === "signup") {
      toast({ title: "Welcome to Dopamine 🍞", description: "Your wallet starts with 100 free Bread." });
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-deep-space grain-overlay flex flex-col">
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-obsidian/80 flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6 text-pure-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="font-display text-4xl text-gradient-hero tracking-tight">DOPAMINE</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin" ? "Welcome back to the culture." : "Join the culture. 100 free Bread on signup."}
            </p>
          </div>

          {!isSupabaseConfigured ? (
            <div className="rounded-2xl border border-liquid-gold/30 bg-liquid-gold/5 p-5 text-center space-y-2">
              <p className="text-sm text-liquid-gold font-medium">Demo mode</p>
              <p className="text-xs text-muted-foreground">
                Accounts are disabled until Supabase is connected. Your Bread wallet
                is stored on this device for now — see SETUP.md to go live.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-obsidian border border-chrome-silver/10 text-chrome-silver text-sm focus:border-electric-violet outline-none transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (8+ characters)"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-obsidian border border-chrome-silver/10 text-chrome-silver text-sm focus:border-electric-violet outline-none transition-colors placeholder:text-muted-foreground"
                />
              </div>

              <motion.button
                type="submit"
                disabled={busy}
                className="w-full h-13 py-3.5 rounded-xl bg-gradient-button font-display text-base text-pure-white uppercase tracking-wide flex items-center justify-center gap-2 shadow-glow-magenta disabled:opacity-60"
                whileTap={{ scale: 0.98 }}
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "signin" ? "Sign In" : "Create Account"}
              </motion.button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-electric-violet font-medium"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
