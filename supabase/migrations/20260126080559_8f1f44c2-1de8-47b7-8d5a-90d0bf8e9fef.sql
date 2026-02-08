-- Add image_url column to content_categories for category logos/images
ALTER TABLE public.content_categories 
ADD COLUMN image_url TEXT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.content_categories.image_url IS 'URL for category logo/image displayed in circular carousel';