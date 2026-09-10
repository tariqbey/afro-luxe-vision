import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { ChevronLeft, Loader2, Crown, Users, PlayCircle, Clock, TrendingUp, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/** Chart hues, validated for contrast and colour-vision separation against the
 *  app's near-black surface. Don't swap these for raw brand tokens — the neon
 *  magenta and gold both fail the lightness band on this background. */
const SERIES_A = "#964ae3"; // violet — the primary measure
const SERIES_B = "#b57f0c"; // gold — the secondary measure
const INK_MUTED = "#8a8a8a";
const GRID = "rgba(230,230,230,0.08)";

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

const MONTHLY_PRICE = 5.99;

interface Overview {
  plays: number; plays_prev: number; viewers: number; watch_seconds: number;
  completions: number; signups: number; total_members: number;
  active_subs: number; new_subs: number; product_clicks: number;
  product_saves: number; comments: number; saves: number;
}
interface SeriesStat {
  series_id: string; title: string; plays: number; viewers: number;
  watch_seconds: number; completions: number; saves: number; dropoff_episode: number | null;
}
interface DailyRow { day: string; plays: number; viewers: number; watch_seconds: number; signups: number }
interface FunnelRow { episode_number: number; viewers: number; plays: number; avg_seconds: number; completions: number }
interface ActivityRow {
  at: string; viewer: string; is_member: boolean; series_title: string;
  episode_number: number; seconds_watched: number; completed: boolean;
}
interface RevenueRow {
  series_id: string; title: string; watch_seconds: number; watch_share: number;
  subscription_revenue: number; sponsorship_revenue: number; total_revenue: number;
}
interface GeoRow { country: string; region: string; viewers: number; plays: number; watch_seconds: number }
interface Audience {
  devices: { device: string; viewers: number; plays: number }[];
  members_total: number; members_with_age: number;
  age_bands: { band: string; members: number }[];
  gender: { gender: string; members: number }[];
  signed_in_share: number;
}
interface ProductStat {
  product_id: string; name: string; brand: string | null;
  series_title: string; saves: number; clicks: number;
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error("not configured");
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data as T;
}

function hhmm(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function StatTile({
  icon: Icon, label, value, sub, accent,
}: {
  icon: typeof Users; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-chrome-silver/70">
        <Icon className={cn("w-4 h-4", accent && "text-liquid-gold")} />
        <span className="font-accent text-[11px] font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl text-pure-white leading-none">{value}</p>
      {sub && <p className="mt-1 font-body text-xs text-chrome-silver/60">{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[];
  label?: string | number; unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-chrome-silver/15 bg-deep-space/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="font-accent text-[11px] font-semibold uppercase tracking-wide text-chrome-silver/70">
        {unit === "episode" ? `Episode ${label}` : label}
      </p>
      {payload.map((p) => (
        <p key={p.name} className="mt-1 flex items-center gap-2 font-body text-xs text-pure-white">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

const Analytics = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

  const overview = useQuery({ queryKey: ["an-overview", days], queryFn: () => rpc<Overview>("admin_overview", { p_days: days }) });
  const seriesStats = useQuery({ queryKey: ["an-series", days], queryFn: () => rpc<SeriesStat[]>("admin_series_stats", { p_days: days }) });
  const daily = useQuery({ queryKey: ["an-daily", days], queryFn: () => rpc<DailyRow[]>("admin_daily", { p_days: days }) });
  const activity = useQuery({ queryKey: ["an-activity"], queryFn: () => rpc<ActivityRow[]>("admin_recent_activity", { p_limit: 40 }), refetchInterval: 30_000 });
  const products = useQuery({ queryKey: ["an-products", days], queryFn: () => rpc<ProductStat[]>("admin_product_stats", { p_days: days }) });
  const revenue = useQuery({ queryKey: ["an-revenue", days], queryFn: () => rpc<RevenueRow[]>("admin_revenue", { p_days: days }) });
  const geography = useQuery({ queryKey: ["an-geo", days], queryFn: () => rpc<GeoRow[]>("admin_geography", { p_days: days }) });
  const audience = useQuery({ queryKey: ["an-audience", days], queryFn: () => rpc<Audience>("admin_audience", { p_days: days }) });

  const activeSeries = selectedSeries ?? seriesStats.data?.find((s) => s.plays > 0)?.series_id ?? null;
  const funnel = useQuery({
    queryKey: ["an-funnel", activeSeries, days],
    queryFn: () => rpc<FunnelRow[]>("admin_episode_funnel", { p_series_id: activeSeries, p_days: days }),
    enabled: Boolean(activeSeries),
  });

  const o = overview.data;
  const playsDelta = o && o.plays_prev > 0 ? Math.round(((o.plays - o.plays_prev) / o.plays_prev) * 100) : null;

  const trend = useMemo(
    () => (daily.data ?? []).map((d) => ({
      day: new Date(d.day + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      Plays: d.plays,
      Viewers: d.viewers,
    })),
    [daily.data],
  );

  const funnelData = useMemo(
    () => (funnel.data ?? []).map((f) => ({ ep: f.episode_number, Viewers: f.viewers })),
    [funnel.data],
  );

  const activeTitle = seriesStats.data?.find((s) => s.series_id === activeSeries)?.title ?? "";
  const firstEpViewers = funnel.data?.[0]?.viewers ?? 0;

  const totalRevenue = (revenue.data ?? []).reduce((sum, r) => sum + Number(r.total_revenue), 0);
  const geoMax = Math.max(1, ...(geography.data ?? []).map((g) => g.watch_seconds));
  const deviceTotal = Math.max(1, (audience.data?.devices ?? []).reduce((s, d) => s + d.plays, 0));

  return (
    <div className="min-h-screen bg-deep-space">
      <header className="sticky top-0 z-30 border-b border-chrome-silver/10 bg-deep-space/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/admin")} aria-label="Back to admin" className="p-1">
            <ChevronLeft className="w-5 h-5 text-pure-white" />
          </button>
          <h1 className="font-display text-lg uppercase text-pure-white">Analytics</h1>
          <div className="ml-auto flex gap-1 rounded-full bg-pure-white/5 p-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={cn(
                  "rounded-full px-3 py-1 font-accent text-xs font-semibold transition-colors",
                  days === r.days ? "bg-electric-violet text-pure-white" : "text-chrome-silver/70",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-24">
        {overview.isError && (
          <p className="rounded-xl border border-neon-magenta/30 bg-neon-magenta/10 p-4 font-body text-sm text-pure-white">
            Couldn't load analytics. This page is admin-only — check you're signed in as the admin account.
          </p>
        )}

        {/* Headline numbers */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile
            icon={PlayCircle} label="Episode plays"
            value={o ? o.plays.toLocaleString() : "—"}
            sub={playsDelta !== null ? `${playsDelta >= 0 ? "+" : ""}${playsDelta}% vs previous ${days} days` : `last ${days} days`}
          />
          <StatTile
            icon={Users} label="Viewers"
            value={o ? o.viewers.toLocaleString() : "—"}
            sub={o ? `${o.total_members.toLocaleString()} accounts all-time` : undefined}
          />
          <StatTile
            icon={Clock} label="Watch time"
            value={o ? hhmm(o.watch_seconds) : "—"}
            sub={o && o.plays > 0 ? `${Math.round(o.watch_seconds / o.plays)}s average per play` : undefined}
          />
          <StatTile
            icon={Crown} label="Members" accent
            value={o ? o.active_subs.toLocaleString() : "—"}
            sub={o ? `$${(o.active_subs * MONTHLY_PRICE).toFixed(2)} monthly recurring` : undefined}
          />
          <StatTile icon={TrendingUp} label="New signups" value={o ? o.signups.toLocaleString() : "—"} sub={`last ${days} days`} />
          <StatTile
            icon={PlayCircle} label="Completed"
            value={o ? o.completions.toLocaleString() : "—"}
            sub={o && o.plays > 0 ? `${Math.round((o.completions / o.plays) * 100)}% of plays watched to the end` : undefined}
          />
          <StatTile
            icon={ShoppingBag} label="Product saves"
            value={o ? o.product_saves.toLocaleString() : "—"}
            sub={o ? `${o.product_clicks} click-throughs to the brand` : undefined}
          />
          <StatTile
            icon={Users} label="Engagement"
            value={o ? (o.comments + o.saves).toLocaleString() : "—"}
            sub={o ? `${o.comments} comments · ${o.saves} saved to lists` : undefined}
          />
        </section>

        {/* Revenue */}
        <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-accent text-xs font-semibold uppercase tracking-widest text-chrome-silver/70">
              What each title earned
            </h2>
            <p className="font-display text-xl text-liquid-gold">
              ${totalRevenue.toFixed(2)}
              <span className="ml-2 font-body text-xs text-chrome-silver/50">over {days} days</span>
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="text-left font-accent text-[11px] uppercase tracking-wide text-chrome-silver/50">
                  <th className="py-2 pr-3 font-semibold">Series</th>
                  <th className="py-2 pr-3 text-right font-semibold">Share of watching</th>
                  <th className="py-2 pr-3 text-right font-semibold">From memberships</th>
                  <th className="py-2 pr-3 text-right font-semibold">From sponsors</th>
                  <th className="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {(revenue.data ?? []).map((r) => (
                  <tr key={r.series_id} className="border-t border-chrome-silver/5 font-body text-sm text-pure-white/90">
                    <td className="py-2.5 pr-3">{r.title}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{Math.round(Number(r.watch_share) * 100)}%</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">${Number(r.subscription_revenue).toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">${Number(r.sponsorship_revenue).toFixed(2)}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-liquid-gold">
                      ${Number(r.total_revenue).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-body text-xs text-chrome-silver/50">
            Membership is one price for the whole catalog, so no title earns it directly. Subscription
            money is split by each title's share of watch time — the same way the big streamers do it.
            Sponsorship money is attributed to its series outright.
          </p>
        </section>

        {/* Daily trend */}
        <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
          <h2 className="font-accent text-xs font-semibold uppercase tracking-widest text-chrome-silver/70">
            Plays and viewers per day
          </h2>
          <div className="mt-4 h-64 w-full">
            {daily.isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-chrome-silver/50" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: INK_MUTED, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
                  <YAxis tick={{ fill: INK_MUTED, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: INK_MUTED }} iconType="plainline" />
                  <Line type="monotone" dataKey="Plays" stroke={SERIES_A} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Viewers" stroke={SERIES_B} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Per-series performance */}
        <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
          <h2 className="font-accent text-xs font-semibold uppercase tracking-widest text-chrome-silver/70">
            How each title is performing
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="text-left font-accent text-[11px] uppercase tracking-wide text-chrome-silver/50">
                  <th className="py-2 pr-3 font-semibold">Series</th>
                  <th className="py-2 pr-3 text-right font-semibold">Plays</th>
                  <th className="py-2 pr-3 text-right font-semibold">Viewers</th>
                  <th className="py-2 pr-3 text-right font-semibold">Watch time</th>
                  <th className="py-2 pr-3 text-right font-semibold">Saved</th>
                  <th className="py-2 text-right font-semibold">Drops off at</th>
                </tr>
              </thead>
              <tbody>
                {(seriesStats.data ?? []).map((s) => (
                  <tr
                    key={s.series_id}
                    onClick={() => setSelectedSeries(s.series_id)}
                    className={cn(
                      "cursor-pointer border-t border-chrome-silver/5 font-body text-sm text-pure-white/90 transition-colors hover:bg-pure-white/[0.04]",
                      s.series_id === activeSeries && "bg-electric-violet/10",
                    )}
                  >
                    <td className="py-2.5 pr-3">{s.title}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{s.plays.toLocaleString()}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{s.viewers.toLocaleString()}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{hhmm(s.watch_seconds)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{s.saves.toLocaleString()}</td>
                    <td className="py-2.5 text-right tabular-nums text-liquid-gold">
                      {s.dropoff_episode ? `Ep ${s.dropoff_episode}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-body text-xs text-chrome-silver/50">
            "Drops off at" is the episode where the most viewers stopped. Tap a row to see its full retention curve.
          </p>
        </section>

        {/* Retention curve */}
        <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
          <h2 className="font-accent text-xs font-semibold uppercase tracking-widest text-chrome-silver/70">
            Viewers who reached each episode{activeTitle && ` — ${activeTitle}`}
          </h2>
          <div className="mt-4 h-64 w-full">
            {funnel.isLoading || !activeSeries ? (
              <div className="flex h-full items-center justify-center font-body text-sm text-chrome-silver/50">
                {activeSeries ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pick a title above."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="ep" tick={{ fill: INK_MUTED, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={12} />
                  <YAxis tick={{ fill: INK_MUTED, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip unit="episode" />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="Viewers" fill={SERIES_A} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {firstEpViewers > 0 && (
            <p className="mt-3 font-body text-xs text-chrome-silver/50">
              {firstEpViewers} viewers started episode 1. The cliff after the free window is where the
              paywall is doing its work — or losing people.
            </p>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Where they're watching */}
          <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
            <h2 className="font-accent text-xs font-semibold uppercase tracking-widest text-chrome-silver/70">
              Where they're watching from
            </h2>
            <ul className="mt-3 space-y-2.5">
              {(geography.data ?? []).map((g) => (
                <li key={`${g.country}-${g.region}`}>
                  <div className="flex items-baseline justify-between gap-2 font-body text-sm">
                    <span className="truncate text-pure-white/90">
                      {g.country}
                      {g.region && <span className="text-chrome-silver/50"> · {g.region}</span>}
                    </span>
                    <span className="shrink-0 tabular-nums text-chrome-silver/60">
                      {g.viewers} {g.viewers === 1 ? "viewer" : "viewers"} · {hhmm(g.watch_seconds)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-pure-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(g.watch_seconds / geoMax) * 100}%`, background: SERIES_A }}
                    />
                  </div>
                </li>
              ))}
              {geography.data?.length === 0 && (
                <li className="font-body text-sm text-chrome-silver/50">No plays logged yet.</li>
              )}
            </ul>
            {(geography.data ?? []).some((g) => g.country === "Unknown") && (
              <p className="mt-3 font-body text-xs text-chrome-silver/50">
                "Unknown" is everything watched before location capture shipped, plus anyone behind a
                VPN. New plays resolve to a country at the edge — no location permission is asked of
                the viewer.
              </p>
            )}
          </section>

          {/* Who they are */}
          <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
            <h2 className="font-accent text-xs font-semibold uppercase tracking-widest text-chrome-silver/70">
              Who the audience is
            </h2>

            <p className="mt-3 font-accent text-[11px] font-semibold uppercase tracking-wide text-chrome-silver/50">
              Device
            </p>
            <ul className="mt-1.5 space-y-2">
              {(audience.data?.devices ?? []).map((d) => (
                <li key={d.device}>
                  <div className="flex items-baseline justify-between font-body text-sm">
                    <span className="capitalize text-pure-white/90">{d.device}</span>
                    <span className="tabular-nums text-chrome-silver/60">
                      {Math.round((d.plays / deviceTotal) * 100)}% of plays
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-pure-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(d.plays / deviceTotal) * 100}%`, background: SERIES_B }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-body text-sm">
              <span className="text-chrome-silver/60">
                Signed in:{" "}
                <span className="text-pure-white/90">
                  {Math.round((audience.data?.signed_in_share ?? 0) * 100)}% of plays
                </span>
              </span>
              <span className="text-chrome-silver/60">
                Accounts: <span className="text-pure-white/90">{audience.data?.members_total ?? 0}</span>
              </span>
            </div>

            {(audience.data?.age_bands.length ?? 0) > 0 ? (
              <>
                <p className="mt-4 font-accent text-[11px] font-semibold uppercase tracking-wide text-chrome-silver/50">
                  Age
                </p>
                <ul className="mt-1.5 space-y-1 font-body text-sm">
                  {audience.data!.age_bands.map((a) => (
                    <li key={a.band} className="flex justify-between">
                      <span className="text-pure-white/90">{a.band}</span>
                      <span className="tabular-nums text-chrome-silver/60">{a.members}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 font-body text-xs text-chrome-silver/50">
                Age and gender are blank because nobody has been asked yet — they're optional fields
                on the profile, and this fills in as viewers choose to answer. Guessing demographics
                from behaviour would put made-up numbers in front of a sponsor, so it doesn't.
              </p>
            )}
          </section>

          {/* Live activity */}
          <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
            <h2 className="font-accent text-xs font-semibold uppercase tracking-widest text-chrome-silver/70">
              Who's watching what
            </h2>
            <ul className="mt-3 divide-y divide-chrome-silver/5">
              {(activity.data ?? []).map((a, i) => (
                <li key={`${a.at}-${i}`} className="flex items-baseline gap-2 py-2 font-body text-sm">
                  <span className={cn("shrink-0 font-semibold", a.is_member ? "text-liquid-gold" : "text-pure-white/90")}>
                    {a.viewer}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-chrome-silver/70">
                    {a.series_title} · Ep {a.episode_number}
                    {a.seconds_watched > 0 && ` · ${a.seconds_watched}s`}
                    {a.completed && " · finished"}
                  </span>
                  <span className="shrink-0 text-xs text-chrome-silver/40">
                    {new Date(a.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </li>
              ))}
              {activity.data?.length === 0 && (
                <li className="py-3 font-body text-sm text-chrome-silver/50">No plays logged yet.</li>
              )}
            </ul>
          </section>

          {/* Sponsor performance */}
          <section className="rounded-2xl border border-chrome-silver/10 bg-pure-white/[0.03] p-4">
            <h2 className="font-accent text-xs font-semibold uppercase tracking-widest text-chrome-silver/70">
              Sponsored products
            </h2>
            <ul className="mt-3 divide-y divide-chrome-silver/5">
              {(products.data ?? []).map((p) => (
                <li key={p.product_id} className="flex items-baseline gap-2 py-2 font-body text-sm">
                  <span className="min-w-0 flex-1 truncate text-pure-white/90">
                    {p.name}
                    {p.brand && <span className="text-chrome-silver/50"> · {p.brand}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums text-liquid-gold">{p.saves} saved</span>
                  <span className="shrink-0 tabular-nums text-chrome-silver/50">{p.clicks} clicks</span>
                </li>
              ))}
              {products.data?.length === 0 && (
                <li className="py-3 font-body text-sm text-chrome-silver/50">
                  No sponsored products yet.
                </li>
              )}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
