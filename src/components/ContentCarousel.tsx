import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import LazyImage from "@/components/ui/LazyImage";
import type { Show, ContentSection } from "@/hooks/useContent";
import { useWheelPassthrough } from "@/hooks/useWheelPassthrough";

interface ContentCarouselProps {
  section: ContentSection;
}

const BadgeLabel: React.FC<{ type: Show['badge_type'] }> = ({ type }) => {
  if (type === 'none') return null;

  const badges = {
    new_episode: { text: 'NEW EPISODE', bg: 'bg-pink-500' },
    watch_for_free: { text: 'WATCH FOR FREE', bg: 'bg-gradient-to-r from-pink-500 to-orange-400' },
    new: { text: 'NEW', bg: 'bg-green-500' },
    premium: { text: 'PREMIUM', bg: 'bg-amber-500' },
  };

  const badge = badges[type];
  if (!badge) return null;

  return (
    <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-white rounded ${badge.bg} shadow-lg`}>
      {badge.text}
    </span>
  );
};

const ContentCarousel: React.FC<ContentCarouselProps> = ({ section }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useWheelPassthrough(scrollRef);

  const isPoster = section.section_type === 'poster';

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!section.shows || section.shows.length === 0) return null;

  return (
    <section className="py-4 md:py-6">
      {/* Section Header */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 mb-3 sm:mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">
            {section.title}
          </h2>
          {section.show_more_link && (
            <Link
              to={section.show_more_link}
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              More
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Carousel */}
      <div className="relative group">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-10 sm:w-12 bg-gradient-to-r from-[#0f0617] to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-10 sm:w-12 bg-gradient-to-l from-[#0f0617] to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </button>
        )}

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-3 sm:px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {section.shows.map((show) => (
            <Link
              key={show.id}
              to={`/show/${show.slug}`}
              className={`relative flex-shrink-0 group/card rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:z-10 ${
                isPoster
                  ? 'w-[130px] sm:w-[160px] md:w-[180px] lg:w-[200px] aspect-[2/3]'
                  : 'w-[200px] sm:w-[240px] md:w-[280px] lg:w-[320px] aspect-video'
              }`}
            >
              {/* Image */}
              <LazyImage
                src={isPoster ? show.poster_url || '/placeholder.svg' : show.thumbnail_url || '/placeholder.svg'}
                alt={show.title}
                className="w-full h-full object-cover"
                wrapperClassName="w-full h-full"
              />

              {/* Badge */}
              <BadgeLabel type={show.badge_type} />

              {/* Gradient Overlay for thumbnail */}
              {!isPoster && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              )}

              {/* Title for thumbnail style */}
              {!isPoster && (
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                  <h3 className="text-white text-xs sm:text-sm font-medium line-clamp-2">
                    {show.title}
                  </h3>
                </div>
              )}

              {/* Hover overlay for poster */}
              {isPoster && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-2 sm:p-3 w-full">
                    <h3 className="text-white text-xs sm:text-sm font-medium line-clamp-2">
                      {show.title}
                    </h3>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContentCarousel;
