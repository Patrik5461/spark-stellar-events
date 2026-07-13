
-- Enums
CREATE TYPE public.hostess_contract_type AS ENUM ('prikazna_zmluva', 'dohoda_o_vykonani_prace', 'bez_zmluvy');
CREATE TYPE public.hostess_status AS ENUM ('nova', 'skontrolovana', 'schvalena', 'zamietnuta', 'zmluva_pripravena', 'zmluva_podpisana');
CREATE TYPE public.hostess_photo_type AS ENUM ('portret', 'cela_postava', 'profil', 'dalsia');
CREATE TYPE public.hostess_consent_type AS ENUM ('osobne_udaje', 'pravdivost', 'fotografie', 'elektronicke_dokumenty');

-- Invitations
CREATE TABLE public.hostess_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  internal_note TEXT,
  max_submissions INTEGER NOT NULL DEFAULT 1,
  submission_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostess_invites TO authenticated;
GRANT ALL ON public.hostess_invites TO service_role;
ALTER TABLE public.hostess_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invites" ON public.hostess_invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER hostess_invites_updated_at BEFORE UPDATE ON public.hostess_invites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Profiles
CREATE TABLE public.hostess_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID REFERENCES public.hostess_invites(id) ON DELETE SET NULL,
  application_code TEXT NOT NULL UNIQUE DEFAULT ('H-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  national_id TEXT,
  identity_card_number TEXT,
  iban TEXT,
  nationality TEXT,
  height TEXT,
  clothing_size TEXT,
  shoe_size TEXT,
  hair_color TEXT,
  languages TEXT,
  experience TEXT,
  availability TEXT,
  note TEXT,
  contract_type public.hostess_contract_type NOT NULL DEFAULT 'bez_zmluvy',
  status public.hostess_status NOT NULL DEFAULT 'nova',
  internal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostess_profiles TO authenticated;
GRANT ALL ON public.hostess_profiles TO service_role;
ALTER TABLE public.hostess_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage hostess profiles" ON public.hostess_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER hostess_profiles_updated_at BEFORE UPDATE ON public.hostess_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Photos
CREATE TABLE public.hostess_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostess_profile_id UUID NOT NULL REFERENCES public.hostess_profiles(id) ON DELETE CASCADE,
  photo_type public.hostess_photo_type NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostess_photos TO authenticated;
GRANT ALL ON public.hostess_photos TO service_role;
ALTER TABLE public.hostess_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage hostess photos" ON public.hostess_photos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Consents
CREATE TABLE public.hostess_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostess_profile_id UUID NOT NULL REFERENCES public.hostess_profiles(id) ON DELETE CASCADE,
  consent_type public.hostess_consent_type NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMPTZ,
  ip_address TEXT,
  consent_version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostess_consents TO authenticated;
GRANT ALL ON public.hostess_consents TO service_role;
ALTER TABLE public.hostess_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage hostess consents" ON public.hostess_consents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin audit log
CREATE TABLE public.hostess_admin_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.hostess_admin_log TO authenticated;
GRANT ALL ON public.hostess_admin_log TO service_role;
ALTER TABLE public.hostess_admin_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit log" ON public.hostess_admin_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert audit log" ON public.hostess_admin_log
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

-- Contract templates (placeholder for later uploads)
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contract_type public.hostess_contract_type NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  placeholder_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_templates TO authenticated;
GRANT ALL ON public.contract_templates TO service_role;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage contract templates" ON public.contract_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER contract_templates_updated_at BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_hostess_photos_profile ON public.hostess_photos(hostess_profile_id);
CREATE INDEX idx_hostess_consents_profile ON public.hostess_consents(hostess_profile_id);
CREATE INDEX idx_hostess_profiles_status ON public.hostess_profiles(status);
CREATE INDEX idx_hostess_invites_token_hash ON public.hostess_invites(token_hash);
