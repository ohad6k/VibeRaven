ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_select ON public.notes FOR SELECT TO authenticated USING (true);
