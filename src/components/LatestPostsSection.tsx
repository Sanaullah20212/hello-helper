import { Link } from "react-router-dom";
import { useLatestPosts } from "@/hooks/usePosts";
import { Calendar, Eye, ArrowRight, FileText } from "lucide-react";
import LazyImage from "@/components/ui/LazyImage";

const LatestPostsSection = () => {
  const { data: posts, isLoading } = useLatestPosts(6);

  if (isLoading) {
    return (
      <section className="py-6 md:py-8">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4">
          <div className="h-7 w-48 bg-muted rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                <div className="h-44 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
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
            সাম্প্রতিক পোস্ট
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/post/${post.slug}`}
              className="group bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Thumbnail */}
              <div className="relative h-44 overflow-hidden bg-muted">
                {post.featured_image_url ? (
                  <LazyImage
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <FileText className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.created_at).toLocaleDateString("bn-BD")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {post.view_count} ভিউ
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestPostsSection;
