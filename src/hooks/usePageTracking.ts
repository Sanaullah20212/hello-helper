import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate or get visitor ID from localStorage
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('btspro_visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('btspro_visitor_id', visitorId);
  }
  return visitorId;
};

// Generate session ID (new on each page load/refresh)
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('btspro_session_id');
  if (!sessionId) {
    sessionId = 's_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    sessionStorage.setItem('btspro_session_id', sessionId);
  }
  return sessionId;
};

// Determine page type from path
const getPageType = (path: string): string => {
  if (path === '/') return 'home';
  if (path.startsWith('/show/')) return 'show';
  if (path.startsWith('/watch/')) return 'episode';
  if (path.startsWith('/category/')) return 'category';
  if (path.startsWith('/section/')) return 'section';
  if (path.startsWith('/search')) return 'search';
  if (path.startsWith('/free-episodes')) return 'free-episodes';
  return 'page';
};

// Extract show slug from path
const extractShowSlug = (path: string): string | null => {
  if (path.startsWith('/show/')) {
    return path.replace('/show/', '').split('/')[0];
  }
  if (path.startsWith('/watch/')) {
    return path.replace('/watch/', '').split('/')[0];
  }
  return null;
};

interface TrackingOptions {
  showId?: string;
  episodeId?: string;
}

export const usePageTracking = (options?: TrackingOptions) => {
  const location = useLocation();
  const trackedRef = useRef<string>('');

  useEffect(() => {
    const trackPageView = async () => {
      const path = location.pathname;
      
      // Avoid duplicate tracking on same path
      if (trackedRef.current === path) return;
      trackedRef.current = path;
      
      // Don't track admin pages
      if (path.startsWith('/admin')) return;

      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const pageType = getPageType(path);

      try {
        // If we need to find show_id from slug
        let showId = options?.showId;
        const showSlug = extractShowSlug(path);
        
        if (!showId && showSlug) {
          const { data: show } = await supabase
            .from('shows')
            .select('id')
            .eq('slug', showSlug)
            .single();
          showId = show?.id;
        }

        await supabase.from('page_views').insert({
          page_path: path,
          page_type: pageType,
          show_id: showId || null,
          episode_id: options?.episodeId || null,
          visitor_id: visitorId,
          session_id: sessionId,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });
        
        console.log('Page view tracked:', path);
      } catch (error) {
        // Silently fail - analytics should not break the app
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, [location.pathname, options?.showId, options?.episodeId]);
};

export default usePageTracking;
