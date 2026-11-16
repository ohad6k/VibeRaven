-- Review, then copy this to supabase/migrations/002_lock_capacity.sql.
-- A shared row serializes each event's capacity check. This sample has one event.
CREATE TABLE public.capacity_guard (id integer PRIMARY KEY, revision integer NOT NULL);
INSERT INTO public.capacity_guard VALUES (1, 0);

CREATE OR REPLACE FUNCTION public.guard_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  UPDATE public.capacity_guard SET revision = revision + 1 WHERE id = 1;
  SELECT count(*) INTO n FROM public.bookings WHERE event_id = NEW.event_id;
  IF n >= 2 THEN RAISE EXCEPTION 'Event is full'; END IF;
  RETURN NEW;
END
$$;
