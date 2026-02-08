import { Link } from "react-router-dom";
import { useLatestPosts } from "@/hooks/usePosts";
import { ArrowRight, FileText, Play, Calendar } from "lucide-react";
import LazyImage from "@/components/ui/LazyImage";

/** Extract the first <img> src from HTML content */
const extractFirstImage = (html: string | null | undefined): string | null => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

const LatestPostsSection = () => {
  const { data: posts, isLoading } = useLatestPosts(6);

  if (isLoading) {
    return (
      <section className="py-6 md:py-8">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4">
          <div className="h-7 w-48 bg-muted rounded animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl overflow-hidden border border-border/30">
                <div className="aspect-[3/4] bg-muted" />
                <div className="p-3 space-y-2 bg-card">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-6 md:py-8">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Latest Update
          </h2>
          <Link
            to="/posts"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            সব দেখুন
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Posts Grid */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth">
          {posts.map((post) => {
            const imageUrl = post.featured_image_url || extractFirstImage(post.content);

            return (
              <Link
                key={post.id}
                to={`/post/${post.slug}`}
                className="group flex-shrink-0 w-[130px] sm:w-[160px] md:w-[180px] lg:w-[200px] block rounded-lg overflow-hidden border border-primary/30 hover:border-primary/60 bg-card transition-all duration-300 hover:scale-105"
              >
                {/* Image Area */}
                <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
                  {imageUrl ? (
                    <LazyImage
                      src={imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Badge */}
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    New Post
                  </div>

                  {/* Play Button Center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-card to-transparent" />
                </div>

                {/* Info Area Below Image */}
                <div className="p-2.5 sm:p-3">
                  <h3 className="font-semibold text-foreground text-xs sm:text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mt-1.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                    })}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestPostsSection;
