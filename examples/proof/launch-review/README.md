# Review an AI-built app before launch or client handoff

Use this workflow to turn a repository check into a short record of what you checked, what still needs evidence, and who owns the remaining work. VibeRaven's documented fit is an AI-built app deployed on Vercel with Supabase.

For a Lovable app, first identify its backend and hosting. A project using Lovable Cloud has different provider controls from one using its own Supabase project. If you have a local copy through [GitHub sync](https://docs.lovable.dev/integrations/github), confirm that you are reviewing the intended branch and revision. Lovable apps do not all use Next.js or Vercel.

## Run and interpret the repository check

You need Node.js 20 or newer, npm with npx, and a local copy of the app you are authorized to review. Run these commands from the **app's root**, not this example folder:

```bash
node --version
git rev-parse HEAD
git status --short
npx -y viberaven@1.6.3 check
```

If the app is not a Git repository, record the revision as unavailable and describe the files reviewed. In Windows PowerShell, use `npx.cmd` if execution policy blocks `npx`. The first run downloads the published package; the repository check then reads local files and writes results under `.viberaven/`.

Read `.viberaven/agent-tasklist.md` for findings and `.viberaven/gate-result.json` for the verdict. A completed check exits `1` when it finds blockers. If the command fails before producing a result, record the failure rather than treating it as a verdict.

A completed `check` can exit `0` while reporting warnings. For example, a policy using `SELECT ... USING (true)` is a warning: review whether every granted caller should read every row. It can be appropriate for a public catalog and inappropriate for private notes. Record the finding and intended access rule even when the default command passes.

If your CI policy requires warnings to fail the job too, use the existing warning mode:

```bash
npx -y viberaven@1.6.3 --strict=warning
```

The default `check` and `--strict` fail on blockers; `--strict=warning` also fails when warnings remain. A command failure before a completed scan still needs investigation. Choose this threshold deliberately, and retain the findings in the review record.

Use the [missing-RLS example](../missing-rls/) to inspect a reproducible finding and its migration change. For your own app, establish intended access rules before changing policies. Fix an agreed batch of findings, then rerun:

```bash
npx -y viberaven@1.6.3 check
```

A `clear` result covers the repository checks. It does not establish production readiness, deployed policies, successful payments, or client ownership.

For a repeatable comparison of RLS findings and default exit thresholds, see the [eight-case RLS comparison](../rls-comparison/). It tests published VibeRaven 1.6.3 and a pinned Python scanner on identical synthetic migrations, with local PostgreSQL checks and stated limits.

## Build the review record

Copy [review-record.md](./review-record.md) into your private project notes. Record the commit and uncommitted changes, date, target environment, command version, findings, and next owner. Add separate evidence for live checks; leave unavailable checks marked **NOT CHECKED**.

The [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) and [Vercel production checklist](https://vercel.com/docs/production-checklist) cover broader launch responsibilities. For Lovable, review its [built-in security scans](https://docs.lovable.dev/features/security) as part of the workflow. A local check complements that work; it cannot see settings stored only in a dashboard.

Before sharing the record or generated output, review it for sensitive information. Record environment variable **names**, never values; omit credentials, customer data, and private infrastructure details. The CLI creates `.viberaven/` without adding it to your app's `.gitignore`.

## Three prompts for your coding agent

### Check an AI-built app before deployment

```text
Review this app before deployment. Identify its framework, hosting, database,
repository revision, and any uncommitted changes. If it is a Vercel + Supabase
app, run npx -y viberaven@1.6.3 check from the app root and read its tasklist
and repository verdict. Explain each finding with file evidence and propose one
scoped fix at a time. Establish intended access rules before editing RLS.
Rerun after an agreed batch. Record unresolved findings and live checks
separately; do not call the app production ready from a clear repo verdict.
```

### Prepare a Lovable + Supabase app for real users

```text
Help review this Lovable app before launch. First establish whether it uses
Lovable Cloud or my own Supabase project, where it is hosted, and which
revision the local files represent. Review Lovable's available security
findings. If this is a local Vercel + Supabase app, use
npx -y viberaven@1.6.3 check for repository evidence. Plan separate checks
for deployed policies, two-account data isolation, auth redirects, email
delivery, and recovery. Use test accounts and only authorized environments.
For every item, record the evidence or NOT CHECKED and the next owner.
```

### Prepare an app for client handoff

```text
Prepare a client handoff review record for this app. Record the revision,
target environment, date, and reviewer. If the app uses Vercel + Supabase,
include npx -y viberaven@1.6.3 check findings and remaining repo work.
Separately record evidence for client ownership, provider settings,
deployment access, auth, payments if used, and backups. List environment
variable names and the client's secure source of values, never values.
Mark unavailable evidence NOT CHECKED. Assign remaining actions to an owner.
Do not transfer accounts, rotate keys, or deploy merely to fill the record.
```

For detailed steps, use the [Lovable + Supabase launch checklist](https://viberaven.dev/lovable-supabase-app-launch-checklist), [webhook, environment and policy checks](https://viberaven.dev/check-stripe-webhooks-env-vars-supabase-policies), and [client handoff checklist](https://viberaven.dev/ai-built-app-client-handoff-checklist). These prompts are starting points for a review, not completed verification.
