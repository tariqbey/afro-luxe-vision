/**
 * Where is this viewer watching from?
 *
 * Vercel resolves geo at the edge and hands it to us as request headers, so the
 * browser never has to ask for location and no IP is stored — the client gets
 * back a country and region only, which is what the dashboard reports on.
 */
export const config = { runtime: "edge" };

export default function handler(req: Request): Response {
  const h = req.headers;
  const body = {
    country: h.get("x-vercel-ip-country") ?? null,
    region: h.get("x-vercel-ip-country-region") ?? null,
    city: h.get("x-vercel-ip-city")
      ? decodeURIComponent(h.get("x-vercel-ip-city") as string)
      : null,
  };
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
      // Per-viewer value, but stable for a while — let the browser keep it.
      "cache-control": "private, max-age=86400",
    },
  });
}
