import { useParams, Link } from "react-router-dom";
import { usePost, useRelatedPosts } from "@/hooks/usePosts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PageTracker from "@/components/PageTracker";
import LazyImage from "@/components/ui/LazyImage";
import { Calendar, Eye, ArrowLeft, Tag, FileText } from "lucide-react";
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
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-64 bg-muted rounded-xl" />
            <div className="space-y-3">
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
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          হোমে ফিরে যান
        </Link>

        <article>
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.created_at).toLocaleDateString("bn-BD", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {post.view_count} ভিউ
            </span>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-xs text-secondary-foreground"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="rounded-xl overflow-hidden mb-8 border border-border/50">
              <LazyImage
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-auto max-h-[500px] object-cover"
              />
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
              সম্পর্কিত পোস্ট
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  to={`/post/${rp.slug}`}
                  className="group flex gap-4 bg-card border border-border/50 rounded-xl p-3 hover:border-primary/30 transition-all"
                >
                  <div className="w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {rp.featured_image_url ? (
                      <LazyImage
                        src={rp.featured_image_url}
                        alt={rp.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {rp.title}
                    </h3>
                    <span className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(rp.created_at).toLocaleDateString("bn-BD")}
                    </span>
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
