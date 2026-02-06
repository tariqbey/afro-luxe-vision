import { VideoCardProps } from "@/components/VideoCard";

import thumb1 from "@/assets/thumb-1.jpg";
import thumb2 from "@/assets/thumb-2.jpg";
import thumb3 from "@/assets/thumb-3.jpg";
import thumb4 from "@/assets/thumb-4.jpg";
import thumb5 from "@/assets/thumb-5.jpg";
import thumb6 from "@/assets/thumb-6.jpg";

export const trendingVideos: VideoCardProps[] = [
  { id: "1", title: "Crown Heights Chronicles", thumbnail: thumb1, creator: "Marcus Cole", duration: "24:35", views: "2.4M", likes: "145K", episode: 1, isNew: true, isVerified: true, channel: "afropunk" },
  { id: "2", title: "Golden Hour Diaries", thumbnail: thumb2, creator: "Jasmine Rivers", duration: "18:22", views: "1.8M", likes: "98K", episode: 5, isVerified: true, channel: "essence" },
  { id: "3", title: "Laugh Out Loud Live", thumbnail: thumb3, creator: "DeShawn Comedy", duration: "32:15", views: "3.2M", likes: "287K", isVerified: true, channel: "lol" },
  { id: "4", title: "Operation Freedom", thumbnail: thumb4, creator: "Elite Studios", duration: "45:00", views: "5.1M", likes: "412K", episode: 3, isPremium: false, coinCost: 50, isVerified: true, channel: "codeblack" },
  { id: "5", title: "Neon Dreams Tour", thumbnail: thumb5, creator: "ZAE Official", duration: "15:45", views: "890K", likes: "76K", channel: "afropunk" },
  { id: "6", title: "Boss Moves Weekly", thumbnail: thumb6, creator: "Keisha Brooks", duration: "28:10", views: "1.2M", likes: "89K", episode: 12, progress: 65, isVerified: true, channel: "essence" },
];

export const continueWatching: VideoCardProps[] = [
  { id: "7", title: "Boss Moves Weekly", thumbnail: thumb6, creator: "Keisha Brooks", duration: "28:10", views: "1.2M", likes: "89K", episode: 12, progress: 65, isVerified: true, channel: "essence" },
  { id: "8", title: "Crown Heights Chronicles", thumbnail: thumb1, creator: "Marcus Cole", duration: "24:35", views: "2.4M", likes: "145K", episode: 4, progress: 35, isVerified: true, channel: "afropunk" },
  { id: "9", title: "Operation Freedom", thumbnail: thumb4, creator: "Elite Studios", duration: "45:00", views: "5.1M", likes: "412K", episode: 2, progress: 80, isVerified: true, channel: "codeblack" },
];

export const newReleases: VideoCardProps[] = [
  { id: "10", title: "Laugh Out Loud Live", thumbnail: thumb3, creator: "DeShawn Comedy", duration: "32:15", views: "3.2M", likes: "287K", isNew: true, isVerified: true, channel: "lol" },
  { id: "11", title: "Neon Dreams Tour", thumbnail: thumb5, creator: "ZAE Official", duration: "15:45", views: "890K", likes: "76K", isNew: true, channel: "afropunk" },
  { id: "12", title: "Golden Hour Diaries", thumbnail: thumb2, creator: "Jasmine Rivers", duration: "18:22", views: "1.8M", likes: "98K", episode: 6, isNew: true, isVerified: true, channel: "essence" },
  { id: "13", title: "Crown Heights Chronicles", thumbnail: thumb1, creator: "Marcus Cole", duration: "24:35", views: "2.4M", likes: "145K", episode: 5, isNew: true, isVerified: true, channel: "afropunk" },
];

export const allVideos: VideoCardProps[] = [...trendingVideos, ...continueWatching, ...newReleases];

export const popularCreators = [
  { name: "Marcus Cole", avatar: thumb1, followers: "2.4M" },
  { name: "Jasmine Rivers", avatar: thumb2, followers: "1.8M" },
  { name: "DeShawn Comedy", avatar: thumb3, followers: "3.2M" },
  { name: "Elite Studios", avatar: thumb4, followers: "5.1M" },
  { name: "ZAE Official", avatar: thumb5, followers: "890K" },
  { name: "Keisha Brooks", avatar: thumb6, followers: "1.2M" },
];
