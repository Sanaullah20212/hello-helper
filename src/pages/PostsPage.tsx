import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PageTracker from "@/components/PageTracker";
import LazyImage from "@/components/ui/LazyImage";
import { FileText, Calendar, Clock, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const POSTS_PER_PAGE = 18;

const extractFirstImage = (html: string | null | undefined): string | null => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

const useAllPosts = (page: number) => {
  return useQuery({
    queryKey: ["all-posts", page],
    queryFn: async () => {
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt, featured_image_url, content, created_at, view_count, tags, category_id")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { posts: data || [], totalCount: count || 0 };
    },
  });
};

const PostsPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAllPosts(page);

  const totalPages = data ? Math.ceil(data.totalCount / POSTS_PER_PAGE) : 0;

  return (
    <div className="min-h-screen bg-background">
      <PageTracker />
      <SEOHead
        title="সব পোস্ট - BTSPRO24"
        description="BTSPRO24 এর সব পোস্ট দেখুন — মুভি, সিরিয়াল ডাউনলোড লিংক এবং আপডেট।"
        canonical="https://www.btspro24.com/posts"
      />
      <Header />

      <main className="max-w-[1400px] mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Section Header - WP style */}
        <div className="section-header mb-6">
          <Clock className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Latest Uploads</h1>
          {data && (
            <span className="text-sm text-muted-foreground ml-1">
              ({data.totalCount} টি)
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: POSTS_PER_PAGE }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl overflow-hidden">
                <div className="aspect-[2/3] bg-muted rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Posts Grid - WP movie-card style */}
        {!isLoading && data && data.posts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {data.posts.map((post) => {
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

                  {/* Category badge top-left */}
                  {post.tags && post.tags.length > 0 && (
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-primary text-primary-foreground rounded-md shadow-md">
                      {post.tags[0]}
                    </span>
                  )}

                  {/* Play button center - hover */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/95 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 shadow-lg z-10">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground ml-0.5" fill="currentColor" />
                  </div>

                  {/* Gradient overlay + info */}
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
        )}

        {/* Empty State */}
        {!isLoading && data && data.posts.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-bold text-foreground mb-2">কোনো পোস্ট নেই</h2>
            <p className="text-muted-foreground">এখনো কোনো পোস্ট পাবলিশ করা হয়নি।</p>
          </div>
        )}

        {/* Pagination - WP style */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              আগের
            </Button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-1.5 text-muted-foreground text-sm">…</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                          p === page
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="gap-1"
            >
              পরের
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PostsPage;
