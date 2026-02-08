import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useLatestPosts = (limit = 6) => {
  return useQuery({
    queryKey: ["latest-posts", limit],
    queryFn: async () => {
      // Supabase limits to 1000 per request, but we fetch in one go for reasonable limits
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt, featured_image_url, content, created_at, view_count, tags, category_id")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes when fetching large sets
  });
};

export const usePost = (slug: string) => {
  return useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

export const useRelatedPosts = (categoryId: string | null, currentPostId: string, limit = 4) => {
  return useQuery({
    queryKey: ["related-posts", categoryId, currentPostId],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select("id, title, slug, excerpt, featured_image_url, created_at")
        .eq("status", "published")
        .neq("id", currentPostId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!currentPostId,
  });
};
