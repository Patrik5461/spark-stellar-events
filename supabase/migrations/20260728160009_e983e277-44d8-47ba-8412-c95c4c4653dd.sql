ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS seo_og_image_url text,
  ADD COLUMN IF NOT EXISTS seo_og_image_path text;