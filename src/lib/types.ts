export type Channel = "afropunk" | "codeblack" | "lol" | "essence";

export interface Series {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  channel: Channel | null;
  /** Episodes 1..freeEpisodes play without spending Bread */
  freeEpisodes: number;
  /** Bread cost per locked episode */
  episodePrice: number;
  creatorId: string | null;
  creatorName?: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
}

export interface Episode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

export interface BreadTransaction {
  id: number;
  amount: number;
  kind: string;
  refId: string | null;
  note: string | null;
  createdAt: string;
}

export interface WatchPoint {
  episodeNumber: number;
  seconds: number;
}
