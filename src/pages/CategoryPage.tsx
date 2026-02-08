import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import LazyImage from "@/components/ui/LazyImage";
import { BodyAd, InArticleAd } from "@/components/AdManager";
import { Folder, Film, Play, FileText, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTracker from "@/components/PageTracker";

const POSTS_PER_PAGE = 30;

interface Show {
  id: string;
  title: string;
  slug: string;
  poster_url: string | null;
  thumbnail_url: string | null;
  badge_type: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface ContentSection {
  id: string;
  title: string;
  slug: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  featured_image_url: string | null;
  content: string | null;
  created_at: string;
  tags: string[] | null;
}

/** Extract the first <img> src from HTML content */
const extractFirstImage = (html: string | null | undefined): string | null => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [postPage, setPostPage] = useState(1);

  // Check if route is /category/section/:slug
  const isSection = location.pathname.includes("/category/section/");

  // Fetch category (only if not a section)
  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as Category | null;
    },
    enabled: !!slug && !isSection,
  });

  // Fetch section (only if is a section)
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
    enabled: !!slug && isSection,
  });

  // Fetch shows in category
  const { data: categoryShows, isLoading: categoryLoading } = useQuery({
    queryKey: ["category-shows", category?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("category_id", category!.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("title");
      if (error) throw error;
      return data as Show[];
    },
    enabled: !!category?.id && !isSection,
  });

  // Fetch posts in category
  const { data: categoryPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["category-posts", category?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, featured_image_url, content, created_at, tags")
        .eq("category_id", category!.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
    enabled: !!category?.id && !isSection,
  });

  // Fetch shows in section
  const { data: sectionShows, isLoading: sectionLoading } = useQuery({
    queryKey: ["section-shows", section?.id],
    queryFn: async () => {
      const { data: sectionShowsData, error: sectionShowsError } = await supabase
        .from("section_shows")
        .select("show_id, display_order")
        .eq("section_id", section!.id)
        .order("display_order", { ascending: true });

      if (sectionShowsError) throw sectionShowsError;
      if (!sectionShowsData || sectionShowsData.length === 0) return [];

      const showIds = sectionShowsData.map(ss => ss.show_id);
      
      const { data: showsData, error: showsError } = await supabase
        .from("shows")
        .select("*")
        .in("id", showIds)
        .eq("is_active", true);

      if (showsError) throw showsError;

      const orderedShows = sectionShowsData
        .map(ss => showsData?.find(s => s.id === ss.show_id))
        .filter(Boolean) as Show[];

      return orderedShows;
    },
    enabled: !!section?.id && isSection,
  });

  const shows = isSection ? sectionShows : categoryShows;
  const posts = isSection ? [] : (categoryPosts || []);
  const isLoading = isSection ? sectionLoading : (categoryLoading || postsLoading);
  const isError = false;

  const displayName = isSection 
    ? section?.title 
    : (category?.name || slug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()));

  const categoryName = displayName || "Category";

  return (
    <div className="min-h-screen bg-background">
      {/* Page Tracking */}
      <PageTracker />
      
      <SEOHead
        title={`${categoryName} TV Serials Online - Watch & Download All ${categoryName} Shows HD | BTSPRO24`}
        description={`Watch all ${categoryName} TV serials online in full HD on BTSPRO24. Browse ${shows?.length || ''} popular Bengali TV shows, latest episodes & more from ${categoryName}.`}
        canonical={`https://www.btspro24.com${isSection ? '/category/section' : '/category'}/${slug}`}
        keywords={`${categoryName},${categoryName} serials,${categoryName} shows,bengali tv serial,${categoryName} download,watch ${categoryName} online`}
      />

      <Header />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Category Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                {categoryName}
              </h1>
              {((shows && shows.length > 0) || posts.length > 0) && (
                <span className="text-sm text-muted-foreground">
                  ({(shows?.length || 0) + posts.length} টি)
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

          {/* Ad before grid */}
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
                    {show.badge_type && show.badge_type !== "none" && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded">
                        {show.badge_type === "new_episode" && "New Episode"}
                        {show.badge_type === "new" && "New"}
                        {show.badge_type === "premium" && "Premium"}
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

          {/* Posts Grid */}
          {!isLoading && !isError && posts.length > 0 && (() => {
            const totalPostPages = Math.ceil(posts.length / POSTS_PER_PAGE);
            const startIdx = (postPage - 1) * POSTS_PER_PAGE;
            const paginatedPosts = posts.slice(startIdx, startIdx + POSTS_PER_PAGE);

            const getPageNumbers = () => {
              const pages: (number | "...")[] = [];
              if (totalPostPages <= 7) {
                for (let i = 1; i <= totalPostPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (postPage > 3) pages.push("...");
                const start = Math.max(2, postPage - 1);
                const end = Math.min(totalPostPages - 1, postPage + 1);
                for (let i = start; i <= end; i++) pages.push(i);
                if (postPage < totalPostPages - 2) pages.push("...");
                pages.push(totalPostPages);
              }
              return pages;
            };

            return (
              <>
                {shows && shows.length > 0 && (
                  <div className="section-header-line my-6">
                    <FileText className="w-4 h-4 text-primary" />
                    <h2 className="text-base font-semibold text-foreground whitespace-nowrap">Posts</h2>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {paginatedPosts.map((post) => {
                    const imageUrl = post.featured_image_url || extractFirstImage(post.content);
                    return (
                      <Link
                        key={post.id}
                        to={`/${post.slug}`}
                        className="movie-card group aspect-[2/3]"
                      >
                        {imageUrl ? (
                          <LazyImage
                            src={imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            wrapperClassName="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary">
                            <FileText className="w-10 h-10 text-muted-foreground/30" />
                          </div>
                        )}
                        {post.tags && post.tags.length > 0 && (
                          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-primary text-primary-foreground rounded-md shadow-md">
                            {post.tags[0]}
                          </span>
                        )}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/95 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-lg z-10">
                          <Play className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground ml-0.5" fill="currentColor" />
                        </div>
                        <div className="movie-card-overlay">
                          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(post.created_at).getFullYear()}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPostPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-8">
                    <button
                      onClick={() => { setPostPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={postPage === 1}
                      className="pagination-btn"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {getPageNumbers().map((page, idx) =>
                      page === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-sm">
                          ···
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => { setPostPage(page as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className={`pagination-btn ${postPage === page ? "active" : ""}`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => { setPostPage((p) => Math.min(totalPostPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={postPage === totalPostPages}
                      className="pagination-btn"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            );
          })()}

          {/* Empty State */}
          {!isLoading && !isError && (shows?.length === 0) && posts.length === 0 && (
            <div className="text-center py-16 bg-card rounded-xl border border-border/30">
              <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No content in this {isSection ? "section" : "category"}.</p>
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

export default CategoryPage;
