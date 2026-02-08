import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LatestEpisode {
  id: string;
  title: string;
  thumbnail_url: string | null;
  watch_url: string | null;
  air_date: string | null;
  episode_number: number | null;
  is_free: boolean;
  show: {
    id: string;
    title: string;
    slug: string;
    poster_url: string | null;
    thumbnail_url: string | null;
  };
}

export const useLatestFreeEpisodes = (limit: number = 10) => {
  return useQuery({
    queryKey: ["latest-free-episodes", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select(`
          id,
          title,
          thumbnail_url,
          watch_url,
          air_date,
          episode_number,
          is_free,
          shows!inner (
            id,
            title,
            slug,
            poster_url,
            thumbnail_url
          )
        `)
        .eq("is_active", true)
        .eq("is_free", true)
        .order("air_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((ep: any) => ({
        id: ep.id,
        title: ep.title,
        thumbnail_url: ep.thumbnail_url,
        watch_url: ep.watch_url,
        air_date: ep.air_date,
        episode_number: ep.episode_number,
        is_free: ep.is_free,
        show: {
          id: ep.shows.id,
          title: ep.shows.title,
          slug: ep.shows.slug,
          poster_url: ep.shows.poster_url,
          thumbnail_url: ep.shows.thumbnail_url,
        },
      })) as LatestEpisode[];
    },
  });
};
