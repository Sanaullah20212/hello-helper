import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PageTracker from "@/components/PageTracker";
import LazyImage from "@/components/ui/LazyImage";
import { FileText, Calendar, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const POSTS_PER_PAGE = 12;

const extractFirstImage = (html: string | null | undefined): string | null => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

const useAllPosts = (page: number) => {
  return useQuery({
    queryKey: ["all-posts", page],
    queryFn: async () => {
      // Get total count
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      // Get paginated data
      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt, featured_image_url, content, created_at, view_count, tags")
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

      <main className="max-w-[1600px] mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Page Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
          <FileText className="w-6 h-6 text-primary" />
          সব পোস্ট
        </h1>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: POSTS_PER_PAGE }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg overflow-hidden">
                <div className="aspect-[2/3] bg-muted rounded-lg" />
                <div className="pt-2 space-y-1.5">
                  <div className="h-3.5 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {!isLoading && data && data.posts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {data.posts.map((post) => {
              const imageUrl = post.featured_image_url || extractFirstImage(post.content);
              return (
                <Link
                  key={post.id}
                  to={`/post/${post.slug}`}
                  className="group block"
                >
                  {/* Card */}
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border/30 group-hover:border-primary/40 transition-all duration-300 group-hover:scale-[1.02]">
                    {imageUrl ? (
                      <LazyImage
                        src={imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        wrapperClassName="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <FileText className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Bottom gradient + info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-2.5 sm:p-3">
                      <h3 className="text-white text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.created_at).toLocaleDateString("bn-BD")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.view_count}
                        </span>
                      </div>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              আগের
            </Button>

            <div className="flex items-center gap-1">
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
                      <Button
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(p)}
                        className="w-8 h-8 p-0 text-xs"
                      >
                        {p}
                      </Button>
                    </span>
                  );
                })}
            </div>

            <Button
              variant="outline"
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
