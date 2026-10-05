ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_select ON public.notes FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY notes_insert ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY notes_update ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY notes_delete ON public.notes FOR DELETE TO authenticated USING (auth.uid() = owner_id);
