# Resend — unverified sending domain (provider drift)

A redacted example of a provider gap VibeRaven flags but cannot fix from repo code: the Resend sending domain is not verified in the Resend dashboard, so transactional email silently fails in production even though the local app and code look correct.

## Repo evidence

The repo looks fine. The code uses the official SDK, the API key is wired through `.env.example`, and a transactional email helper is committed.

```ts
// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string) {
  return resend.emails.send({
    from: "VibeRaven <hello@example-app.com>",
    to,
    subject: "Welcome",
    html: "<p>Welcome to the app.</p>",
  });
}
```

```env
# .env.example
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@example-app.com
```

## Production symptom

Users sign up but never receive the welcome email. No exception is thrown in app logs. Resend's API accepts the request and returns a normal response, but the message never reaches the recipient. In the Resend dashboard, the affected email shows up under **Emails** with status `not_sent` and reason `Domain is not verified`.

```
[email.send] id=abc_123 to=user@example.com from=hello@example-app.com status=200 ok=true
# (no error in app logs)

# Resend dashboard → Emails → abc_123
# Status:  Not sent
# Reason:  The domain example-app.com is not verified. Please verify it in the dashboard.
```

## Human action VibeRaven cannot complete from repo code

VibeRaven can confirm the SDK is wired and the `from` address is set, but it cannot verify the sending domain on the user's behalf. The following steps must be completed by a human in the Resend dashboard:

1. Open <https://resend.com/domains> and click **Add Domain**.
2. Enter the sending domain used in `RESEND_FROM_EMAIL` (here, `example-app.com`).
3. Add the SPF, DKIM, and (optional) DMARC DNS records that Resend lists to the DNS provider for that domain.
4. Click **Verify DNS Records** in the Resend dashboard and wait until all records show **Verified**.
5. Send a test email from the dashboard to confirm delivery.

## Corrected dashboard state

After verification, the Resend dashboard shows the domain as ready to send and outgoing emails reach the inbox.

```
Resend dashboard → Domains → example-app.com
  Status:  Verified
  SPF:     Verified
  DKIM:    Verified
  DMARC:   Verified (optional)
  Region:  us-east-1

Resend dashboard → Emails → most recent
  Status:  Delivered
  From:    hello@example-app.com
  To:      user@example.com
```

At this point the repo-code evidence and the provider state agree, and the launch claim for transactional email is safe.
