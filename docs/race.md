# Two-user PostgreSQL race tests (preview)

VibeRaven gives AI-built apps production context and checks across Supabase, Vercel, Stripe and the other providers they use, read from the repo, locally, before launch and after a change.

## Two users at once

VibeRaven 1.10.0 runs two independent transaction backends in one local PostgreSQL WebAssembly engine. It reads your Supabase migrations, writes a supported candidate test, explores every bounded statement issue order and saves a failure you can replay. No Docker or external database server is needed.

The free `npx -y viberaven@1.10.0 check` remains the existing repository checker. `race` is a separate command; it does not inspect a live Supabase project or certify an entire app.

122 of 124 PostgreSQL isolation specs; hidden tests: 199/200 new orders and 1,500/1,500 real-app interleavings, with native PostgreSQL at 100% through the same judge; 80/80 exact replays; 0 leaks between sessions in 60 isolation cases. [Method and limitations](https://github.com/ohad6k/VibeRaven/blob/main/docs/race.md#frozen-engine-proof).

[Engine](https://viberaven.dev/engine) · [Connect your agent](https://viberaven.dev/connect/mcp)

1. `npx -y viberaven@1.10.0 check`: repository risks before launch.
2. `npx -y viberaven@1.10.0 race`: two users at once, with the exact order.
3. Fix, run `race` again, and replay the order to confirm.

## Start in an empty folder

```sh
npx -y viberaven@1.10.0 race --example
```

Writes the bundled two-user test into `.viberaven/race-example`, runs its 60 orders,
shows 24 broken orders and replays the first break byte-for-byte. It ends with the
command to run the bundled fixed migrations. Your existing migrations are preserved;
edited example inputs are never overwritten. Node 24+ with JSPI is required.

## Run in your repository

Use Node 24+. The CLI starts its JSPI process with the required flag itself.

```sh
npx -y viberaven@1.10.0 race
npx -y viberaven@1.10.0 race --spec viberaven.race.json
npx -y viberaven@1.10.0 race --from .viberaven/race/report.json --replay 2
```

The runtime is the optional exact dependency `@viberaven/sessions@0.1.0`. If your package manager omitted it, install both packages locally with `npm install viberaven@1.10.0 @viberaven/sessions@0.1.0`, then run `npx --no-install viberaven@1.10.0 race`. A project-only engine install may be invisible to a cached npx CLI. Unsupported hosts receive a clear error. The engine also has a Chrome Worker JSPI entry; the CLI runs in Node.

Migrations are immediate `.sql` files in `supabase/migrations`, in lexical filename order, executed verbatim against a fresh pinned image. Use `--migrations dir` for another directory. Nothing is applied to a hosted database. `--bootstrap file.sql` supplies an explicit offline environment fixture before migrations. `--extensions pgcrypto,btree_gist` enables those packaged extensions; SQL must still create them. No general Supabase service emulation is implied.

The initial writer recognizes a narrow literal count-limit INSERT trigger with one grouping column and simple seedable columns. It writes synthetic rows and labels the business intent, privileged execution and seed reachability as assumptions. It refuses ambiguous rules, foreign-key seeds and unsupported types. A checked-in `viberaven.race.json` is used automatically; `--spec` supports other rules. This preview does not discover every app rule or invoke a hosted model.

`--write-only` writes the spec after loading migrations, without exploring schedules. Review it before relying on its coverage. Generated and explicit specs are saved beside each report as `<name>.spec.json`.

## When a first run cannot complete

A migration error prints its filename, SQLSTATE, message and exact failing SQL
statement. A missing prerequisite points to `--bootstrap`; a supported bundled
extension points to `--extensions`. Other unsupported cases end with the runnable
`race --example` command. Migrations remain executed as whole batches, without
rewriting SQL or retrying failed statements.

If the writer finds zero or several candidates, it describes the supported literal
count-limit INSERT-trigger shape. Write `viberaven.race.json` using the template
below for another rule; the last printed command runs the bundled example.

## Small synthetic sample

The [capacity fixture](../examples/race-capacity/README.md) has a trigger that counts bookings before inserting one. With one existing booking and a capacity of two, A and B can both see a free place and both commit.

```sh
cd examples/race-capacity
npx -y viberaven@1.10.0 race
```

Expected summary (timings vary):

```text
60 orders, 24 broken, 0 waiting
read committed: 12/20 broken
repeatable read: 12/20 broken
serializable: 0/20 broken
First broken order 001101 (read committed); COMMIT A=true, B=true
```

Replay the first failure with `--from .viberaven/race/report.json --replay 2`. Copy the sample's reviewed `fix.sql` to `supabase/migrations/002_lock_capacity.sql`, then run with the original saved spec and a separate output:

```sh
npx -y viberaven@1.10.0 race --spec .viberaven/race/report.spec.json --out .viberaven/race/fixed.json
```

Expected: 60 orders completed, zero broken, and actual engine waits. The shared guard row serializes the capacity check. Stale snapshots may produce serialization errors; those are retained in the records. No retries are added. Adapt the locking strategy to your app and review it before changing production SQL.

## Explicit spec

```json
{
  "rule": "At most two bookings per event",
  "setup": "INSERT INTO bookings VALUES ('seed', 'event')",
  "requests": [
    { "statements": ["INSERT INTO bookings VALUES ('A', 'event')"] },
    { "statements": ["INSERT INTO bookings VALUES ('B', 'event')"] }
  ],
  "invariant": "SELECT NOT EXISTS (SELECT 1 FROM bookings GROUP BY event_id HAVING count(*) > 2)",
  "isolation": ["read committed", "repeatable read", "serializable"],
  "notes": "Synthetic direct SQL; application reachability needs review",
  "uncertain": true
}
```

The invariant must initially return exactly one non-NULL boolean. Each request has one or more single SQL statements. The runner owns transaction control and session settings. Optional request `role` and `claims` issue `SET LOCAL ROLE` and local JWT-claim settings. Omitted roles run as postgres and bypass ordinary RLS. Roles, helpers, grants and policies must exist in migrations or the explicit bootstrap. This does not validate JWT signatures, HTTP authorization or PostgREST behavior.

## Method and output

BEGIN and COMMIT are schedule steps. Two one-statement requests produce 20 stable A-first merges per isolation level; the sample's three levels produce 60. Request-local order is preserved. If a statement reaches a real engine latch wait, the other backend can advance. Orders describe issue priority; different orders may realize the same execution. Statement-internal switches are not exhaustively enumerated.

The runner snapshots regular application rows and sequence values after setup, then restores before each order. Only the control connection suppresses triggers during reset; competing backends use real triggers, isolation and policies. More than 100,000 orders per level is refused rather than sampled. Both-pending schedules beyond this preview scheduler's supported progress model are INCOMPLETE.

Reports contain completion status, input and runner hashes, engine identities, counts by isolation, real-wait counts, elapsed time and the first broken order. Local JSONL records retain commits, ordered SQLSTATE arrays, invariant truth, issue/completion traces and raw PostgreSQL protocol bytes. These local files contain your test SQL and data; review them before sharing.

Exit 0: completed with no broken invariant, or `--write-only` wrote a spec without executing tests. Exit 1: completed with a broken invariant. Exit 2: invalid input, unsupported host or incomplete execution. Read `complete` and `status`; a zero count from an incomplete run is not a pass.

Replay runs the identical prefix from order 0 through the selected zero-based index. It verifies migrations, spec, bootstrap, extensions, runner and runtime identities against `--from`, then compares the selected record with the original bytes. Replay cost grows with the index. Whole-report bytes and timings are excluded. Identical pinned inputs are required.

## Pinned engine and evidence

CLI, shim and MCP version: **1.10.0**. Independent sessions package: **0.1.0**. Approved upstream runtime identity: `787a86e16d9d83fb37bd1d5d7fd3f4be8beaa3ddbc80c6da31a017584c6f814d`. Wasm SHA-256: `e1fccb85ac0a8d06e1b9353bdccc21dd33ba1f0475f48903fcc1d203f764533e`. The distributable manifest also identifies the selected dependency closure; that slot hash differs from the full engineering-input identity.

Archived qualification of these engine bytes reports 1,820/1,820 schedule outcomes, 464 real waits, 122/124 public PostgreSQL isolation specs, and 15/15 native-keyed signal probes. The prototype separately compared 1,350 schedule outcomes with native PostgreSQL 18.6, including ordered SQLSTATEs, commits, invariant truth and waiting backends. These summaries describe the named pinned methods, not the whole PostgreSQL suite. The sample above is the small public reproduction; it cannot reproduce the complete private suite or real-app corpus.

Local tarball verification completed the synthetic test (24/60 broken, byte-identical replay), its guard-row fix (0/60 broken, 36 orders with actual waits), and two private migration repositories (12/20 and 40/70 broken, both replayed byte-identically). The private cases use an explicit offline Supabase fixture; one is a privileged bootstrap path and the other has unverified production onboarding reachability. Their identities, source SQL and full test corpus are withheld. No bug-finding, fix-quality, token-cost or time advantage over a plain coding agent is claimed; the prior confirmed-bug comparison tied. Historical emulator and revised single-session timings are not performance claims for this release.

## Frozen-engine proof

| Check on the L4 frozen runtime | Result |
| --- | --- |
| Public PostgreSQL isolation specs | **122/124** |
| Hidden new step orders | **199/200**; native PostgreSQL **200/200** through the same judge |
| Hidden real-app interleavings | **1,500/1,500**; native PostgreSQL **1,500/1,500** through the same judge |
| Byte-equal replays | **80/80** |
| Isolation cases | **0 crossings in 60 cases** |
| Speed against stock PGlite on four real repositories | **Within 10%** under the 15-pair protocol: 14/15, 15/15, 15/15 and 15/15 ratios <=1.10 |

Method: hash-frozen engine bytes, fresh-database native PostgreSQL controls through
the same judge, recorded protocol/results and replay bytes; speed uses 15 alternating
stock/engine pairs per repository with a >=12/15 threshold at <=1.10.

Both public misses remain: **deadlock-parallel completion order** and
**insert-conflict application_name/lock introspection** (the latter also fails on
native PostgreSQL through the same judge). The hidden new-order miss concerns
async-notify notification-queue usage. No real parallel workers, universal PostgreSQL
compatibility, whole-app safety or advantage over a plain coding agent is claimed.

## Limits and licenses

This is transactional row-workload testing. DDL in requests, persistent session/advisory locks, temporary tables in requests, large objects, materialized-view refreshes, external services and nontransactional side effects are outside reset/replay coverage. SQL functions can cause side effects: run only repository SQL you trust. It is not a security sandbox. No universal extension parity, production-server replacement or universal PostgreSQL equivalence is claimed. Cooperative interrupt coverage depends on rebuilt native code reaching PostgreSQL interrupt checkpoints.

VibeRaven CLI/discovery components retain MIT. Sessions-owned additions use Apache-2.0; full PostgreSQL, PGlite and relevant third-party notices travel with the engine package. Each package includes THIRD_PARTY_NOTICES with its bundled-library licenses and attributions. A later runtime swap needs a complete portable slot with its manifest, `node scripts/swap-engine-runtime.mjs <dir>`, and fresh package verification. It copies validated bytes and never builds the engine.
