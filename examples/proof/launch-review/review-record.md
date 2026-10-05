# Launch or client handoff review record

Blank template. No check below has been performed. Keep a working copy private and review it before sharing. Use environment variable names only; never include values, credentials, customer data, or private infrastructure details.

## Scope

| Field | Value |
| --- | --- |
| App / review purpose | NOT CHECKED |
| Review date and timezone | NOT CHECKED |
| Reviewer / handoff owner | NOT CHECKED |
| Repository commit | NOT CHECKED |
| Uncommitted changes or non-Git file snapshot | NOT CHECKED |
| Framework / hosting / database | NOT CHECKED |
| Target environment / deployed revision | NOT CHECKED |
| Scanner package and version actually run | NOT CHECKED |
| Command and run date | NOT CHECKED |
| Exit code and whether the check completed | NOT CHECKED |
| Repository verdict / evidence location | NOT CHECKED |

Use `viberaven@1.6.3` for the pinned walkthrough. Fill the scanner field from the actual run. A repository result cannot establish the deployed revision or provider state.

## Repository findings

Keep findings that remain open, false positives with their rationale, and the rerun result after changes. Do not translate a missing finding into proof of live behavior.

| Finding / gap ID | File evidence | Status | Change or next action | Owner | Rerun evidence and date |
| --- | --- | --- | --- | --- | --- |
| NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |

## Live checks and handoff evidence

Use **VERIFIED** only with evidence for that row and environment. Otherwise use **NEEDS ACTION**, **NOT CHECKED**, or **NOT APPLICABLE** with a reason. A clear repo verdict does not complete this table.

| Question | Status | Live evidence and date | Next action | Owner |
| --- | --- | --- | --- | --- |
| Do the deployed migrations and policies match the intended release? | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Do user A, user B and signed-out access match the intended read/write rules? | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Do sign-in, redirects and auth emails work in the target environment? | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Are required environment variable names configured in the intended deployment environment? | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| If payments are used, are endpoint configuration, signature handling and delivery behavior verified? | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Are backup coverage, recovery steps and responsibility recorded? | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Does the client control the required repository, hosting, database and domain accounts? | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Are credentials and integration ownership reviewed for handoff, with any rotations assigned? | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |
| Are deployment, rollback and support responsibilities assigned? | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |

Test access behavior with authorized test accounts and test data. A secret or service-role key alone does not demonstrate end-user RLS behavior. Follow the app's intended access rules rather than assuming every table is private.

## Environment variable inventory

| Variable name | Environment | Secure source of value, without the value | Owner | Verification status |
| --- | --- | --- | --- | --- |
| NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED | NOT CHECKED |

## Review decision

- Remaining blockers or unknowns: NOT CHECKED
- Next action and owner: NOT CHECKED
- Next review date: NOT CHECKED
- Launch or handoff decision and decision maker: NOT CHECKED

The decision belongs to the app owner. This record is neither a security audit nor proof that every production risk has been checked. See the [walkthrough and sources](./README.md).
