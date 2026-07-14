
ALTER TABLE public.generated_contracts
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_assignment_id uuid REFERENCES public.event_assignments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS generated_contracts_event_id_idx ON public.generated_contracts(event_id);
CREATE INDEX IF NOT EXISTS generated_contracts_event_assignment_id_idx ON public.generated_contracts(event_assignment_id);
