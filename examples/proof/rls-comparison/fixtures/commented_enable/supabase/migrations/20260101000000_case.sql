CREATE TABLE public.notes (id uuid PRIMARY KEY, owner_id uuid NOT NULL, body text);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notes TO authenticated;
-- ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
