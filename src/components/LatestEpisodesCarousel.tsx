import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLatestFreeEpisodes } from "@/hooks/useLatestEpisodes";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { generateEpisodeSlug } from "@/lib/episodeSlug";
import EpisodeCard from "@/components/EpisodeCard";
import { useWheelPassthrough } from "@/hooks/useWheelPassthrough";

const LatestEpisodesCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useWheelPassthrough(scrollRef);

  const { data: settings } = useSiteSettings();
  const sectionTitle = settings?.latest_episodes_title || "Latest Free Episodes | ফ্রি এপিসোড";
  const sectionLimit = settings?.latest_episodes_limit || 15;
  const sectionEnabled = settings?.latest_episodes_enabled ?? true;

  const { data: episodes, isLoading } = useLatestFreeEpisodes(sectionLimit);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Don't render if disabled
  if (!sectionEnabled) return null;

  if (isLoading) {
    return (
      <section className="py-4 md:py-6">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 mb-3 sm:mb-4">
          <div className="h-6 w-64 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 px-3 sm:px-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.33%-8px)] md:w-[calc(25%-9px)] lg:w-[calc(20%-10px)] xl:w-[calc(18%-10px)]"
            >
              <div className="aspect-video bg-white/10 rounded-lg animate-pulse mb-2" />
              <div className="h-4 bg-white/10 rounded w-3/4 mb-1" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!episodes || episodes.length === 0) return null;

  return (
    <section className="py-4 md:py-6 bg-[#0f0617]">
      {/* Section Header */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 mb-3 sm:mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">
            {sectionTitle}
          </h2>
          <Link
            to="/free-episodes"
            className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            More
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative group">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-10 sm:w-12 bg-gradient-to-r from-[#0f0617] to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-10 sm:w-12 bg-gradient-to-l from-[#0f0617] to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </button>
        )}

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-3 sm:px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {episodes.map((episode) => (
            <Link
              key={episode.id}
              to={`/watch/${episode.show.slug}/${generateEpisodeSlug(episode.air_date, episode.episode_number)}`}
              className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.33%-8px)] md:w-[calc(25%-9px)] lg:w-[calc(20%-10px)] xl:w-[calc(18%-10px)]"
            >
              <EpisodeCard
                title={episode.show.title}
                episodeNumber={episode.episode_number}
                airDate={episode.air_date}
                thumbnailUrl={episode.thumbnail_url}
                watchUrl={episode.watch_url}
                showPosterUrl={episode.show.poster_url}
                showThumbnailUrl={episode.show.thumbnail_url}
                isFree={true}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestEpisodesCarousel;
