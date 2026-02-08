import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string;
  jsonLd?: object;
}

/**
 * Enhanced SEO component with structured data support
 */
const SEOHead = ({ 
  title, 
  description, 
  canonical, 
  ogImage,
  ogType = 'website',
  keywords,
  jsonLd
}: SEOHeadProps) => {
  const { data: settings } = useSiteSettings();
  
  // Use settings as fallbacks
  const finalTitle = title || settings?.site_title || 'BTSPRO24.Com | Bengali TV Serial & Movie Download';
  const finalDescription = description || settings?.site_description || 'বাংলা মুভি, সিরিয়াল এবং টিভি শো ডাউনলোড করার জন্য সেরা ওয়েবসাইট।';
  const finalKeywords = keywords || settings?.site_keywords || 'BTSPRO24,btspro24.com,bengali tv serial download,bangla movie download';
  
  useEffect(() => {
    // Update document title
    document.title = finalTitle;
    
    // Helper to update or create meta tag
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty 
        ? `meta[property="${name}"]` 
        : `meta[name="${name}"]`;
      
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };
    
    // Update standard meta tags
    updateMeta('description', finalDescription);
    updateMeta('keywords', finalKeywords);
    
    // Robots meta
    updateMeta('robots', 'index, follow');
    updateMeta('googlebot', 'index, follow');
    
    // Update Open Graph tags
    updateMeta('og:title', finalTitle, true);
    updateMeta('og:description', finalDescription, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:site_name', settings?.site_title || 'BTSPRO24', true);
    updateMeta('og:locale', 'en_US', true);
    
    if (ogImage) {
      updateMeta('og:image', ogImage, true);
      updateMeta('og:image:width', '1200', true);
      updateMeta('og:image:height', '630', true);
    }
    if (canonical) {
      updateMeta('og:url', canonical, true);
    }
    
    // Update Twitter tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', finalTitle);
    updateMeta('twitter:description', finalDescription);
    if (ogImage) {
      updateMeta('twitter:image', ogImage);
    }
    
    // Update canonical link
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
    
    // Add JSON-LD structured data
    if (jsonLd) {
      let script = document.querySelector('script[type="application/ld+json"][data-seo]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('data-seo', 'true');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }
    
    // Default Organization schema
    let orgSchema = document.querySelector('script[type="application/ld+json"][data-org]') as HTMLScriptElement;
    if (!orgSchema) {
      orgSchema = document.createElement('script');
      orgSchema.setAttribute('type', 'application/ld+json');
      orgSchema.setAttribute('data-org', 'true');
      orgSchema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": settings?.site_title || "BTSPRO24",
        "description": settings?.site_description || finalDescription,
        "url": "https://www.btspro24.com"
      });
      document.head.appendChild(orgSchema);
    }
    
  }, [finalTitle, finalDescription, finalKeywords, canonical, ogImage, ogType, jsonLd, settings]);
  
  return null;
};

export default SEOHead;
