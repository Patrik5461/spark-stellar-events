
-- ============ ENUMS ============
CREATE TYPE public.event_status AS ENUM ('koncept','otvoreny_nabor','obsadene','prebieha','dokoncene','zrusene');
CREATE TYPE public.event_worker_type AS ENUM ('hosteska','promoter','helper','produkcia','ine');
CREATE TYPE public.event_payment_type AS ENUM ('za_hodinu','za_den','jednorazova','na_vyziadanie');
CREATE TYPE public.event_assignment_status AS ENUM ('navrhnuta','kontaktovana','potvrdena','odmietnutna','nahradnicka','zucastnila_sa','neprisla','zrusena');
CREATE TYPE public.event_attendance_status AS ENUM ('nevyplnene','ok','meskala','odisla_skor','neprisla');

-- ============ CLIENTS ============
CREATE TABLE public.event_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_clients TO authenticated;
GRANT ALL ON public.event_clients TO service_role;
ALTER TABLE public.event_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage event_clients" ON public.event_clients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ EVENTS ============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES public.event_clients(id) ON DELETE SET NULL,
  client_contact_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  location TEXT NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  time_from TIME,
  time_to TIME,
  worker_type public.event_worker_type NOT NULL DEFAULT 'hosteska',
  required_workers INTEGER NOT NULL DEFAULT 1 CHECK (required_workers >= 0),
  payment_amount NUMERIC(10,2),
  payment_type public.event_payment_type NOT NULL DEFAULT 'za_hodinu',
  dress_code TEXT,
  clothing_instructions TEXT,
  job_description TEXT,
  requirements TEXT,
  required_languages TEXT,
  requires_food_certificate BOOLEAN NOT NULL DEFAULT false,
  requires_driver_license BOOLEAN NOT NULL DEFAULT false,
  requires_car BOOLEAN NOT NULL DEFAULT false,
  public_note TEXT,
  internal_note TEXT,
  status public.event_status NOT NULL DEFAULT 'koncept',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_status_idx ON public.events(status);
CREATE INDEX events_date_from_idx ON public.events(date_from);
CREATE INDEX events_client_id_idx ON public.events(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ EVENT ASSIGNMENTS ============
CREATE TABLE public.event_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  hostess_profile_id UUID NOT NULL REFERENCES public.hostess_profiles(id) ON DELETE CASCADE,
  status public.event_assignment_status NOT NULL DEFAULT 'navrhnuta',
  agreed_payment NUMERIC(10,2),
  payment_type public.event_payment_type,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  break_minutes INTEGER NOT NULL DEFAULT 0 CHECK (break_minutes >= 0),
  worked_hours NUMERIC(6,2),
  attendance_status public.event_attendance_status NOT NULL DEFAULT 'nevyplnene',
  contract_required BOOLEAN NOT NULL DEFAULT false,
  generated_contract_id UUID REFERENCES public.generated_contracts(id) ON DELETE SET NULL,
  contract_signed BOOLEAN NOT NULL DEFAULT false,
  paid BOOLEAN NOT NULL DEFAULT false,
  admin_note TEXT,
  worker_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, hostess_profile_id)
);
CREATE INDEX event_assignments_event_id_idx ON public.event_assignments(event_id);
CREATE INDEX event_assignments_hostess_id_idx ON public.event_assignments(hostess_profile_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_assignments TO authenticated;
GRANT ALL ON public.event_assignments TO service_role;
ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage event_assignments" ON public.event_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ EVENT DOCUMENTS ============
CREATE TABLE public.event_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  document_type TEXT NOT NULL DEFAULT 'other',
  generated_contract_id UUID REFERENCES public.generated_contracts(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX event_documents_event_id_idx ON public.event_documents(event_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_documents TO authenticated;
GRANT ALL ON public.event_documents TO service_role;
ALTER TABLE public.event_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage event_documents" ON public.event_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ EVENT NOTES ============
CREATE TABLE public.event_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX event_notes_event_id_idx ON public.event_notes(event_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_notes TO authenticated;
GRANT ALL ON public.event_notes TO service_role;
ALTER TABLE public.event_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage event_notes" ON public.event_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ AUDIT LOG ============
CREATE TABLE public.event_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX event_audit_log_event_id_idx ON public.event_audit_log(event_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_audit_log TO authenticated;
GRANT ALL ON public.event_audit_log TO service_role;
ALTER TABLE public.event_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage event_audit_log" ON public.event_audit_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ UPDATED_AT TRIGGERS ============
CREATE TRIGGER set_updated_at_events BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_event_clients BEFORE UPDATE ON public.event_clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_event_assignments BEFORE UPDATE ON public.event_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ STORAGE RLS FOR event-documents BUCKET ============
CREATE POLICY "Admins read event-documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'event-documents' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert event-documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-documents' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update event-documents" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-documents' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'event-documents' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete event-documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-documents' AND public.has_role(auth.uid(),'admin'));
