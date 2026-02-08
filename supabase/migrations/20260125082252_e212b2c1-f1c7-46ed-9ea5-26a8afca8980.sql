-- Create content_categories table
CREATE TABLE public.content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shows table (for TV shows/serials)
CREATE TABLE public.shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  poster_url TEXT,
  thumbnail_url TEXT,
  category_id UUID REFERENCES public.content_categories(id) ON DELETE SET NULL,
  badge_type TEXT CHECK (badge_type IN ('new_episode', 'watch_for_free', 'new', 'premium', 'none')) DEFAULT 'none',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create episodes table
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  episode_number INT,
  season_number INT DEFAULT 1,
  thumbnail_url TEXT,
  air_date DATE,
  download_links JSONB DEFAULT '[]',
  watch_url TEXT,
  is_free BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create content_sections table (for homepage sections)
CREATE TABLE public.content_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  section_type TEXT CHECK (section_type IN ('poster', 'thumbnail')) DEFAULT 'poster',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  show_more_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create section_shows junction table
CREATE TABLE public.section_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.content_sections(id) ON DELETE CASCADE NOT NULL,
  show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE NOT NULL,
  display_order INT DEFAULT 0,
  UNIQUE(section_id, show_id)
);

-- Enable RLS on all tables
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_shows ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public can view active categories"
ON public.content_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Public can view active shows"
ON public.shows FOR SELECT
USING (is_active = true);

CREATE POLICY "Public can view active episodes"
ON public.episodes FOR SELECT
USING (is_active = true);

CREATE POLICY "Public can view active sections"
ON public.content_sections FOR SELECT
USING (is_active = true);

CREATE POLICY "Public can view section shows"
ON public.section_shows FOR SELECT
USING (true);

-- Admin write access policies
CREATE POLICY "Admins can manage categories"
ON public.content_categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage shows"
ON public.shows FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage episodes"
ON public.episodes FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sections"
ON public.content_sections FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage section shows"
ON public.section_shows FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for content images
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for content-images bucket
CREATE POLICY "Public read access for content images"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

CREATE POLICY "Admin upload access for content images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin update access for content images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin delete access for content images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);