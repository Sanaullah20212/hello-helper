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
                className={`relative flex-shrink-0 group/card rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:z-10 w-[130px] sm:w-[160px] md:w-[180px] lg:w-[200px] aspect-[2/3]`}
              >
                {/* Image */}
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

                {/* Badge */}
                <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-white rounded bg-pink-500 shadow-lg">
                  NEW POST
                </span>

                {/* Hover overlay with title */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-2 sm:p-3 w-full">
                    <h3 className="text-white text-xs sm:text-sm font-medium line-clamp-2">
                      {post.title}
                    </h3>
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
