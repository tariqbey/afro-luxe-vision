/**
 * Serve stored media through our own domain instead of straight from Supabase.
 *
 * Supabase's public storage sits behind Cloudflare, and from some viewers'
 * locations that route slowed to a crawl — covers took 30s+, episodes never
 * started — while Vercel's servers still reached the same files at full speed.
 * vercel.json proxies /media/* to the storage bucket, so the browser talks to
 * Vercel's edge and Vercel does the fetching.
 *
 * The database keeps the canonical Supabase URLs; this only rewrites them on
 * the way to the screen, so it can be undone by deleting one line.
 */
const STORAGE_PREFIX = "https://vboxymnlcbwlrucamyiw.supabase.co/storage/v1/object/public/";

export function mediaUrl<T extends string | null | undefined>(url: T): T {
  if (!url || typeof url !== "string") return url;
  if (!url.startsWith(STORAGE_PREFIX)) return url;
  return `/media/${url.slice(STORAGE_PREFIX.length)}` as T;
}
