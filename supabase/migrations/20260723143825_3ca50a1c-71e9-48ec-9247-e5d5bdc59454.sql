
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS detail_content text NOT NULL DEFAULT '';

UPDATE public.services SET slug = 'hostessing' WHERE title = 'Hostessing' AND slug IS NULL;
UPDATE public.services SET slug = 'promotion' WHERE title = 'Promotion' AND slug IS NULL;
UPDATE public.services SET slug = 'helperi' WHERE title = 'Helperi' AND slug IS NULL;
UPDATE public.services SET slug = 'produkcia' WHERE title = 'Produkcia' AND slug IS NULL;
UPDATE public.services SET slug = 'prenajom-oblecenia' WHERE title = 'Prenájom oblečenia' AND slug IS NULL;
UPDATE public.services SET slug = 'parkovcici' WHERE title = 'Parkovčíci' AND slug IS NULL;
UPDATE public.services SET slug = 'animatori-a-maskoti' WHERE title = 'Animátori a maskoti' AND slug IS NULL;
UPDATE public.services SET slug = 'soferi-na-predvadzacie-jazdy' WHERE title = 'Šoféri na predvádzacie jazdy' AND slug IS NULL;
UPDATE public.services SET slug = 'vizazistky-a-stylistky' WHERE title = 'Vizážistky a stylistky' AND slug IS NULL;

UPDATE public.services SET slug = 'sluzba-' || substr(id::text, 1, 8) WHERE slug IS NULL;

ALTER TABLE public.services ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS services_slug_key ON public.services(slug);
