import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import LazyImage from "@/components/ui/LazyImage";
import { BodyAd, InArticleAd } from "@/components/AdManager";
import { Search, Film, ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTracker from "@/components/PageTracker";

interface Show {
  id: string;
  title: string;
  slug: string;
  poster_url: string | null;
  thumbnail_url: string | null;
  badge_type: string | null;
  category: { name: string } | null;
}

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: shows, isLoading, isError } = useQuery({
    queryKey: ["search-shows", query],
    queryFn: async () => {
      if (!query) return [];
      const { data, error } = await supabase
        .from("shows")
        .select("*, category:content_categories(name)")
        .eq("is_active", true)
        .ilike("title", `%${query}%`)
        .order("title");
      if (error) throw error;
      return data as Show[];
    },
    enabled: !!query,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Page Tracking */}
      <PageTracker />
      
      <SEOHead
        title={query ? `Search: ${query} - Bengali TV Serials | BengaliTVSerial24` : "Search Bengali TV Serials & Episodes | BengaliTVSerial24"}
        description={query ? `Search results for "${query}" on BengaliTVSerial24. Find Bengali TV serials, episodes & more.` : "Search and find your favorite Bengali TV serials, episodes, and movies on BengaliTVSerial24."}
        canonical={`https://www.bengalitvserial24.com/search${query ? `?q=${encodeURIComponent(query)}` : ''}`}
        keywords={`search bengali serial,${query || 'bengali tv serial'},find bengali shows,bengali serial search`}
      />
      
      <Header />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          {/* Search Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">
                Search Results: "{query}"
              </h1>
              {shows && shows.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({shows.length} results)
                </span>
              )}
            </div>
          </div>

          {/* No Query State */}
          {!query && (
            <div className="text-center py-16 bg-card rounded-xl border border-border/30">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Enter something to search.</p>
            </div>
          )}

          {/* Error State */}
          {isError && query && (
            <div className="text-center py-16 bg-card rounded-xl border border-border/30">
              <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                There was a problem searching.
              </p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && query && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[2/3] bg-muted rounded-lg mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          )}

          {/* Ad before results */}
          {query && <BodyAd className="mb-6" />}

          {/* Results Grid */}
          {!isLoading && !isError && shows && shows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {shows.map((show) => (
                <Link
                  key={show.id}
                  to={`/show/${show.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2">
                    <LazyImage
                      src={show.poster_url || show.thumbnail_url || "/placeholder.svg"}
                      alt={show.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      wrapperClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    {show.category?.name && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded">
                        {show.category.name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {show.title}
                  </h3>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && query && shows?.length === 0 && (
            <div className="text-center py-16 bg-card rounded-xl border border-border/30">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                No results found for "{query}".
              </p>
              <p className="text-sm text-muted-foreground">
                Try searching with different keywords.
              </p>
            </div>
          )}

          {/* Bottom Ad */}
          {query && <InArticleAd className="mt-8" />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
