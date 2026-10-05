# Find missing RLS in Supabase migrations before deployment

VibeRaven can read the migrations in an AI-built app on Vercel and Supabase and flag a table that has no RLS enablement in the supplied SQL. This example lets you inspect the finding, add a policy migration, and compare the repository result.

The two folders contain synthetic SQL and a Supabase dependency declaration. They are small scanner fixtures, not runnable web apps. They need no database connection. Do not install the fixture dependencies or apply this SQL to your production database.

## Run the before example

From this repository's root:

```bash
cd examples/proof/missing-rls/before
npx -y viberaven@1.6.3 check
```

Use `npx.cmd` on Windows PowerShell if execution policy blocks `npx`. Initial installation downloads the published package; the repository check reads the local files and writes analysis under `.viberaven/`.

`supabase/migrations/0001_posts.sql` creates a posts table with a `user_id`, but does not enable row level security. The check reports `rls_disabled` at that file's first line and exits `1`. Inspect `.viberaven/agent-tasklist.md` for the finding and `.viberaven/gate-result.json` for the repository verdict.

## Compare the after example

```bash
cd ../after
npx -y viberaven@1.6.3 check
```

The after folder adds `0002_posts_rls.sql`. It enables RLS and defines authenticated owner policies for reads, inserts and updates. The update policy checks ownership of both the existing and resulting row. There is no delete policy.

The `rls_disabled` finding disappears and `check` exits `0`. The informational `missing_monitoring` finding remains. The recorded result, observed with the published 1.6.3 package on October 5, 2026:

| Result | Before | After |
| --- | --- | --- |
| `rls_disabled` | Present | Absent |
| `missing_monitoring` | Present | Present |
| `gate.status` | `not_clear` | `clear` |
| `check` exit code | `1` | `0` |

Inspect both migrations yourself. The result shows that this check recognizes the supplied migration change. It does not prove the policies enforce the access your real app requires.

## Use the result in a launch review

For a real Vercel + Supabase app, run the check in its project directory before deployment or a client handoff. Give the coding agent the specific finding and ask it to explain the intended access rules before editing policies. After agreed changes, rerun the check once per batch.

Verify deployed policy state and access behavior separately in the actual project. Supabase's [production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) and [RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) describe the live checks. A `clear` repository result is not a security audit or proof that the app is production ready.

For an independent review, also try a repository you are authorized to inspect. Report useful findings, false positives and missed gaps. This supplied example was prepared by the maintainer; it is not an outside-user testimonial.
