/**
 * Generate a human-readable slug for an episode
 * Format: YYYY-MM-DD or episode-X if no date
 */
export const generateEpisodeSlug = (
  airDate: string | null,
  episodeNumber: number | null
): string => {
  if (airDate) {
    // Format: 2024-01-25
    return airDate;
  }
  
  if (episodeNumber) {
    // Format: episode-5
    return `episode-${episodeNumber}`;
  }
  
  // Fallback - shouldn't happen in practice
  return `ep-${Date.now()}`;
};

/**
 * Parse episode slug to get search criteria
 */
export const parseEpisodeSlug = (slug: string): {
  airDate?: string;
  episodeNumber?: number;
  isUUID?: boolean;
} => {
  // Check if it's a UUID (old format - for backwards compatibility)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slug)) {
    return { isUUID: true };
  }
  
  // Check if it's a date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(slug)) {
    return { airDate: slug };
  }
  
  // Check if it's episode format (episode-X)
  const episodeMatch = slug.match(/^episode-(\d+)$/);
  if (episodeMatch) {
    return { episodeNumber: parseInt(episodeMatch[1], 10) };
  }
  
  // Unknown format - treat as UUID for backwards compatibility
  return { isUUID: true };
};
