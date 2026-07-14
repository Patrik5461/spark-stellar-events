ALTER TABLE public.event_assignments
  ADD COLUMN IF NOT EXISTS payment_amount_calculated NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_amount_final NUMERIC,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_note TEXT;

CREATE INDEX IF NOT EXISTS event_assignments_paid_idx ON public.event_assignments(paid);
CREATE INDEX IF NOT EXISTS event_assignments_event_id_idx ON public.event_assignments(event_id);