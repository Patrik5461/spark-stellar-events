
ALTER TABLE public.event_documents
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS internal_note TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS event_documents_event_id_idx ON public.event_documents(event_id);
CREATE INDEX IF NOT EXISTS event_documents_generated_contract_id_idx ON public.event_documents(generated_contract_id);

DROP TRIGGER IF EXISTS trg_event_documents_updated_at ON public.event_documents;
CREATE TRIGGER trg_event_documents_updated_at
BEFORE UPDATE ON public.event_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
