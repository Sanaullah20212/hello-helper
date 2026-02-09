import { useParams, Link } from "react-router-dom";
import { usePost, useRelatedPosts } from "@/hooks/usePosts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PageTracker from "@/components/PageTracker";
import LazyImage from "@/components/ui/LazyImage";
import { Calendar, ArrowLeft, FolderOpen, FileText, Image as ImageIcon, Play } from "lucide-react";
import { parsePostContent, renderDownloadSections } from "@/lib/transformPostContent";
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
        <main className="max-w-[56rem] mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="space-y-4 text-center">
              <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-4 bg-muted rounded w-48 mx-auto" />
              <div className="h-80 bg-muted rounded-xl max-w-md mx-auto" />
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
        <main className="max-w-[56rem] mx-auto px-4 py-16 text-center">
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

  const parsed = parsePostContent(post.content || "");
  const downloadHtml = renderDownloadSections(parsed.downloadSections);

  const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.excerpt || "",
    image: parsed.poster || post.featured_image_url || undefined,
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
        ogImage={parsed.poster || post.featured_image_url || undefined}
        keywords={post.tags?.join(", ") || undefined}
        jsonLd={jsonLd}
      />

      <Header />

      <main className="single-post">
        <div className="max-w-[56rem] mx-auto px-3 sm:px-4">
          {/* Breadcrumb */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <article>
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-snug mb-4">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {formattedDate}
                </span>
                {post.tags && post.tags.length > 0 && (
                  <>
                    <span className="text-border">•</span>
                    <span className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                      <FolderOpen className="w-4 h-4 text-primary" />
                      {post.tags[0]}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Poster */}
            {parsed.poster && (
              <div className="post-poster">
                <img
                  src={parsed.poster}
                  alt={post.title}
                  loading="lazy"
                />
              </div>
            )}

            {/* Synopsis */}
            {parsed.synopsis && (
              <div className="post-synopsis">
                <div className="synopsis-header">
                  <FileText className="w-5 h-5" />
                  <span>সারাংশ / Synopsis</span>
                </div>
                <div
                  className="synopsis-content"
                  dangerouslySetInnerHTML={{ __html: parsed.synopsis }}
                />
              </div>
            )}

            {/* Screenshots */}
            {parsed.screenshots.length > 0 && (
              <div className="screenshots-section">
                <div className="screenshots-header">
                  <ImageIcon className="w-5 h-5" />
                  <span>স্ক্রিনশট</span>
                </div>
                <div className="screenshots-grid">
                  {parsed.screenshots.map((src, i) => (
                    <img key={i} src={src} alt={`Screenshot ${i + 1}`} loading="lazy" />
                  ))}
                </div>
              </div>
            )}

            {/* Download Sections */}
            {downloadHtml && (
              <div dangerouslySetInnerHTML={{ __html: downloadHtml }} />
            )}

            {/* Related Posts - Movie card style */}
            {relatedPosts && relatedPosts.length > 0 && (
              <div className="related-posts">
                <div className="section-header mb-6">
                  <Play className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Related Posts</h2>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {relatedPosts.map((rp) => (
                    <Link
                      key={rp.id}
                      to={`/${rp.slug}`}
                      className="movie-card group"
                    >
                      {rp.featured_image_url ? (
                        <LazyImage
                          src={rp.featured_image_url}
                          alt={rp.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          wrapperClassName="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-card">
                          <FileText className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="movie-card-overlay">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center rounded-full bg-primary/95 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg">
                          <Play className="w-6 h-6 text-primary-foreground ml-0.5" fill="currentColor" />
                        </div>
                        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                          {rp.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostPage;
