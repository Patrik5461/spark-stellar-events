
-- Simplify hostess onboarding: remove invitations, use one public form URL
ALTER TABLE public.hostess_profiles DROP CONSTRAINT IF EXISTS hostess_profiles_invite_id_fkey;
ALTER TABLE public.hostess_profiles ALTER COLUMN invite_id DROP NOT NULL;
DROP TABLE IF EXISTS public.hostess_invites CASCADE;
