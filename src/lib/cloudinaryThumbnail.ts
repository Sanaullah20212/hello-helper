/**
 * Get the best available thumbnail with proper fallback chain
 * Priority: episode thumbnail -> show thumbnail (16:9) -> show poster (2:3) -> default
 * 
 * Note: Cloudinary video fetch is NOT used because:
 * 1. Video URLs from btspro24.xyz have authentication tokens that expire
 * 2. Cloudinary cannot access these protected URLs (ORB blocking)
 * 3. CORS restrictions prevent fetching thumbnails from private video sources
 */

export const getEpisodeThumbnail = (
  episodeThumbnailUrl: string | null | undefined,
  videoUrl: string | null | undefined,
  showThumbnailUrl: string | null | undefined,
  showPosterUrl: string | null | undefined,
  defaultThumbnail: string
): string => {
  // 1. Use episode thumbnail if available
  if (episodeThumbnailUrl) {
    return episodeThumbnailUrl;
  }
  
  // 2. Show thumbnail (16:9) - preferred for video cards
  if (showThumbnailUrl) {
    return showThumbnailUrl;
  }
  
  // 3. Show poster (2:3) - fallback for vertical posters
  if (showPosterUrl) {
    return showPosterUrl;
  }
  
  // 4. Default thumbnail
  return defaultThumbnail;
};
