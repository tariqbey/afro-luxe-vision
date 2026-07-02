// Demo catalog used when Supabase isn't configured yet.
// Sample clips are small local files (public/demo) so the player,
// autoplay-next, and the Bread paywall are fully testable offline.
import { Series, Episode } from "@/lib/types";

import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";

const clips = [
  "/demo/clip-1.mp4",
  "/demo/clip-2.mp4",
  "/demo/clip-3.mp4",
  "/demo/clip-4.mp4",
  "/demo/clip-5.mp4",
];

function makeEpisodes(seriesId: string, count: number, thumb: string): Episode[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${seriesId}-ep-${i + 1}`,
    seriesId,
    episodeNumber: i + 1,
    title: `Episode ${i + 1}`,
    videoUrl: clips[i % clips.length],
    thumbnailUrl: thumb,
    durationSeconds: 15,
  }));
}

export const demoSeries: Series[] = [
  {
    id: "demo-crown-heights",
    title: "Crown Heights Chronicles",
    description: "Power, family, and secrets collide in Brooklyn's most ambitious dynasty.",
    coverUrl: thumb1,
    channel: "afropunk",
    freeEpisodes: 5,
    episodePrice: 30,
    creatorId: null,
    creatorName: "Marcus Cole",
    status: "published",
    createdAt: new Date("2026-06-01").toISOString(),
  },
  {
    id: "demo-golden-hour",
    title: "Golden Hour Diaries",
    description: "A rising photographer captures more than moments — she captures the truth.",
    coverUrl: thumb2,
    channel: "essence",
    freeEpisodes: 5,
    episodePrice: 30,
    creatorId: null,
    creatorName: "Jasmine Rivers",
    status: "published",
    createdAt: new Date("2026-06-15").toISOString(),
  },
  {
    id: "demo-operation-freedom",
    title: "Operation Freedom",
    description: "An elite unit. An impossible mission. One shot at redemption.",
    coverUrl: thumb4,
    channel: "codeblack",
    freeEpisodes: 5,
    episodePrice: 50,
    creatorId: null,
    creatorName: "Elite Studios",
    status: "published",
    createdAt: new Date("2026-06-20").toISOString(),
  },
  {
    id: "demo-lol-live",
    title: "Laugh Out Loud Live",
    description: "The funniest voices in the culture, uncut and unfiltered.",
    coverUrl: thumb3,
    channel: "lol",
    freeEpisodes: 5,
    episodePrice: 20,
    creatorId: null,
    creatorName: "DeShawn Comedy",
    status: "published",
    createdAt: new Date("2026-06-25").toISOString(),
  },
  {
    id: "demo-boss-moves",
    title: "Boss Moves Weekly",
    description: "Real entrepreneurs. Real stakes. Real moves.",
    coverUrl: thumb6,
    channel: "essence",
    freeEpisodes: 5,
    episodePrice: 25,
    creatorId: null,
    creatorName: "Keisha Brooks",
    status: "published",
    createdAt: new Date("2026-06-28").toISOString(),
  },
  {
    id: "demo-neon-dreams",
    title: "Neon Dreams Tour",
    description: "Behind the lights of the biggest underground tour in the country.",
    coverUrl: thumb5,
    channel: "afropunk",
    freeEpisodes: 5,
    episodePrice: 25,
    creatorId: null,
    creatorName: "ZAE Official",
    status: "published",
    createdAt: new Date("2026-06-30").toISOString(),
  },
];

export const demoEpisodes: Record<string, Episode[]> = Object.fromEntries(
  demoSeries.map((s) => [
    s.id,
    makeEpisodes(s.id, 12, s.coverUrl as string),
  ]),
);
