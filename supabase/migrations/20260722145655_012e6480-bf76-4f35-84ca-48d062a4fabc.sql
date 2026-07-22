
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_path TEXT,
  ADD COLUMN IF NOT EXISTS about_image_url TEXT,
  ADD COLUMN IF NOT EXISTS about_image_path TEXT;

-- Storage policies for site-images bucket
CREATE POLICY "site-images admin all"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "site-images public read via signed"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'site-images');
