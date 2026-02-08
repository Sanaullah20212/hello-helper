import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { InArticleAd } from "@/components/AdManager";
import { Button } from "@/components/ui/button";
import { Play, Crown, ChevronLeft, ChevronRight, Grid, LayoutList, MoveHorizontal } from "lucide-react";
import { generateEpisodeSlug } from "@/lib/episodeSlug";
import { getEpisodeThumbnail } from "@/lib/cloudinaryThumbnail";
import defaultEpisodeThumb from "@/assets/default-episode-thumb.jpg";
import PageTracker from "@/components/PageTracker";
import LazyImage from "@/components/ui/LazyImage";

interface DownloadLink {
  label: string;
  url: string;
  quality?: string;
}

interface Episode {
  id: string;
  show_id: string;
  title: string;
  episode_number: number | null;
  season_number: number | null;
  thumbnail_url: string | null;
  watch_url: string | null;
  download_links: DownloadLink[] | null;
  is_free: boolean;
  is_active: boolean;
  air_date: string | null;
}

interface Show {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  poster_url: string | null;
  thumbnail_url: string | null;
  badge_type: string | null;
}

const useShowBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["show", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as Show | null;
    },
    enabled: !!slug,
  });
};

const useEpisodesByShowId = (showId: string) => {
  return useQuery({
    queryKey: ["episodes", showId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("show_id", showId)
        .eq("is_active", true)
        .order("air_date", { ascending: false, nullsFirst: false })
        .order("episode_number", { ascending: false });

      if (error) throw error;
      return data as unknown as Episode[];
    },
    enabled: !!showId,
  });
};

const ShowPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const { data: show, isLoading: showLoading } = useShowBySlug(slug || "");
  const { data: episodes } = useEpisodesByShowId(show?.id || "");

  // Group episodes by season
  const episodesBySeason = episodes?.reduce((acc, ep) => {
    const season = ep.season_number || 1;
    if (!acc[season]) acc[season] = [];
    acc[season].push(ep);
    return acc;
  }, {} as Record<number, Episode[]>) || {};

  const seasons = Object.keys(episodesBySeason).map(Number).sort((a, b) => a - b);
  const [activeSeason, setActiveSeason] = useState(seasons[0] || 1);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    // Hide swipe hint after user scrolls
    if (scrollLeft > 20) {
      setShowSwipeHint(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handlePlayEpisode = (episode: Episode) => {
    const episodeSlug = generateEpisodeSlug(episode.air_date, episode.episode_number);
    navigate(`/watch/${slug}/${episodeSlug}`);
  };

  if (showLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-1/3 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Show Not Found</h1>
          <Link to="/" className="text-primary hover:underline">Return to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  // SEO optimized title & description (ZEE5 style)
  const seoTitle = `${show.title} TV Serial Online - Watch Latest Show Episodes & Download HD | BengaliTVSerial24`;
  const seoDescription = `Watch ${show.title} Latest Episodes Online in full HD on BengaliTVSerial24. Enjoy ${show.title} best trending moments, video clips, promos & more. ${show.description ? show.description.substring(0, 100) : `Download ${show.title} all episodes free.`}`;
  const seoCanonical = `https://www.bengalitvserial24.com/show/${slug}`;
  const seoImage = show.poster_url || show.thumbnail_url || "https://www.bengalitvserial24.com/og-image.png";

  // JSON-LD for show page
  const showJsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": show.title,
    "description": seoDescription,
    "image": seoImage,
    "numberOfEpisodes": episodes?.length || 0,
    "url": seoCanonical,
    "inLanguage": "bn",
    "genre": "Drama",
    "countryOfOrigin": {
      "@type": "Country",
      "name": "India"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Tracking */}
      <PageTracker showId={show.id} />
      
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        ogImage={seoImage}
        ogType="video.tv_show"
        jsonLd={showJsonLd}
        canonical={seoCanonical}
        keywords={`${show.title},${show.title} download,${show.title} watch online,${show.title} episodes,bengali tv serial,${show.title} full episode`}
      />
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">

        {/* Show Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <img
              src={show.poster_url || show.thumbnail_url || "/placeholder.svg"}
              alt={show.title}
              className="w-40 md:w-52 aspect-[2/3] object-cover rounded-xl shadow-lg mx-auto md:mx-0"
            />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              {show.title}
            </h1>
            {show.badge_type && show.badge_type !== "none" && (
              <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full mb-4">
                {show.badge_type === "new_episode" && "New Episode"}
                {show.badge_type === "new" && "New"}
                {show.badge_type === "premium" && "Premium"}
                {show.badge_type === "watch_for_free" && "Watch Free"}
              </span>
            )}
            {show.description && (
              <p className="text-muted-foreground leading-relaxed mb-4">
                {show.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Total Episodes: {episodes?.length || 0}
            </p>
          </div>
        </div>

        {/* Season Tabs */}
        {seasons.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {seasons.map((season) => (
              <Button
                key={season}
                variant={activeSeason === season ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSeason(season)}
              >
                Season {season}
              </Button>
            ))}
          </div>
        )}

        {/* In-Article Ad */}
        <InArticleAd className="my-6" />

        {/* Episodes Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {seasons.length > 1 ? `Season ${activeSeason} Episodes` : "Episodes"}
            </h2>
            {/* Toggle View Button */}
            {episodesBySeason[activeSeason]?.length > 0 && (
              <button
                onClick={() => setShowAllEpisodes(!showAllEpisodes)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                {showAllEpisodes ? (
                  <>
                    <LayoutList className="w-4 h-4" />
                    Carousel View
                  </>
                ) : (
                  <>
                    {episodesBySeason[activeSeason]?.length} episodes
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {episodesBySeason[activeSeason]?.length ? (
            showAllEpisodes ? (
              /* Grid View - All Episodes */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {episodesBySeason[activeSeason].map((episode) => (
                  <div
                    key={episode.id}
                    onClick={() => handlePlayEpisode(episode)}
                    className="cursor-pointer group"
                  >
                    {/* Thumbnail with Lazy Loading - Smart fallback with Cloudinary */}
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-2">
                      <LazyImage
                        src={getEpisodeThumbnail(episode.thumbnail_url, episode.watch_url, show.thumbnail_url, show.poster_url, defaultEpisodeThumb)}
                        alt={episode.title}
                        fallbackSrc={defaultEpisodeThumb}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        wrapperClassName="w-full h-full"
                      />

                      {/* Play overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                        </div>
                      </div>

                      {/* Premium badge */}
                      {!episode.is_free && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded z-10">
                          <Crown className="w-2.5 h-2.5 inline mr-0.5" />
                          PRO
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {episode.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        E{episode.episode_number}
                        {episode.air_date && (
                          <span className="ml-1">
                            • {new Date(episode.air_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Carousel View */
              <div className="relative">
                {/* Left Arrow - Fixed position outside content */}
                {showLeftArrow && (
                  <button
                    onClick={() => scroll('left')}
                    className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 hidden sm:flex"
                    style={{ marginTop: '-20px' }}
                  >
                    <div className="w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors">
                      <ChevronLeft className="w-5 h-5 text-black" />
                    </div>
                  </button>
                )}

                {/* Right Arrow - Fixed position outside content */}
                {showRightArrow && (
                  <button
                    onClick={() => scroll('right')}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 hidden sm:flex"
                    style={{ marginTop: '-20px' }}
                  >
                    <div className="w-9 h-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors">
                      <ChevronRight className="w-5 h-5 text-black" />
                    </div>
                  </button>
                )}

                <div 
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="overflow-x-auto pb-4 scroll-smooth touch-pan-x"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="flex gap-3 w-max pr-4">
                    {episodesBySeason[activeSeason].map((episode, index) => (
                      <div
                        key={episode.id}
                        onClick={() => handlePlayEpisode(episode)}
                        className="w-44 sm:w-52 md:w-60 flex-shrink-0 cursor-pointer group"
                      >
                        {/* Thumbnail with Lazy Loading - Smart fallback with Cloudinary */}
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-2">
                          <LazyImage
                            src={getEpisodeThumbnail(episode.thumbnail_url, episode.watch_url, show.thumbnail_url, show.poster_url, defaultEpisodeThumb)}
                            alt={episode.title}
                            fallbackSrc={defaultEpisodeThumb}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            wrapperClassName="w-full h-full"
                          />

                          {/* Play overlay on hover */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                            </div>
                          </div>

                          {/* Premium badge */}
                          {!episode.is_free && (
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded z-10">
                              <Crown className="w-2.5 h-2.5 inline mr-0.5" />
                              PRO
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {episode.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            E{episode.episode_number}
                            {episode.air_date && (
                              <span className="ml-1">
                                • {new Date(episode.air_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile Swipe Indicator */}
                {showSwipeHint && showRightArrow && (
                  <div className="sm:hidden flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground animate-pulse">
                    <MoveHorizontal className="w-4 h-4" />
                    <span>Swipe to see more</span>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
              <Play className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No episodes in this season.</p>
            </div>
          )}
        </div>

        {/* Bottom Ad */}
        <InArticleAd className="mt-8" />
      </main>

      <Footer />
    </div>
  );
};

export default ShowPage;
