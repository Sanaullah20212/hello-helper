import { Link } from "react-router-dom";
import { useLatestPosts } from "@/hooks/usePosts";
import { ArrowRight, FileText } from "lucide-react";
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
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="aspect-[3/4] bg-muted rounded-lg" />
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

        {/* Posts Grid - Vertical Cards like show cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {posts.map((post) => {
            const imageUrl = post.featured_image_url || extractFirstImage(post.content);

            return (
              <Link
                key={post.id}
                to={`/post/${post.slug}`}
                className="group block"
              >
                {/* Title above card */}
                <h3 className="font-semibold text-foreground text-xs sm:text-sm line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>

                {/* Card Image */}
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-card border border-border/30 group-hover:border-primary/40 transition-all duration-300">
                  {imageUrl ? (
                    <LazyImage
                      src={imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <FileText className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* NEW POST Badge */}
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded">
                    NEW POST
                  </div>

                  {/* Bottom gradient for readability */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
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
