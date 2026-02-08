import { usePageTracking } from '@/hooks/usePageTracking';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';

interface PageTrackerProps {
  showId?: string;
  episodeId?: string;
}

/**
 * Component to track page views and maintain online presence
 * Add this to any page you want to track
 */
const PageTracker = ({ showId, episodeId }: PageTrackerProps) => {
  // Track page view
  usePageTracking({ showId, episodeId });
  
  // Maintain online presence
  useOnlineUsers();
  
  return null;
};

export default PageTracker;
