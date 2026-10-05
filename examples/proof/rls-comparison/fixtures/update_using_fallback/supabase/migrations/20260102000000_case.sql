ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_select ON public.notes FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY notes_update ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
