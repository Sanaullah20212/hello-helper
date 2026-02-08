-- Add advertisement fields to site_settings
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS ad_code_head TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS ad_code_body TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS ad_code_in_article TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS ads_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS site_title TEXT DEFAULT 'BTSPRO24',
ADD COLUMN IF NOT EXISTS site_description TEXT DEFAULT 'বাংলা মুভি, সিরিয়াল এবং টিভি শো ডাউনলোড করার জন্য সেরা ওয়েবসাইট।',
ADD COLUMN IF NOT EXISTS site_keywords TEXT DEFAULT 'bangla movie, bangla serial, bangla tv show, download, watch online',
ADD COLUMN IF NOT EXISTS google_analytics_id TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS google_adsense_id TEXT DEFAULT '';