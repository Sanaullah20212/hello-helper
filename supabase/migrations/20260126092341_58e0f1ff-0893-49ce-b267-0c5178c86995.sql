-- Create page_views table to track all page visits
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'page', -- 'home', 'show', 'episode', 'category', 'section'
  show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  visitor_id TEXT NOT NULL, -- Anonymous visitor identifier (stored in localStorage)
  session_id TEXT NOT NULL, -- Session identifier
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX idx_page_views_show_id ON public.page_views(show_id);
CREATE INDEX idx_page_views_page_type ON public.page_views(page_type);
CREATE INDEX idx_page_views_visitor_id ON public.page_views(visitor_id);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert page views (for tracking)
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view all page views"
ON public.page_views
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete old data
CREATE POLICY "Admins can delete page views"
ON public.page_views
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create daily_stats materialized view for faster dashboard queries
CREATE TABLE public.daily_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_date DATE NOT NULL UNIQUE,
  total_views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for daily_stats
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage daily_stats
CREATE POLICY "Admins can manage daily stats"
ON public.daily_stats
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can view stats (for showing on site)
CREATE POLICY "Public can view daily stats"
ON public.daily_stats
FOR SELECT
USING (true);

-- Enable realtime for live online users
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;