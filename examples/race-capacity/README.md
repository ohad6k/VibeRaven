# Reproduce a capacity race

This synthetic fixture admits too many bookings when two transactions check capacity before either commits. The preview race command runs its migrations verbatim in an offline PostgreSQL engine. No live Supabase project is needed.

Requires Node 24+ with JSPI and the 1.10.0 release. The CLI enables the JSPI flag. These commands require that version to be available in your registry or installed locally.

From this example folder:

```sh
npx -y viberaven@1.10.0 race
npx -y viberaven@1.10.0 race --from .viberaven/race/report.json --replay 2
```

The first command deliberately fails: 60 orders complete and 24 break the invariant. Read `.viberaven/race/report.spec.json` and the report before reviewing the fix. The replay checks the selected failure record, not the timing or whole report bytes.

Review `fix.sql`. It adds a shared guard row so concurrent capacity checks serialize. Copy it into `supabase/migrations/002_lock_capacity.sql`, then rerun the same generated spec:

```sh
npx -y viberaven@1.10.0 race --spec .viberaven/race/report.spec.json --out .viberaven/race/fixed.json
```

Expected: 60 orders complete, zero broken, with real waits in 36 orders. See [expected-output.txt](./expected-output.txt). Timings vary. To restore the deliberately broken fixture, remove only the migration you copied.

The fixture uses the default `postgres` role. It demonstrates a database rule race, not authenticated HTTP reachability or a production security finding. It does not reproduce the private corpus or full validation harness. [Method, options and limits](../../docs/race.md).
