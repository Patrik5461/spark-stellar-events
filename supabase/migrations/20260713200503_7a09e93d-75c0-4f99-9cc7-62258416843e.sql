
CREATE TABLE public.clothing_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  storage_path TEXT,
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'mix',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.clothing_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clothing_images TO authenticated;
GRANT ALL ON public.clothing_images TO service_role;

ALTER TABLE public.clothing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clothing public read active" ON public.clothing_images
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "clothing auth read all" ON public.clothing_images
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "clothing admin write" ON public.clothing_images
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER clothing_images_set_updated_at
  BEFORE UPDATE ON public.clothing_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX clothing_images_cat_sort_idx ON public.clothing_images (category, sort_order);
