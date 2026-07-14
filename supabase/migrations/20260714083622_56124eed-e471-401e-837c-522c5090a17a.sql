
ALTER TABLE public.hostess_profiles
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS birth_place text,
  ADD COLUMN IF NOT EXISTS health_insurance text,
  ADD COLUMN IF NOT EXISTS health_restrictions text,
  ADD COLUMN IF NOT EXISTS pension_type text;
