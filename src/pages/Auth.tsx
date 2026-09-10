import { useEffect, useState } from "react";
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
  // Only offer Google once the provider is actually turned on in Supabase —
  // otherwise the button is a dead end that errors after the tap.
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((r) => r.json())
      .then((s) => setGoogleReady(Boolean(s?.external?.google)))
      .catch(() => setGoogleReady(false));
  }, []);

  const handleGoogle = async () => {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setBusy(false);
      toast({ title: "Google sign-in unavailable", description: error.message, variant: "destructive" });
    }
    // success redirects to Google, so no state cleanup needed
  };

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
            <>
            {/* Google — one tap, no password to remember */}
            {googleReady && (<>
            <motion.button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full py-3.5 rounded-xl bg-pure-white flex items-center justify-center gap-3 disabled:opacity-60"
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14z"/>
              </svg>
              <span className="font-body font-semibold text-sm text-deep-space">Continue with Google</span>
            </motion.button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-chrome-silver/10" />
              <span className="text-xs text-muted-foreground">or use email</span>
              <div className="flex-1 h-px bg-chrome-silver/10" />
            </div>
            </>)}

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
            </>
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
