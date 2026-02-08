import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";

import CategoryBadges from "@/components/CategoryBadges";
import LatestPostsSection from "@/components/LatestPostsSection";
import ContentSections from "@/components/ContentSections";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { BodyAd } from "@/components/AdManager";
import PageTracker from "@/components/PageTracker";

const Index = () => {
  // JSON-LD for homepage
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BTSPRO24",
    "url": "https://www.btspro24.com",
    "description": "বাংলা মুভি, সিরিয়াল এবং টিভি শো ডাউনলোড করার জন্য সেরা ওয়েবসাইট।",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.btspro24.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0617]">
      {/* Page Tracking */}
      <PageTracker />
      
      {/* SEO Meta Tags */}
      <SEOHead
        title="BTSPRO24.Com | Bengali TV Serial & Movie Download"
        description="বাংলা মুভি, সিরিয়াল এবং টিভি শো ডাউনলোড করার জন্য সেরা ওয়েবসাইট।"
        keywords="BTSPRO24,btspro24.com,bengali tv serial download,bangla movie download,Bengali tv serial download site"
        jsonLd={jsonLd}
        canonical="https://www.btspro24.com"
      />
      
      
      {/* Ad Slot after Hero */}
      <div className="max-w-7xl mx-auto px-4">
        <BodyAd className="my-4" />
      </div>

      {/* Category Badges */}
      <CategoryBadges />
      
      {/* Latest Posts / Updates */}
      <LatestPostsSection />
      
      <ContentSections />
      
      {/* Ad Slot before Footer */}
      <div className="max-w-7xl mx-auto px-4">
        <BodyAd className="my-6" />
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
