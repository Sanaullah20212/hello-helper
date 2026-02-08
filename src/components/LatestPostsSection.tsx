import { useState } from "react";
import { Link } from "react-router-dom";
import { useLatestPosts } from "@/hooks/usePosts";
import { FileText, Clock, Calendar, Play, ChevronLeft, ChevronRight } from "lucide-react";
import LazyImage from "@/components/ui/LazyImage";

const POSTS_PER_PAGE = 30;

/** Extract the first <img> src from HTML content */
const extractFirstImage = (html: string | null | undefined): string | null => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

const LatestPostsSection = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: allPosts, isLoading } = useLatestPosts(300); // fetch all posts

  const totalPosts = allPosts?.length || 0;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const startIdx = (currentPage - 1) * POSTS_PER_PAGE;
  const posts = allPosts?.slice(startIdx, startIdx + POSTS_PER_PAGE) || [];

  if (isLoading) {
    return (
      <section className="py-6 md:py-8">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
          <div className="section-header-line mb-5">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">Latest Update</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl overflow-hidden aspect-[2/3] bg-muted" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!allPosts || allPosts.length === 0) return null;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <section className="py-6 md:py-8">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4">
        {/* Section Header - centered text with lines on both sides */}
        <div className="section-header-line mb-5">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground whitespace-nowrap">Latest Update</h2>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {posts.map((post) => {
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
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
                  onClick={() => setCurrentPage(page as number)}
                  className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestPostsSection;
