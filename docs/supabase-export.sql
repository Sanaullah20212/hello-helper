-- =====================================================
-- BengaliTVSerial24 - Full Supabase Schema Export
-- Generated: 2026-02-08
-- Run this in your own Supabase SQL Editor
-- =====================================================

-- 1. ENUM TYPE
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. TABLES
-- =====================================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Content Categories
CREATE TABLE public.content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;

-- Shows
CREATE TABLE public.shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  thumbnail_url TEXT,
  badge_type TEXT DEFAULT 'none',
  category_id UUID REFERENCES public.content_categories(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;

-- Episodes
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES public.shows(id),
  title TEXT NOT NULL,
  air_date DATE,
  episode_number INTEGER,
  season_number INTEGER DEFAULT 1,
  watch_url TEXT,
  thumbnail_url TEXT,
  download_links JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Hero Slides
CREATE TABLE public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  link_text TEXT DEFAULT 'দেখুন',
  show_id UUID REFERENCES public.shows(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Content Sections
CREATE TABLE public.content_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  section_type TEXT DEFAULT 'poster',
  show_more_link TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;

-- Section Shows (junction table)
CREATE TABLE public.section_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.content_sections(id),
  show_id UUID NOT NULL REFERENCES public.shows(id),
  display_order INTEGER DEFAULT 0
);
ALTER TABLE public.section_shows ENABLE ROW LEVEL SECURITY;

-- Site Settings
CREATE TABLE public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  site_title TEXT DEFAULT 'BTSPRO24',
  site_description TEXT DEFAULT 'বাংলা মুভি, সিরিয়াল এবং টিভি শো ডাউনলোড করার জন্য সেরা ওয়েবসাইট।',
  site_keywords TEXT DEFAULT 'bangla movie, bangla serial, bangla tv show, download, watch online',
  logo_url TEXT DEFAULT '',
  google_analytics_id TEXT DEFAULT '',
  google_adsense_id TEXT DEFAULT '',
  ads_enabled BOOLEAN DEFAULT true,
  ad_code_head TEXT DEFAULT '',
  ad_code_body TEXT DEFAULT '',
  ad_code_in_article TEXT DEFAULT '',
  premium_banner_text TEXT NOT NULL DEFAULT 'স্টার জলসা, জি বাংলা, কালার্স বাংলা, সান বাংলা, এন্টার টেন বাংলার নাটক পেতে',
  premium_banner_link TEXT NOT NULL DEFAULT 'https://panel.btspro24.com/',
  premium_banner_button_text TEXT NOT NULL DEFAULT 'প্রিমিয়াম সাবস্ক্রিপশন নিন',
  notice_banner_text TEXT NOT NULL DEFAULT 'প্রিয় গ্রাহক, এই সাইট থেকে সিরিয়াল ডাউনলোড করতে সমস্যা হলে নিচের লিংকের ওয়েবসাইট থেকে ডাউনলোড করতে পারবেন',
  notice_banner_link TEXT NOT NULL DEFAULT 'https://www.bengalitvserialhd.com/',
  notice_banner_link_text TEXT NOT NULL DEFAULT 'BengaliTVSerialHD',
  latest_episodes_enabled BOOLEAN NOT NULL DEFAULT true,
  latest_episodes_limit INTEGER NOT NULL DEFAULT 15,
  latest_episodes_title TEXT NOT NULL DEFAULT 'Latest Free Episodes | ফ্রি এপিসোড',
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Page Views (Analytics)
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'page',
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  show_id UUID REFERENCES public.shows(id),
  episode_id UUID REFERENCES public.episodes(id),
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Daily Stats
CREATE TABLE public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- 3. FUNCTIONS
-- =====================================================

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. TRIGGERS
-- =====================================================

-- Auto-create profile on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RLS POLICIES
-- =====================================================

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- User Roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Content Categories
CREATE POLICY "Public can view active categories" ON public.content_categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.content_categories
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Shows
CREATE POLICY "Public can view active shows" ON public.shows
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage shows" ON public.shows
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Episodes
CREATE POLICY "Public can view active episodes" ON public.episodes
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage episodes" ON public.episodes
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Hero Slides
CREATE POLICY "Anyone can view active hero slides" ON public.hero_slides
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage hero slides" ON public.hero_slides
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

-- Content Sections
CREATE POLICY "Public can view active sections" ON public.content_sections
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage sections" ON public.content_sections
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Section Shows
CREATE POLICY "Public can view section shows" ON public.section_shows
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage section shows" ON public.section_shows
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Site Settings
CREATE POLICY "Anyone can read settings" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.site_settings
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Page Views
CREATE POLICY "Anyone can insert page views" ON public.page_views
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all page views" ON public.page_views
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete page views" ON public.page_views
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Daily Stats
CREATE POLICY "Public can view daily stats" ON public.daily_stats
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage daily stats" ON public.daily_stats
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 6. STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('content-images', 'content-images', true);

-- 7. DEFAULT DATA
-- =====================================================

-- Insert default site settings
INSERT INTO public.site_settings (id) VALUES ('main');

-- =====================================================
-- DONE! Now create an admin user:
-- 1. Sign up via Supabase Auth
-- 2. Run: INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_UUID', 'admin');
-- =====================================================
