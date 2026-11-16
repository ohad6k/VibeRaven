CREATE TABLE public.bookings (
  id text PRIMARY KEY,
  event_id text NOT NULL
);

CREATE FUNCTION public.guard_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.bookings WHERE event_id = NEW.event_id;
  IF n >= 2 THEN RAISE EXCEPTION 'Event is full'; END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER guard_capacity BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_capacity();
