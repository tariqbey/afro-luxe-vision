import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, KeyRound, UserPlus, ShieldCheck, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePlatform } from "@/contexts/PlatformContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/** What each level can do. Shown to the owner so handing out access is an
 *  informed choice rather than a guess at what the word means. */
const LEVELS = [
  { key: "owner", label: "Owner", blurb: "Everything, including handing out access." },
  { key: "admin", label: "Admin", blurb: "Full catalog and analytics. No access control." },
  { key: "editor", label: "Editor", blurb: "Upload and edit titles. No analytics." },
  { key: "analyst", label: "Analyst", blurb: "Read the numbers. Cannot touch the catalog." },
  { key: "viewer", label: "No access", blurb: "An ordinary viewer account." },
] as const;

interface TeamRow {
  user_id: string | null;
  email: string;
  username: string | null;
  level: string;
  joined: string;
  pending: boolean;
}

const Team = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = usePlatform();

  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<string>("analyst");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const team = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      if (!supabase) throw new Error("not configured");
      const { data, error } = await supabase.rpc("admin_team");
      if (error) throw error;
      return data as TeamRow[];
    },
  });

  const setAccess = useMutation({
    mutationFn: async ({ toEmail, toLevel }: { toEmail: string; toLevel: string }) => {
      if (!supabase) throw new Error("not configured");
      const { data, error } = await supabase.rpc("admin_set_access", {
        p_email: toEmail.trim().toLowerCase(),
        p_level: toLevel,
      });
      if (error) throw error;
      return data as { status: string; email: string; level: string };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      setEmail("");
      toast({
        title: res.status === "invited" ? "Access reserved" : "Access updated",
        description:
          res.status === "invited"
            ? `${res.email} becomes ${res.level} the moment they create an account with that email.`
            : `${res.email} is now ${res.level}.`,
      });
    },
    onError: (e: Error) =>
      toast({ title: "Couldn't set access", description: e.message, variant: "destructive" }),
  });

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (password.length < 8) {
      toast({ title: "Too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPw(false);
    if (error) {
      toast({ title: "Couldn't change password", description: error.message, variant: "destructive" });
      return;
    }
    setPassword("");
    setConfirm("");
    toast({ title: "Password changed", description: "Use the new one next time you sign in." });
  };

  const ownerOnly = team.isError;

  return (
    <div className="min-h-screen bg-deep-space">
      <header className="sticky top-0 z-30 border-b border-chrome-silver/10 bg-deep-space/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/admin")} aria-label="Back to admin" className="p-1">
            <ChevronLeft className="w-5 h-5 text-pure-white" />
          </button>
          <h1 className="font-display text-lg uppercase text-pure-white">Team &amp; Access</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-24">
        {/* Your own password */}
        <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-chrome-silver/70">
            <KeyRound className="w-4 h-4" />
            <h2 className="font-accent text-xs font-semibold uppercase tracking-widest">
              Your password
            </h2>
          </div>
          <p className="mt-2 font-body text-sm text-chrome-silver/60">
            Signed in as <span className="text-pure-white/90">{user?.email}</span>.
          </p>
          <form onSubmit={changePassword} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              className="flex-1 rounded-xl border border-chrome-silver/15 bg-deep-space px-3 py-2 font-body text-sm text-pure-white placeholder:text-chrome-silver/40"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm"
              autoComplete="new-password"
              className="flex-1 rounded-xl border border-chrome-silver/15 bg-deep-space px-3 py-2 font-body text-sm text-pure-white placeholder:text-chrome-silver/40"
            />
            <button
              type="submit"
              disabled={savingPw || !password}
              className="rounded-xl bg-gradient-button px-4 py-2 font-accent text-sm font-semibold text-pure-white disabled:opacity-50"
            >
              {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change"}
            </button>
          </form>
        </section>

        {ownerOnly ? (
          <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
            <p className="font-body text-sm text-chrome-silver/70">
              Only the workspace owner can hand out access. You can still change your own password above.
            </p>
          </section>
        ) : (
          <>
            {/* Invite / change access */}
            <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-chrome-silver/70">
                <UserPlus className="w-4 h-4" />
                <h2 className="font-accent text-xs font-semibold uppercase tracking-widest">
                  Give someone access
                </h2>
              </div>
              <p className="mt-2 font-body text-sm text-chrome-silver/60">
                Enter an email and a level. If they already have a Dopamine account it applies now;
                if not, it's waiting for them the moment they sign up with that email.
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="flex-1 rounded-xl border border-chrome-silver/15 bg-deep-space px-3 py-2 font-body text-sm text-pure-white placeholder:text-chrome-silver/40"
                />
                <button
                  onClick={() => setAccess.mutate({ toEmail: email, toLevel: level })}
                  disabled={!email.includes("@") || setAccess.isPending}
                  className="rounded-xl bg-gradient-button px-4 py-2 font-accent text-sm font-semibold text-pure-white disabled:opacity-50"
                >
                  {setAccess.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Grant access"}
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => setLevel(l.key)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      level === l.key
                        ? "border-electric-violet bg-electric-violet/10"
                        : "border-chrome-silver/10 hover:bg-pure-white/[0.04]",
                    )}
                  >
                    <span className="font-accent text-sm font-semibold text-pure-white">{l.label}</span>
                    <span className="mt-0.5 block font-body text-xs text-chrome-silver/60">{l.blurb}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Roster */}
            <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-chrome-silver/70">
                <ShieldCheck className="w-4 h-4" />
                <h2 className="font-accent text-xs font-semibold uppercase tracking-widest">
                  Who has access
                </h2>
              </div>
              {team.isLoading && <Loader2 className="mt-3 w-5 h-5 animate-spin text-chrome-silver/50" />}
              <ul className="mt-3 divide-y divide-chrome-silver/5">
                {(team.data ?? []).map((m) => (
                  <li key={m.email} className="flex flex-wrap items-center gap-2 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm text-pure-white/90">
                        {m.email}
                        {m.username && <span className="text-chrome-silver/50"> · @{m.username}</span>}
                      </p>
                      {m.pending && (
                        <p className="mt-0.5 flex items-center gap-1 font-body text-xs text-liquid-gold">
                          <Clock className="w-3 h-3" /> Waiting for them to sign up
                        </p>
                      )}
                    </div>
                    <select
                      value={m.level}
                      onChange={(e) => setAccess.mutate({ toEmail: m.email, toLevel: e.target.value })}
                      className="rounded-lg border border-chrome-silver/15 bg-deep-space px-2 py-1.5 font-body text-xs text-pure-white"
                    >
                      {LEVELS.map((l) => (
                        <option key={l.key} value={l.key}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Team;
