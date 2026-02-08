import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Show {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  poster_url: string | null;
  thumbnail_url: string | null;
  category_id: string | null;
  badge_type: 'new_episode' | 'watch_for_free' | 'new' | 'premium' | 'none';
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContentSection {
  id: string;
  title: string;
  slug: string;
  section_type: 'poster' | 'thumbnail';
  display_order: number;
  is_active: boolean;
  show_more_link: string | null;
  created_at: string;
  shows?: Show[];
}

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
}

// Fetch all content sections with their shows
export const useContentSections = () => {
  return useQuery({
    queryKey: ["content-sections"],
    queryFn: async () => {
      // First get sections
      const { data: sections, error: sectionsError } = await supabase
        .from("content_sections")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (sectionsError) throw sectionsError;

      // Then get section_shows with shows for each section
      const sectionsWithShows = await Promise.all(
        (sections || []).map(async (section) => {
          const { data: sectionShows } = await supabase
            .from("section_shows")
            .select("show_id, display_order")
            .eq("section_id", section.id)
            .order("display_order", { ascending: true });

          if (!sectionShows || sectionShows.length === 0) {
            return { ...section, shows: [] };
          }

          const showIds = sectionShows.map(ss => ss.show_id);
          const { data: shows } = await supabase
            .from("shows")
            .select("*")
            .in("id", showIds)
            .eq("is_active", true);

          // Sort shows by their display_order in section_shows
          const orderedShows = sectionShows
            .map(ss => shows?.find(s => s.id === ss.show_id))
            .filter(Boolean) as Show[];

          return { ...section, shows: orderedShows };
        })
      );

      return sectionsWithShows as ContentSection[];
    },
  });
};

// Fetch all shows
export const useShows = () => {
  return useQuery({
    queryKey: ["shows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Show[];
    },
  });
};

// Fetch categories
export const useContentCategories = () => {
  return useQuery({
    queryKey: ["content-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as ContentCategory[];
    },
  });
};

// Create show
export const useCreateShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (show: { title: string; slug: string; description?: string; poster_url?: string; thumbnail_url?: string; category_id?: string; badge_type?: string; is_featured?: boolean; is_active?: boolean; display_order?: number }) => {
      const { data, error } = await supabase
        .from("shows")
        .insert([show])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      queryClient.invalidateQueries({ queryKey: ["content-sections"] });
    },
  });
};

// Update show
export const useUpdateShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Show> & { id: string }) => {
      const { data, error } = await supabase
        .from("shows")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      queryClient.invalidateQueries({ queryKey: ["content-sections"] });
    },
  });
};

// Delete show
export const useDeleteShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shows")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shows"] });
      queryClient.invalidateQueries({ queryKey: ["content-sections"] });
    },
  });
};

// Create section
export const useCreateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (section: { title: string; slug: string; section_type?: string; display_order?: number; is_active?: boolean; show_more_link?: string }) => {
      const { data, error } = await supabase
        .from("content_sections")
        .insert([section])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sections"] });
    },
  });
};

// Add show to section
export const useAddShowToSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, showId, displayOrder }: { sectionId: string; showId: string; displayOrder?: number }) => {
      const { data, error } = await supabase
        .from("section_shows")
        .insert({ section_id: sectionId, show_id: showId, display_order: displayOrder || 0 })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sections"] });
    },
  });
};

// Upload content image
export const uploadContentImage = async (file: File, folder: string = "shows"): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('content-images')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('content-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};
