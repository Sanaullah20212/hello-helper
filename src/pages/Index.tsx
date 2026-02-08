import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import CategoryCarousel from "@/components/CategoryCarousel";
import LatestEpisodesCarousel from "@/components/LatestEpisodesCarousel";
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
    "name": "Bengalitvserial24",
    "url": "https://www.bengalitvserial24.com",
    "description": "The best website to download Bengali serials and TV shows.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.bengalitvserial24.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0617]">
      {/* Page Tracking */}
      <PageTracker />
      
      {/* SEO Meta Tags */}
      <SEOHead
        title="Bengalitvserial24.com | Bengali TV Serial Video Download"
        description="The best website to download Bengali serials and TV shows."
        keywords="Bengalitvserial,Bengalitvserial24,bengalitvserial24.com,bengali tv serial download,Bengali tv serial download site,bengali tv serial download website"
        jsonLd={jsonLd}
        canonical="https://www.bengalitvserial24.com"
      />
      
      <Header />
      <HeroSlider />
      
      {/* Category Carousel - Circular channel logos */}
      <CategoryCarousel />
      
      {/* Ad Slot after Hero */}
      <div className="max-w-7xl mx-auto px-4">
        <BodyAd className="my-4" />
      </div>
      
      <LatestEpisodesCarousel />
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
