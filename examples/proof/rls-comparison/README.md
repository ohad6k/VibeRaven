# Reproduce eight synthetic RLS cases

This comparison was authored by VibeRaven's maintainer on October 5, 2026. It is a deliberately small set of eight synthetic cases, not an independent endorsement, overall accuracy ranking or production security certification. Both scanners receive separate byte-identical copies of the same SQL, package declaration and predeclared expectations.

The baseline is published **VibeRaven 1.6.3**, before the follow-up correction to its anonymous-access wording, and Python **rls-guard 0.1.0** at commit [`ba63656f6d1b7cfae7f3be32e9a0a1749659fe5c`](https://github.com/AgentJDrew/rls-guard/tree/ba63656f6d1b7cfae7f3be32e9a0a1749659fe5c). The Python repository is not an npm package named `supabase-rls-guard`; reproducing it does not validate that separate package name.

## Run locally

Use Node.js 20 or newer, npm/npx, Python 3.10 or newer and Git on your PATH. From this directory:

```sh
npm ci --ignore-scripts --workspaces=false
npm run verify:runtime --workspaces=false
python run_comparison.py
```

The npm lockfile pins PGlite 0.5.8 for disposable local PostgreSQL databases. No hosted Supabase connection, API key or account is used. The Python runner automatically clones the named rls-guard repository into ignored `.tools/rls-guard`, checks out and verifies the exact commit, and scopes its Python module path to child processes. An existing checkout at a different commit or containing modified, untracked or ignored files is refused without resetting or deleting it. No fixture npm dependencies are installed; their package declarations only provide scanner detection context. npx may download VibeRaven 1.6.3 and its dependencies, so scanner reproduction needs internet access.

Every run creates a separate ignored `receipts/` directory. Scanner receipts retain exact commands, exit codes, timestamps, raw stdout/stderr bytes, decoded JSON and input hashes. They can include local filesystem paths. Keep those receipts local unless you review and redact them yourself. The tracked [observed result summary](observed-results.json) contains only case names, finding IDs, severities and exit codes, without private paths. [Fixture hashes](fixture-hashes.json) bind all 29 unchanged input files to the original comparison; both runners verify them and check inputs remain unchanged. A scanner mismatch fails the reproduction while retaining its outputs. A match establishes these pinned observations, not security of another app.

The scoped `.gitattributes` disables Git text conversion for fixtures so their exact bytes survive Windows checkouts. The `live_database_tested: false` fields in the copied predeclared `expected.json` files describe the original scanner-only plan. Subsequent runtime execution is recorded separately in local receipts; those historical expectation files are intentionally unchanged.

## Observed scanner results

Exit codes are each scanner's default gate. Exit 0 does not mean there were no findings. VibeRaven's unrelated `missing_monitoring` info finding appears in every fixture and is omitted here.

| Fixture | Intended final permissions | VibeRaven 1.6.3 SQL findings; exit | rls-guard SQL findings; exit |
| --- | --- | --- | --- |
| missing_rls | Private notes accessible across authenticated users | `rls_disabled` critical + `data_api_grant_without_rls` critical; 1 | `RLS003` HIGH; 1 |
| valid_split | Owner isolation, policies in a later migration | None; 0 | None; 0 |
| private_select_true | Private notes readable across authenticated users | `rls_policy_allows_all_read` warning; 0 | `RLS001` CRITICAL; 1 |
| update_using_fallback | Owner UPDATE with implicit new-row check | None; 0 | `RLS004` HIGH; 1 |
| public_catalog | Deliberately public catalog SELECT | `rls_policy_allows_all_read` warning; 0 | `RLS001` CRITICAL; 1 |
| later_disable | Owner policies become ineffective after DISABLE | `rls_disabled` critical + `data_api_grant_without_rls` critical; 1 | `RLS002` HIGH; 1 |
| quoted_valid | Owner isolation, quoted lowercase qualified names | None; 0 | None; 0 |
| commented_enable | Private notes accessible; ENABLE is only a line comment | `rls_disabled` critical + `data_api_grant_without_rls` critical; 1 | `RLS003` HIGH; 1 |

Both tools detect all four predeclared risky private cases. VibeRaven detects unrestricted private SELECT as a warning and exits 0 by default; this is detection without blocking, not a missed finding. Deployment gates therefore need an explicit warning policy and review of the actual findings.

For `update_using_fallback`, rls-guard's RLS004 asserts that omitting WITH CHECK lets an owner-column change escape validation. PostgreSQL uses the UPDATE policy's USING predicate for new rows when WITH CHECK is omitted. The runtime reproduction permits an own-row body update and rejects an ownership transfer with SQLSTATE 42501. This is a semantic false positive for this specific policy and fixture. See the primary [PostgreSQL CREATE POLICY documentation](https://www.postgresql.org/docs/18/sql-createpolicy.html), including its UPDATE and omitted WITH CHECK behavior.

For `public_catalog`, both tools observe broad reads and acknowledge that public content can be intentional. rls-guard's CRITICAL classification blocks its default gate despite this fixture's declared public intent. This is a contextual alert and undesired block for the fixture, not a claim that its message always alleges a confirmed leak.

The baseline VibeRaven `rls_disabled` explanation overstates anonymous access although these private-note fixtures grant access only to authenticated users. Its companion `data_api_grant_without_rls` identifies authenticated accurately. The authenticated risk is real; the broader anonymous-access wording is unsupported by these grants. This loss remains in the baseline rather than being hidden by scanning a later version.

rls-guard detects the unsafe final state in `later_disable`, but its explanation says ENABLE was never found despite the earlier ENABLE migration. Its finding is useful while its description of migration history is inaccurate.

## What runtime execution establishes

Each exact fixture SQL sequence runs in its own disposable PGlite database. The test uses ordinary `authenticated` and `anon` roles without superuser or BYPASSRLS privileges, explicit schema grants and an `auth.uid()` shim returning the seeded caller UUID.

The four risky private cases return both users' rows. The three isolated owner cases return only the caller's row. The catalog returns both intentionally public rows to anon. The fallback case also permits the caller's body update and rejects transfer to the other owner. The script asserts those eight SELECT results and the two fallback UPDATE behaviors. It does not test all CRUD operations, a hosted Supabase project, JWT issuance or application authorization.

No overall winner score is assigned. These cases do not cover live provider state, functions, views, restrictive policy combinations, nonpublic schemas, mixed-case quoted identifiers or block comments. A clean scan is not proof of isolation. Public API access also depends on grants and provider configuration, as described in the primary [Supabase API security guide](https://supabase.com/docs/guides/api/securing-your-api).

## Inspect or challenge the result

Read the [unchanged fixture inputs](fixtures/), [portable scanner runner](run_comparison.py), [runtime checks](verify-fixtures.mjs) and [observed summary](observed-results.json). The pinned [rls-guard source](https://github.com/AgentJDrew/rls-guard/tree/ba63656f6d1b7cfae7f3be32e9a0a1749659fe5c) and [VibeRaven 1.6.3 package](https://www.npmjs.com/package/viberaven/v/1.6.3) identify what was actually executed. Re-run unchanged inputs before interpreting a difference. Any future cases should be declared as a separate matrix, not silently added to this completed one.
