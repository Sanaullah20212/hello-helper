import { useParams, Link } from "react-router-dom";
import { usePost, useRelatedPosts } from "@/hooks/usePosts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PageTracker from "@/components/PageTracker";
import LazyImage from "@/components/ui/LazyImage";
import { Calendar, ArrowLeft, FolderOpen, FileText, User, Clock, Eye, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = usePost(slug || "");
  const { data: relatedPosts } = useRelatedPosts(
    post?.category_id || null,
    post?.id || "",
    6
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-[900px] mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="bg-card rounded-lg p-6 space-y-4">
              <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-4 bg-muted rounded w-48 mx-auto" />
              <div className="space-y-3 mt-8">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-[900px] mx-auto px-4 py-16 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold text-foreground mb-2">পোস্ট পাওয়া যায়নি</h1>
          <p className="text-muted-foreground mb-6">
            এই পোস্টটি বিদ্যমান নেই বা মুছে ফেলা হয়েছে।
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              হোমে ফিরে যান
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const timeAgo = (() => {
    const diff = Date.now() - new Date(post.created_at).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "আজ";
    if (days === 1) return "গতকাল";
    if (days < 30) return `${days} দিন আগে`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} মাস আগে`;
    const years = Math.floor(months / 12);
    return `${years} বছর আগে`;
  })();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt || "",
    image: post.featured_image_url || undefined,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    publisher: {
      "@type": "Organization",
      name: "BTSPRO24",
      url: "https://www.btspro24.com",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <PageTracker />
      <SEOHead
        title={post.meta_title || `${post.title} - BTSPRO24`}
        description={post.meta_description || post.excerpt || post.title}
        canonical={`https://www.btspro24.com/${post.slug}`}
        jsonLd={jsonLd}
      />

      <Header />

      <main className="single-post-container max-w-[900px] mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Post Article Card - White background like WP theme */}
        <article className="post-article-card">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="post-article-title text-lg sm:text-xl md:text-2xl font-bold leading-tight mb-4">
              {post.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4" />
                BTSPRO24
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {timeAgo}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {post.view_count || 0} Views
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                No Comments
              </span>
              {post.tags && post.tags.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4" />
                  <span className="text-blue-500">{post.tags[0]}</span>
                  <span>•</span>
                  <span>Bengalitvserial24.Com</span>
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div
            className="wordpress-preview"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />
        </article>

        {/* Related Posts - WP style white cards */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-8">
            <div className="widget-title-bar mb-5">
              <span className="inline-block bg-card px-4 py-2 font-bold text-foreground border-l-4 border-primary text-base">
                Movies You May Also Like
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {relatedPosts.map((rp) => {
                const rpTimeAgo = (() => {
                  const diff = Date.now() - new Date(rp.created_at).getTime();
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  if (days === 0) return "আজ";
                  if (days === 1) return "গতকাল";
                  if (days < 30) return `${days} দিন আগে`;
                  const months = Math.floor(days / 30);
                  if (months < 12) return `${months} মাস আগে`;
                  return `${Math.floor(months / 12)} বছর আগে`;
                })();

                return (
                  <Link
                    key={rp.id}
                    to={`/${rp.slug}`}
                    className="related-post-card group"
                  >
                    <div className="related-post-thumb">
                      {rp.featured_image_url ? (
                        <LazyImage
                          src={rp.featured_image_url}
                          alt={rp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          wrapperClassName="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="related-post-info">
                      <h3 className="related-post-title">{rp.title}</h3>
                      <hr className="border-gray-200 my-2" />
                      <div className="related-post-meta">
                        <Clock className="w-3 h-3" />
                        <span>{rpTimeAgo}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PostPage;
