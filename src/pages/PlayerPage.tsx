import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import VideoPlayer from "@/components/VideoPlayer";
import { BodyAd, InArticleAd } from "@/components/AdManager";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseEpisodeSlug, generateEpisodeSlug } from "@/lib/episodeSlug";
import PageTracker from "@/components/PageTracker";

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
}

const PlayerPage = () => {
  const { showSlug, episodeSlug } = useParams<{ showSlug: string; episodeSlug: string }>();
  const navigate = useNavigate();

  // Fetch show
  const { data: show } = useQuery({
    queryKey: ["show", showSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("slug", showSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Show | null;
    },
    enabled: !!showSlug,
  });

  // Fetch all episodes for the show
  const { data: episodes } = useQuery({
    queryKey: ["episodes", show?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("show_id", show!.id)
        .eq("is_active", true)
        .order("episode_number", { ascending: false });
      if (error) throw error;
      return data as unknown as Episode[];
    },
    enabled: !!show?.id,
  });

  // Find current episode based on slug
  const findCurrentEpisode = (): Episode | undefined => {
    if (!episodes || !episodeSlug) return undefined;
    
    const parsed = parseEpisodeSlug(episodeSlug);
    
    if (parsed.isUUID) {
      // Old UUID format - find by ID for backwards compatibility
      return episodes.find(ep => ep.id === episodeSlug);
    }
    
    if (parsed.airDate) {
      // Find by air date
      return episodes.find(ep => ep.air_date === parsed.airDate);
    }
    
    if (parsed.episodeNumber) {
      // Find by episode number
      return episodes.find(ep => ep.episode_number === parsed.episodeNumber);
    }
    
    return undefined;
  };

  const currentEpisode = findCurrentEpisode();
  const currentIndex = episodes?.findIndex(ep => ep.id === currentEpisode?.id) ?? -1;
  const prevEpisode = currentIndex < (episodes?.length || 0) - 1 ? episodes?.[currentIndex + 1] : null;
  const nextEpisode = currentIndex > 0 ? episodes?.[currentIndex - 1] : null;

  const handleSelectEpisode = (episode: Episode) => {
    const slug = generateEpisodeSlug(episode.air_date, episode.episode_number);
    navigate(`/watch/${showSlug}/${slug}`, { replace: true });
  };

  const handleClose = () => {
    navigate(`/show/${showSlug}`);
  };

  if (!currentEpisode || !show) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Loading episode...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Tracking */}
      <PageTracker showId={show.id} episodeId={currentEpisode.id} />
      
      <SEOHead
        title={`${show.title} ${currentEpisode.title} - Watch & Download HD Episode Online | BengaliTVSerial24`}
        description={`Watch ${show.title} ${currentEpisode.title} full episode online in HD quality. Episode ${currentEpisode.episode_number}${currentEpisode.air_date ? ` aired on ${currentEpisode.air_date}` : ''}. Free Bengali TV serial download on BengaliTVSerial24.`}
        ogImage={currentEpisode.thumbnail_url || show.poster_url || show.thumbnail_url || undefined}
        ogType="video.episode"
        canonical={`https://www.bengalitvserial24.com/watch/${showSlug}/${episodeSlug}`}
        keywords={`${show.title},${currentEpisode.title},${show.title} episode ${currentEpisode.episode_number},watch ${show.title} online,bengali tv serial download`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "TVEpisode",
          "name": `${show.title} - ${currentEpisode.title}`,
          "episodeNumber": currentEpisode.episode_number,
          "datePublished": currentEpisode.air_date,
          "description": `Watch ${show.title} ${currentEpisode.title} Episode ${currentEpisode.episode_number} online in HD.`,
          "image": currentEpisode.thumbnail_url || show.poster_url,
          "url": `https://www.bengalitvserial24.com/watch/${showSlug}/${episodeSlug}`,
          "partOfSeries": {
            "@type": "TVSeries",
            "name": show.title,
            "url": `https://www.bengalitvserial24.com/show/${showSlug}`
          }
        }}
      />
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        {/* Back Button */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/show/${showSlug}`}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to {show.title}
            </Link>
          </Button>
        </div>

        {/* Video Player */}
        <VideoPlayer
          episode={currentEpisode}
          onClose={handleClose}
          onPrev={prevEpisode ? () => handleSelectEpisode(prevEpisode) : undefined}
          onNext={nextEpisode ? () => handleSelectEpisode(nextEpisode) : undefined}
          allEpisodes={episodes || []}
          onSelectEpisode={handleSelectEpisode}
          showTitle={show.title}
          showThumbnailUrl={show.thumbnail_url}
          showPosterUrl={show.poster_url}
        />

        {/* Ad below video player */}
        <div className="mt-6">
          <InArticleAd />
        </div>

        {/* Bottom Ad */}
        <BodyAd className="mt-6" />
      </main>

      <Footer />
    </div>
  );
};

export default PlayerPage;
