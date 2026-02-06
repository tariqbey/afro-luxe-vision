import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { VideoCard, VideoCardProps } from "./VideoCard";

interface VideoRowProps {
  title: string;
  videos: VideoCardProps[];
  showSeeAll?: boolean;
  onSeeAllClick?: () => void;
  onVideoClick?: (videoId: string) => void;
}

export function VideoRow({ title, videos, showSeeAll = true, onSeeAllClick, onVideoClick }: VideoRowProps) {
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="text-section text-pure-white">{title}</h2>
        {showSeeAll && (
          <motion.button
            onClick={onSeeAllClick}
            className="flex items-center gap-1 text-sm font-medium text-electric-violet hover:text-neon-magenta transition-colors"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.95 }}
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Horizontal Scroll Container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-4 pb-2">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="flex-shrink-0 w-[160px] md:w-[180px]"
            >
              <VideoCard {...video} onVideoClick={onVideoClick} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
