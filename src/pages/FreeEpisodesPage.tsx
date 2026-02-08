import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { BodyAd, InArticleAd } from "@/components/AdManager";
import { useLatestFreeEpisodes } from "@/hooks/useLatestEpisodes";
import { generateEpisodeSlug } from "@/lib/episodeSlug";
import PageTracker from "@/components/PageTracker";
import EpisodeCard from "@/components/EpisodeCard";

const FreeEpisodesPage = () => {
  const { data: episodes, isLoading } = useLatestFreeEpisodes(40);

  return (
    <div className="min-h-screen bg-[#0f0617]">
      {/* Page Tracking */}
      <PageTracker />
      
      <SEOHead
        title="Free Bengali TV Serial Episodes - Watch & Download Latest Episodes HD | BengaliTVSerial24"
        description="Watch and download the latest free Bengali TV serial episodes in full HD quality. Star Jalsha, Zee Bangla, Colors Bangla, Sun Bangla serials available free on BengaliTVSerial24."
        keywords="free bengali serial episodes,free download bengali serial,star jalsha free episodes,zee bangla free episodes,bengali tv serial download free"
        canonical="https://www.bengalitvserial24.com/free-episodes"
      />
      
      <Header />
      
      <main className="max-w-[1600px] mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Latest Free Episodes
        </h1>

        {/* Top Ad */}
        <BodyAd className="mb-6" />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-white/10 rounded-lg mb-2" />
                <div className="h-4 bg-white/10 rounded w-3/4 mb-1" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : episodes && episodes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {episodes.map((episode) => (
              <Link
                key={episode.id}
                to={`/watch/${episode.show.slug}/${generateEpisodeSlug(episode.air_date, episode.episode_number)}`}
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
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400">No free episodes found</p>
          </div>
        )}

        {/* Bottom Ad */}
        <InArticleAd className="mt-8" />
      </main>

      <Footer />
    </div>
  );
};

export default FreeEpisodesPage;
