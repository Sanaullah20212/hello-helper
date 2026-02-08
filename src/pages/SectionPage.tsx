import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { BodyAd, InArticleAd } from "@/components/AdManager";
import { Folder, Film, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTracker from "@/components/PageTracker";

interface Show {
  id: string;
  title: string;
  slug: string;
  poster_url: string | null;
  thumbnail_url: string | null;
  badge_type: string | null;
}

interface ContentSection {
  id: string;
  title: string;
  slug: string;
  section_type: string | null;
}

const SectionPage = () => {
  const { slug } = useParams<{ slug: string }>();

  // Fetch section
  const { data: section } = useQuery({
    queryKey: ["section", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_sections")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as ContentSection | null;
    },
    enabled: !!slug,
  });

  // Fetch shows in section via section_shows junction table
  const { data: shows, isLoading, isError } = useQuery({
    queryKey: ["section-shows", section?.id],
    queryFn: async () => {
      // First get show IDs from section_shows
      const { data: sectionShows, error: sectionError } = await supabase
        .from("section_shows")
        .select("show_id, display_order")
        .eq("section_id", section!.id)
        .order("display_order", { ascending: true });

      if (sectionError) throw sectionError;
      if (!sectionShows || sectionShows.length === 0) return [];

      const showIds = sectionShows.map(ss => ss.show_id);

      // Then fetch the actual shows
      const { data: showsData, error: showsError } = await supabase
        .from("shows")
        .select("*")
        .in("id", showIds)
        .eq("is_active", true);

      if (showsError) throw showsError;

      // Sort by display_order from section_shows
      const orderedShows = sectionShows
        .map(ss => showsData?.find(s => s.id === ss.show_id))
        .filter(Boolean) as Show[];

      return orderedShows;
    },
    enabled: !!section?.id,
  });

  const sectionName = section?.title || slug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Section";

  return (
    <div className="min-h-screen bg-background">
      {/* Page Tracking */}
      <PageTracker />
      
      <SEOHead
        title={`${sectionName} - Watch Popular Bengali TV Serials Online HD | BTSPRO24`}
        description={`Browse all shows in ${sectionName} section. Watch and download popular Bengali TV serials in HD quality on BTSPRO24.`}
        canonical={`https://www.btspro24.com/section/${slug}`}
        keywords={`${sectionName},bengali tv serial,${sectionName} shows,watch bengali serial online`}
      />

      <Header />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {sectionName}
              </h1>
              {shows && shows.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({shows.length} shows)
                </span>
              )}
            </div>
          </div>

          {/* Error State */}
          {isError && (
            <div className="text-center py-16 bg-card rounded-xl border border-border/30">
              <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                There was a problem loading content.
              </p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[2/3] bg-muted rounded-lg mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          )}

          {/* Top Ad */}
          <BodyAd className="mb-6" />

          {/* Shows Grid */}
          {!isLoading && !isError && shows && shows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {shows.map((show) => (
                <Link
                  key={show.id}
                  to={`/show/${show.slug}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2">
                    <img
                      src={show.poster_url || show.thumbnail_url || "/placeholder.svg"}
                      alt={show.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                    {show.badge_type && show.badge_type !== "none" && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded">
                        {show.badge_type === "new_episode" && "New Episode"}
                        {show.badge_type === "new" && "New"}
                        {show.badge_type === "premium" && "Premium"}
                        {show.badge_type === "watch_for_free" && "Free"}
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
          {!isLoading && !isError && shows?.length === 0 && (
            <div className="text-center py-16 bg-card rounded-xl border border-border/30">
              <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No shows in this section.</p>
            </div>
          )}

          {/* Bottom Ad */}
          <InArticleAd className="mt-8" />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SectionPage;
