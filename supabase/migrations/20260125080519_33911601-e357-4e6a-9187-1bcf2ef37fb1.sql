-- Add logo_url field to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';

-- Create storage bucket for site assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to site-assets bucket
CREATE POLICY "Public read access for site assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Allow admin users to upload site assets
CREATE POLICY "Admin users can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admin users to update site assets
CREATE POLICY "Admin users can update site assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'site-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admin users to delete site assets
CREATE POLICY "Admin users can delete site assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'site-assets' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);