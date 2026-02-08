-- Add Latest Free Episodes section settings to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN latest_episodes_title text NOT NULL DEFAULT 'Latest Free Episodes | ফ্রি এপিসোড',
ADD COLUMN latest_episodes_limit integer NOT NULL DEFAULT 15,
ADD COLUMN latest_episodes_enabled boolean NOT NULL DEFAULT true;