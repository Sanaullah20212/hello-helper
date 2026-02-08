import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface AdManagerProps {
  children: React.ReactNode;
}

const AdManager = ({ children }: AdManagerProps) => {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (!settings?.ads_enabled) return;

    // Inject head ad code (scripts, meta tags, etc.) - Right before </head>
    if (settings?.ad_code_head) {
      // Remove old injected scripts
      document.querySelectorAll('[data-ad-head]').forEach(el => el.remove());
      
      const headFragment = document.createRange().createContextualFragment(settings.ad_code_head);
      
      // Add identifier to new elements
      headFragment.querySelectorAll('*').forEach(el => {
        el.setAttribute('data-ad-head', 'true');
      });
      
      document.head.appendChild(headFragment);
    }

    // Inject body ad code (scripts) - Right before </body>
    if (settings?.ad_code_body) {
      // Remove old injected scripts
      document.querySelectorAll('[data-ad-body-script]').forEach(el => el.remove());
      
      const bodyFragment = document.createRange().createContextualFragment(settings.ad_code_body);
      
      // Add identifier to new elements
      bodyFragment.querySelectorAll('*').forEach(el => {
        el.setAttribute('data-ad-body-script', 'true');
      });
      
      // Append to body - this puts it right before </body>
      document.body.appendChild(bodyFragment);
    }

    // Inject Google AdSense if ID is provided
    if (settings?.google_adsense_id && !document.querySelector('script[data-adsense]')) {
      const adsenseScript = document.createElement('script');
      adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.google_adsense_id}`;
      adsenseScript.async = true;
      adsenseScript.crossOrigin = 'anonymous';
      adsenseScript.setAttribute('data-adsense', 'true');
      document.head.appendChild(adsenseScript);
    }

    // Inject Google Analytics if ID is provided
    if (settings?.google_analytics_id && !document.querySelector('script[data-ga]')) {
      const gaScript = document.createElement('script');
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`;
      gaScript.async = true;
      gaScript.setAttribute('data-ga', 'true');
      document.head.appendChild(gaScript);

      const gaConfigScript = document.createElement('script');
      gaConfigScript.setAttribute('data-ga', 'true');
      gaConfigScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.google_analytics_id}');
      `;
      document.head.appendChild(gaConfigScript);
    }

    return () => {
      // Cleanup on unmount
      document.querySelectorAll('[data-ad-head]').forEach(el => el.remove());
      document.querySelectorAll('[data-ad-body-script]').forEach(el => el.remove());
    };
  }, [settings]);

  return <>{children}</>;
};

// In-Article Ad Component - For ad slots within content
export const InArticleAd = ({ className = "" }: { className?: string }) => {
  const { data: settings } = useSiteSettings();

  if (!settings?.ads_enabled || !settings?.ad_code_in_article) return null;

  return (
    <div 
      className={`ad-container my-6 flex justify-center ${className}`}
      dangerouslySetInnerHTML={{ __html: settings.ad_code_in_article }}
    />
  );
};

// Body Ad Component - For visible ad slots in page content
export const BodyAd = ({ className = "" }: { className?: string }) => {
  const { data: settings } = useSiteSettings();

  if (!settings?.ads_enabled || !settings?.ad_code_in_article) return null;

  return (
    <div 
      className={`ad-container my-4 ${className}`}
      dangerouslySetInnerHTML={{ __html: settings.ad_code_in_article }}
    />
  );
};

export default AdManager;
