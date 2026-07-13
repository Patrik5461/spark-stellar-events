
CREATE TABLE public.generated_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostess_id uuid NOT NULL REFERENCES public.hostess_profiles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  contract_type text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_by_email text,
  docx_path text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  hostess_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_contracts_hostess ON public.generated_contracts(hostess_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_contracts TO authenticated;
GRANT ALL ON public.generated_contracts TO service_role;

ALTER TABLE public.generated_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage generated contracts"
  ON public.generated_contracts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_generated_contracts_updated_at
  BEFORE UPDATE ON public.generated_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for contract-templates bucket (admin-only)
CREATE POLICY "Admins read contract templates"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contract-templates' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload contract templates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contract-templates' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update contract templates"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'contract-templates' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete contract templates"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contract-templates' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for generated-contracts bucket (admin-only)
CREATE POLICY "Admins read generated contracts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'generated-contracts' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload generated contracts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'generated-contracts' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete generated contracts"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'generated-contracts' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert contract templates rows
CREATE POLICY "Admins manage contract templates rows"
  ON public.contract_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
