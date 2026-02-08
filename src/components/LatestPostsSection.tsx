import { Link } from "react-router-dom";
import { useLatestPosts } from "@/hooks/usePosts";
import { ArrowRight, FileText, Clock, Calendar, Play } from "lucide-react";
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
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
          <div className="section-header mb-5">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">Latest Update</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl overflow-hidden aspect-[2/3] bg-muted" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-6 md:py-8">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
        {/* Section Header - WP style */}
        <div className="flex items-center justify-between mb-5">
          <div className="section-header flex-1">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Latest Update</h2>
          </div>
          <Link
            to="/posts"
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors ml-3 shrink-0"
          >
            সব দেখুন
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Posts Grid - WP movie-card style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {posts.map((post) => {
            const imageUrl = post.featured_image_url || extractFirstImage(post.content);

            return (
              <Link
                key={post.id}
                to={`/${post.slug}`}
                className="movie-card group aspect-[2/3]"
              >
                {/* Image */}
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
      </div>
    </section>
  );
};

export default LatestPostsSection;
