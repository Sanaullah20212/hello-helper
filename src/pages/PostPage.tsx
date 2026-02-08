import { useParams, Link } from "react-router-dom";
import { usePost, useRelatedPosts } from "@/hooks/usePosts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PageTracker from "@/components/PageTracker";
import LazyImage from "@/components/ui/LazyImage";
import { Calendar, ArrowLeft, FolderOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const PostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = usePost(slug || "");
  const { data: relatedPosts } = useRelatedPosts(
    post?.category_id || null,
    post?.id || "",
    4
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-10 bg-muted rounded w-3/4 mx-auto" />
            <div className="h-5 bg-muted rounded w-48 mx-auto" />
            <div className="h-[400px] bg-muted rounded-xl max-w-lg mx-auto" />
            <div className="space-y-3 mt-8">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-4/6" />
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
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
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
        canonical={`https://www.btspro24.com/post/${post.slug}`}
        jsonLd={jsonLd}
      />

      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <article>
          {/* Centered Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground text-center mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Centered Meta: Date + Category */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {post.tags && post.tags.length > 0 && (
              <>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4" />
                  {post.tags[0]}
                </span>
              </>
            )}
          </div>

          {/* Featured Image - Centered & Large */}
          {post.featured_image_url && (
            <div className="flex justify-center mb-8">
              <div className="rounded-xl overflow-hidden border border-border/50 max-w-lg w-full">
                <LazyImage
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div
            className="wordpress-preview"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />
        </article>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border/50">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Related Posts
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  to={`/post/${rp.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-card border border-border/30 group-hover:border-primary/40 transition-all duration-300">
                    {rp.featured_image_url ? (
                      <LazyImage
                        src={rp.featured_image_url}
                        alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <FileText className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Gradient */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {rp.title}
                      </h3>
                      <span className="text-[10px] text-gray-300 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(rp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PostPage;
