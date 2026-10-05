CREATE TABLE public.catalog (id uuid PRIMARY KEY, title text);
GRANT SELECT ON TABLE public.catalog TO anon;
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalog_public ON public.catalog FOR SELECT TO anon USING (true);
