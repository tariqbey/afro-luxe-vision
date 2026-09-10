import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Film, Upload, ImageIcon, Trash2, Eye, EyeOff, Loader2, Star,
  Clapperboard, ListOrdered, ChevronUp, ChevronDown, ChevronRight, ShoppingBag, Plus, Link2,
  BarChart3, Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AdminSeries {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
  channel: string | null;
  cover_url: string | null;
  free_episodes: number;
  featured_at: string | null;
  trailer_url: string | null;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  episodeCount: number;
}

interface AdminEpisode {
  id: string;
  episode_number: number;
  title: string | null;
  duration_seconds: number | null;
}

interface AdminProduct {
  id: string;
  episode_id: string | null;
  name: string;
  price: string | null;
  image_url: string | null;
  product_url: string;
  sort_order: number;
}

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

async function fetchAdminSeries(): Promise<AdminSeries[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("series")
    .select("id, title, status, channel, cover_url, free_episodes, featured_at, trailer_url, sponsor_name, sponsor_logo_url, episodes(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s) => ({
    ...s,
    episodeCount: (s.episodes as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as AdminSeries[];
}

/** Real admin CMS: everything on this page talks to the live database. */
const Admin = () => {
  const queryClient = useQueryClient();
  const { data: seriesList, isLoading } = useQuery({
    queryKey: ["admin-series"],
    queryFn: fetchAdminSeries,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-series"] });
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };

  return (
    <main className="px-4 py-6 pb-24 max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto font-display text-2xl text-pure-white uppercase tracking-tight">Catalog</h1>
        <Link
          to="/admin/analytics"
          className="flex items-center gap-1.5 rounded-full bg-electric-violet/15 px-3 py-1.5 font-accent text-xs font-semibold text-electric-violet"
        >
          <BarChart3 className="w-4 h-4" /> Analytics
        </Link>
        <Link
          to="/admin/team"
          className="flex items-center gap-1.5 rounded-full bg-pure-white/5 px-3 py-1.5 font-accent text-xs font-semibold text-chrome-silver"
        >
          <Users className="w-4 h-4" /> Team
        </Link>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Every control here is live. Use <span className="text-electric-violet font-medium">Upload Series</span> (top
        right) to create a new series; manage existing ones below.
      </p>

      {isLoading && <Loader2 className="w-6 h-6 text-electric-violet animate-spin" />}

      {!isLoading && (seriesList?.length ?? 0) === 0 && (
        <div className="rounded-2xl border border-chrome-silver/10 bg-obsidian p-8 text-center space-y-2">
          <Film className="w-8 h-8 text-electric-violet mx-auto" />
          <p className="text-chrome-silver font-medium">No series yet</p>
          <p className="text-xs text-muted-foreground">Hit "Upload Series" in the top bar to create your first one.</p>
        </div>
      )}

      {seriesList?.map((s) => (
        <SeriesCard key={s.id} series={s} onChanged={refresh} />
      ))}
    </main>
  );
};

function SeriesCard({ series, onChanged }: { series: AdminSeries; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadNote, setUploadNote] = useState("");
  const [free, setFree] = useState(series.free_episodes);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [sponsor, setSponsor] = useState(series.sponsor_name ?? "");
  const [productFor, setProductFor] = useState<AdminEpisode | null>(null);
  const episodesInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const trailerInputRef = useRef<HTMLInputElement>(null);
  const sponsorLogoRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: episodes } = useQuery({
    queryKey: ["admin-episodes", series.id],
    queryFn: async (): Promise<AdminEpisode[]> => {
      const { data, error } = await supabase!
        .from("episodes")
        .select("id, episode_number, title, duration_seconds")
        .eq("series_id", series.id)
        .order("episode_number");
      if (error) throw error;
      return data ?? [];
    },
    enabled: showEpisodes,
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products", series.id],
    queryFn: async (): Promise<AdminProduct[]> => {
      const { data, error } = await supabase!
        .from("products")
        .select("id, episode_id, name, price, image_url, product_url, sort_order")
        .eq("series_id", series.id)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: showEpisodes,
  });

  const run = async (label: string, fn: () => Promise<void>) => {
    if (busy || !supabase) return;
    setBusy(label);
    try {
      await fn();
      onChanged();
    } catch (err) {
      console.error(err);
      toast({ title: `${label} failed`, description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(null);
      setUploadNote("");
    }
  };

  const addEpisodes = (files: File[]) =>
    run("Add episodes", async () => {
      const { data: existing } = await supabase!
        .from("episodes")
        .select("episode_number")
        .eq("series_id", series.id)
        .order("episode_number", { ascending: false })
        .limit(1);
      let nextNum = (existing?.[0]?.episode_number ?? 0) + 1;
      for (let i = 0; i < files.length; i++) {
        setUploadNote(`Uploading ${i + 1} of ${files.length}…`);
        const file = files[i];
        const path = `${series.id}/ep-${nextNum}-${safeName(file.name)}`;
        const { error: upErr } = await supabase!.storage.from("videos").upload(path, file);
        if (upErr) throw upErr;
        const videoUrl = supabase!.storage.from("videos").getPublicUrl(path).data.publicUrl;
        const { error: epErr } = await supabase!.from("episodes").insert({
          series_id: series.id,
          episode_number: nextNum,
          title: `Episode ${nextNum}`,
          video_url: videoUrl,
          thumbnail_url: series.cover_url,
          status: "ready",
        });
        if (epErr) throw epErr;
        nextNum++;
      }
      toast({ title: `${files.length} episode${files.length > 1 ? "s" : ""} added`, description: `${series.title} now has ${series.episodeCount + files.length} episodes.` });
    });

  const changeCover = (file: File) =>
    run("Change cover", async () => {
      const path = `${series.id}/cover-${Date.now()}-${safeName(file.name)}`;
      const { error } = await supabase!.storage.from("covers").upload(path, file);
      if (error) throw error;
      const coverUrl = supabase!.storage.from("covers").getPublicUrl(path).data.publicUrl;
      const { error: uErr } = await supabase!.from("series").update({ cover_url: coverUrl }).eq("id", series.id);
      if (uErr) throw uErr;
      // keep episode thumbnails in sync
      await supabase!.from("episodes").update({ thumbnail_url: coverUrl }).eq("series_id", series.id);
      toast({ title: "Cover updated", description: series.title });
    });

  const addTrailer = (file: File) =>
    run("Add trailer", async () => {
      const path = `${series.id}/trailer-${Date.now()}-${safeName(file.name)}`;
      const { error } = await supabase!.storage.from("videos").upload(path, file);
      if (error) throw error;
      const url = supabase!.storage.from("videos").getPublicUrl(path).data.publicUrl;
      const { error: uErr } = await supabase!.from("series").update({ trailer_url: url }).eq("id", series.id);
      if (uErr) throw uErr;
      toast({ title: "Trailer added 🎬", description: `${series.title} — plays free from the home hero.` });
    });

  const removeTrailer = () =>
    run("Remove trailer", async () => {
      const { error } = await supabase!.from("series").update({ trailer_url: null }).eq("id", series.id);
      if (error) throw error;
      toast({ title: "Trailer removed", description: series.title });
    });

  /** Swap episode_number with the neighbor above/below (3-step to dodge the unique constraint). */
  const moveEpisode = (ep: AdminEpisode, direction: "up" | "down") => {
    const list = episodes ?? [];
    const idx = list.findIndex((e) => e.id === ep.id);
    const neighbor = list[direction === "up" ? idx - 1 : idx + 1];
    if (!neighbor) return;
    run("Reorder", async () => {
      const TEMP = 1000000;
      let r = await supabase!.from("episodes").update({ episode_number: TEMP }).eq("id", ep.id);
      if (r.error) throw r.error;
      r = await supabase!.from("episodes").update({ episode_number: ep.episode_number }).eq("id", neighbor.id);
      if (r.error) throw r.error;
      r = await supabase!.from("episodes").update({ episode_number: neighbor.episode_number }).eq("id", ep.id);
      if (r.error) throw r.error;
      queryClient.invalidateQueries({ queryKey: ["admin-episodes", series.id] });
    });
  };

  const renameEpisode = (ep: AdminEpisode, title: string) => {
    if (title.trim() === (ep.title ?? "")) return;
    run("Rename", async () => {
      const { error } = await supabase!.from("episodes").update({ title: title.trim() || null }).eq("id", ep.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-episodes", series.id] });
    });
  };

  const deleteEpisode = (ep: AdminEpisode) => {
    if (!window.confirm(`Delete "${ep.title ?? `Episode ${ep.episode_number}`}"? Later episodes shift down to close the gap.`)) return;
    run("Delete episode", async () => {
      const { error } = await supabase!.from("episodes").delete().eq("id", ep.id);
      if (error) throw error;
      // close the gap so the free-window math stays honest
      const rest = (episodes ?? []).filter((e) => e.episode_number > ep.episode_number);
      for (const e of rest) {
        const { error: sErr } = await supabase!
          .from("episodes")
          .update({ episode_number: e.episode_number - 1 })
          .eq("id", e.id);
        if (sErr) throw sErr;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-episodes", series.id] });
    });
  };

  const saveSponsor = () =>
    run("Save sponsor", async () => {
      const value = sponsor.trim() || null;
      const { error } = await supabase!.from("series").update({ sponsor_name: value }).eq("id", series.id);
      if (error) throw error;
      toast({
        title: value ? `Sponsored by ${value}` : "Sponsorship removed",
        description: value ? "Shoppable cards will show on episodes with products." : "This series is back to normal paid content.",
      });
    });

  const uploadSponsorLogo = (file: File) =>
    run("Sponsor logo", async () => {
      const path = `${series.id}/sponsor-${Date.now()}-${safeName(file.name)}`;
      const { error } = await supabase!.storage.from("covers").upload(path, file);
      if (error) throw error;
      const url = supabase!.storage.from("covers").getPublicUrl(path).data.publicUrl;
      const { error: uErr } = await supabase!.from("series").update({ sponsor_logo_url: url }).eq("id", series.id);
      if (uErr) throw uErr;
      toast({ title: "Sponsor logo updated", description: series.sponsor_name ?? series.title });
    });

  const addProduct = (ep: AdminEpisode, name: string, url: string, price: string, imageUrl: string) =>
    run("Add product", async () => {
      const existing = (products ?? []).filter((p) => p.episode_id === ep.id).length;
      const { error } = await supabase!.from("products").insert({
        series_id: series.id,
        episode_id: ep.id,
        name: name.trim(),
        brand: series.sponsor_name,
        price: price.trim() || null,
        image_url: imageUrl.trim() || null,
        product_url: url.trim(),
        sort_order: existing,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-products", series.id] });
      toast({ title: "Product linked", description: `${name.trim()} → Episode ${ep.episode_number}` });
    });

  const removeProduct = (id: string) =>
    run("Remove product", async () => {
      const { error } = await supabase!.from("products").delete().eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-products", series.id] });
    });

  const toggleFeatured = () =>
    run(series.featured_at ? "Unfeature" : "Feature", async () => {
      if (!series.featured_at && series.status !== "published") {
        throw new Error("Publish the series first — only live series can be featured.");
      }
      const { error } = await supabase!
        .from("series")
        .update({ featured_at: series.featured_at ? null : new Date().toISOString() })
        .eq("id", series.id);
      if (error) throw error;
      toast({
        title: series.featured_at ? "Removed from hero" : "Featured on home hero ⭐",
        description: series.title,
      });
    });

  const togglePublish = () =>
    run(series.status === "published" ? "Unpublish" : "Publish", async () => {
      if (series.status !== "published" && series.episodeCount === 0) {
        throw new Error("Add at least one episode before publishing.");
      }
      const { error } = await supabase!
        .from("series")
        .update({ status: series.status === "published" ? "draft" : "published" })
        .eq("id", series.id);
      if (error) throw error;
    });

  const savePricing = () =>
    run("Save pricing", async () => {
      const { error } = await supabase!
        .from("series")
        .update({ free_episodes: free })
        .eq("id", series.id);
      if (error) throw error;
      toast({ title: "Saved", description: `First ${free} episodes free; the rest need Unlimited.` });
    });

  const deleteSeries = () => {
    if (!window.confirm(`Delete "${series.title}" and all its episodes? This can't be undone.`)) return;
    run("Delete", async () => {
      const { error } = await supabase!.from("series").delete().eq("id", series.id);
      if (error) throw error;
      toast({ title: "Series deleted", description: series.title });
    });
  };

  return (
    <div className="rounded-2xl border border-chrome-silver/10 bg-obsidian overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Cover */}
        <div className="w-20 h-28 rounded-lg overflow-hidden bg-deep-space flex-shrink-0">
          {series.cover_url ? (
            <img src={series.cover_url} alt={series.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg text-pure-white truncate">{series.title}</h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
              series.status === "published" ? "bg-emerald-500/20 text-emerald-400" : "bg-liquid-gold/20 text-liquid-gold"
            )}>
              {series.status}
            </span>
            {series.sponsor_name && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-liquid-gold/20 text-liquid-gold flex items-center gap-1">
                <ShoppingBag className="w-2.5 h-2.5" /> {series.sponsor_name}
              </span>
            )}
            {series.featured_at && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-electric-violet/20 text-electric-violet flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-current" /> Featured
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {series.channel?.toUpperCase() ?? "NO CHANNEL"} · {series.episodeCount} episode{series.episodeCount === 1 ? "" : "s"}
          </p>

          {/* Pricing */}
          <div className="flex items-center gap-2 pt-1">
            <label className="text-[10px] text-muted-foreground uppercase">Free</label>
            <input
              type="number" min={0} value={free}
              onChange={(e) => setFree(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-14 px-2 py-1 rounded-lg bg-deep-space border border-chrome-silver/10 text-chrome-silver text-xs outline-none focus:border-electric-violet"
            />
            {free !== series.free_episodes && (
              <button onClick={savePricing} className="px-2 py-1 rounded-lg bg-electric-violet/20 text-electric-violet text-xs font-medium">
                Save
              </button>
            )}
          </div>

          {/* Sponsorship */}
          <div className="flex items-center gap-2 pt-1.5">
            <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> Sponsor
            </label>
            <input
              value={sponsor}
              onChange={(e) => setSponsor(e.target.value)}
              placeholder="none — paid content"
              className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-deep-space border border-chrome-silver/10 text-chrome-silver text-xs outline-none focus:border-liquid-gold placeholder:text-muted-foreground"
            />
            {sponsor.trim() !== (series.sponsor_name ?? "") && (
              <button onClick={saveSponsor} className="px-2 py-1 rounded-lg bg-liquid-gold/20 text-liquid-gold text-xs font-medium flex-shrink-0">
                Save
              </button>
            )}
            {series.sponsor_name && (
              <button
                onClick={() => sponsorLogoRef.current?.click()}
                title="Upload sponsor logo"
                className="px-2 py-1 rounded-lg border border-chrome-silver/20 text-chrome-silver text-xs flex-shrink-0 flex items-center gap-1"
              >
                {series.sponsor_logo_url ? (
                  <img src={series.sponsor_logo_url} alt="" className="h-3 max-w-[3.5rem] object-contain" />
                ) : (
                  <><ImageIcon className="w-3 h-3" /> Logo</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
        <input
          ref={episodesInputRef} type="file" accept="video/*" multiple className="hidden"
          onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ""; if (f.length) addEpisodes(f); }}
        />
        <input
          ref={coverInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) changeCover(f); }}
        />
        <input
          ref={sponsorLogoRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadSponsorLogo(f); }}
        />
        <input
          ref={trailerInputRef} type="file" accept="video/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) addTrailer(f); }}
        />

        <ActionButton
          icon={<Upload className="w-3.5 h-3.5" />}
          label={busy === "Add episodes" ? (uploadNote || "Uploading…") : "Add Episodes"}
          onClick={() => episodesInputRef.current?.click()}
          busy={busy === "Add episodes"}
          primary
        />
        <ActionButton
          icon={<ImageIcon className="w-3.5 h-3.5" />}
          label="Change Cover"
          onClick={() => coverInputRef.current?.click()}
          busy={busy === "Change cover"}
        />
        <ActionButton
          icon={<Clapperboard className="w-3.5 h-3.5" />}
          label={series.trailer_url ? "Replace Trailer" : "Add Trailer"}
          onClick={() => trailerInputRef.current?.click()}
          busy={busy === "Add trailer"}
        />
        {series.trailer_url && (
          <ActionButton
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Remove Trailer"
            onClick={removeTrailer}
            busy={busy === "Remove trailer"}
          />
        )}
        <ActionButton
          icon={<ListOrdered className="w-3.5 h-3.5" />}
          label={showEpisodes ? "Hide Episodes" : "Episodes"}
          onClick={() => setShowEpisodes((v) => !v)}
        />
        <ActionButton
          icon={series.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          label={series.status === "published" ? "Unpublish" : "Publish"}
          onClick={togglePublish}
          busy={busy === "Publish" || busy === "Unpublish"}
        />
        <ActionButton
          icon={<Star className={cn("w-3.5 h-3.5", series.featured_at && "fill-current text-electric-violet")} />}
          label={series.featured_at ? "Unfeature" : "Feature"}
          onClick={toggleFeatured}
          busy={busy === "Feature" || busy === "Unfeature"}
        />
        <ActionButton
          icon={<Trash2 className="w-3.5 h-3.5" />}
          label="Delete"
          onClick={deleteSeries}
          busy={busy === "Delete"}
          danger
        />
      </div>

      {/* Episode manager */}
      {showEpisodes && (
        <div className="border-t border-chrome-silver/10 px-4 py-3 space-y-1.5">
          {!episodes && <Loader2 className="w-4 h-4 text-electric-violet animate-spin" />}
          {episodes?.length === 0 && (
            <p className="text-xs text-muted-foreground">No episodes yet — use Add Episodes above.</p>
          )}
          {episodes?.map((ep, i) => (
            <div key={ep.id} className="flex items-center gap-2 rounded-xl bg-deep-space px-3 py-2">
              <span className="w-7 text-center font-accent font-bold text-sm text-electric-violet tabular-nums flex-shrink-0">
                {ep.episode_number}
              </span>
              <input
                defaultValue={ep.title ?? ""}
                placeholder={`Episode ${ep.episode_number}`}
                onBlur={(e) => renameEpisode(ep, e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-sm text-chrome-silver outline-none border-b border-transparent focus:border-electric-violet/50 transition-colors"
              />
              {ep.duration_seconds != null && (
                <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                  {Math.floor(ep.duration_seconds / 60)}:{String(ep.duration_seconds % 60).padStart(2, "0")}
                </span>
              )}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {series.sponsor_name && (
                  <button
                    onClick={() => setProductFor(productFor?.id === ep.id ? null : ep)}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center hover:bg-obsidian",
                      (products ?? []).some((p) => p.episode_id === ep.id) ? "text-liquid-gold" : "text-chrome-silver/50"
                    )}
                    title="Shoppable products"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => moveEpisode(ep, "up")}
                  disabled={i === 0 || !!busy}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-chrome-silver disabled:opacity-25 hover:bg-obsidian"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveEpisode(ep, "down")}
                  disabled={i === (episodes?.length ?? 0) - 1 || !!busy}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-chrome-silver disabled:opacity-25 hover:bg-obsidian"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteEpisode(ep)}
                  disabled={!!busy}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive/70 hover:bg-obsidian disabled:opacity-25"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Shoppable products for the selected episode */}
          {productFor && (
            <ProductPanel
              episode={productFor}
              products={(products ?? []).filter((p) => p.episode_id === productFor.id)}
              onAdd={(n, u, pr, img) => addProduct(productFor, n, u, pr, img)}
              onRemove={removeProduct}
              onClose={() => setProductFor(null)}
              busy={busy === "Add product" || busy === "Remove product"}
            />
          )}

          {(episodes?.length ?? 0) > 0 && (
            <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              Order = play order. Episodes 1–{series.free_episodes} are free; the rest need Dopamine Unlimited.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ProductPanel({ episode, products, onAdd, onRemove, onClose, busy }: {
  episode: AdminEpisode;
  products: AdminProduct[];
  onAdd: (name: string, url: string, price: string, imageUrl: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const canAdd = name.trim() && url.trim().startsWith("http");

  return (
    <div className="rounded-xl border border-liquid-gold/25 bg-deep-space p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-liquid-gold uppercase tracking-wide flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5" />
          Shop this episode — Ep {episode.episode_number}
        </span>
        <button onClick={onClose} className="text-chrome-silver"><ChevronUp className="w-4 h-4" /></button>
      </div>

      {products.length > 0 && (
        <div className="space-y-1.5">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-lg bg-obsidian px-2 py-1.5">
              {p.image_url && <img src={p.image_url} alt="" className="w-8 h-10 rounded object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-chrome-silver truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                  <Link2 className="w-2.5 h-2.5" />{p.product_url.replace(/^https?:\/\//, "").slice(0, 38)}…
                </p>
              </div>
              {p.price && <span className="text-[10px] text-liquid-gold flex-shrink-0">{p.price}</span>}
              <button onClick={() => onRemove(p.id)} disabled={busy} className="text-destructive/70 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name"
          className="col-span-2 px-2.5 py-2 rounded-lg bg-obsidian border border-chrome-silver/10 text-xs text-chrome-silver outline-none focus:border-liquid-gold placeholder:text-muted-foreground" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://brand.com/product"
          className="col-span-2 px-2.5 py-2 rounded-lg bg-obsidian border border-chrome-silver/10 text-xs text-chrome-silver outline-none focus:border-liquid-gold placeholder:text-muted-foreground" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$49.99"
          className="px-2.5 py-2 rounded-lg bg-obsidian border border-chrome-silver/10 text-xs text-chrome-silver outline-none focus:border-liquid-gold placeholder:text-muted-foreground" />
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)"
          className="px-2.5 py-2 rounded-lg bg-obsidian border border-chrome-silver/10 text-xs text-chrome-silver outline-none focus:border-liquid-gold placeholder:text-muted-foreground" />
      </div>

      <button
        onClick={() => { onAdd(name, url, price, imageUrl); setName(""); setUrl(""); setPrice(""); setImageUrl(""); }}
        disabled={!canAdd || busy}
        className="w-full py-2.5 rounded-lg bg-gradient-gold font-display text-xs text-deep-space uppercase tracking-wide disabled:opacity-40 flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" /> Link product
      </button>
    </div>
  );
}

function ActionButton({ icon, label, onClick, busy, primary, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; busy?: boolean; primary?: boolean; danger?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={busy}
      className={cn(
        "px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-colors disabled:opacity-60",
        primary
          ? "bg-gradient-button text-pure-white border-transparent"
          : danger
            ? "bg-transparent text-destructive border-destructive/30 hover:border-destructive"
            : "bg-deep-space text-chrome-silver border-chrome-silver/15 hover:border-electric-violet/50"
      )}
      whileTap={{ scale: 0.96 }}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label}
    </motion.button>
  );
}

export default Admin;
