import { Play, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import defaultEpisodeThumb from "@/assets/default-episode-thumb.jpg";
import LazyImage from "@/components/ui/LazyImage";
import { getEpisodeThumbnail } from "@/lib/cloudinaryThumbnail";

interface EpisodeCardProps {
  title: string;
  episodeNumber?: number | null;
  airDate?: string | null;
  thumbnailUrl?: string | null;
  watchUrl?: string | null;
  showPosterUrl?: string | null;
  showThumbnailUrl?: string | null;
  isFree?: boolean;
  onClick?: () => void;
  className?: string;
}

const EpisodeCard = ({
  title,
  episodeNumber,
  airDate,
  thumbnailUrl,
  watchUrl,
  showPosterUrl,
  showThumbnailUrl,
  isFree = true,
  onClick,
  className,
}: EpisodeCardProps) => {
  // Smart fallback chain: episode thumbnail -> Cloudinary video thumb -> show thumbnail -> show poster -> default
  const displayThumbnail = getEpisodeThumbnail(
    thumbnailUrl,
    watchUrl,
    showThumbnailUrl,
    showPosterUrl,
    defaultEpisodeThumb
  );

  return (
    <div
      onClick={onClick}
      className={cn("cursor-pointer group/card", className)}
    >
      {/* Thumbnail - 16:9 Zee5 style */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-2">
        <LazyImage
          src={displayThumbnail}
          alt={title}
          fallbackSrc={defaultEpisodeThumb}
          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
          wrapperClassName="w-full h-full"
        />

        {/* Play overlay on hover - only shows on THIS card's hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          {/* Animated ring around play button */}
          <div className="relative">
            {/* Pulse ring animation */}
            <div className="absolute inset-0 w-12 h-12 -m-1 rounded-full bg-white/30 animate-ping" />
            <div className="absolute inset-0 w-12 h-12 -m-1 rounded-full bg-white/20 animate-pulse" />
            {/* Play button */}
            <div className="relative w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover/card:scale-110 transition-transform duration-300">
              <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Premium badge */}
        {!isFree && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded z-10">
            <Crown className="w-2.5 h-2.5 inline mr-0.5" />
            PRO
          </span>
        )}
        
        {/* Free badge */}
        {isFree && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded z-10">
            FREE
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight group-hover/card:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {episodeNumber && `E${episodeNumber}`}
          {airDate && (
            <span className="ml-1">
              • {new Date(airDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default EpisodeCard;
