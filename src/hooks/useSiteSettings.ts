import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  id: string;
  premium_banner_text: string;
  premium_banner_button_text: string;
  premium_banner_link: string;
  notice_banner_text: string;
  notice_banner_link_text: string;
  notice_banner_link: string;
  logo_url: string;
  latest_episodes_title: string;
  latest_episodes_limit: number;
  latest_episodes_enabled: boolean;
  updated_at: string;
  // Ads & SEO fields
  ad_code_head?: string;
  ad_code_body?: string;
  ad_code_in_article?: string;
  ads_enabled?: boolean;
  google_adsense_id?: string;
  google_analytics_id?: string;
  site_title?: string;
  site_description?: string;
  site_keywords?: string;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "main")
        .maybeSingle();

      if (error) throw error;
      return data as SiteSettings | null;
    },
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<SiteSettings>) => {
      const { data, error } = await supabase
        .from("site_settings")
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq("id", "main")
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
};
