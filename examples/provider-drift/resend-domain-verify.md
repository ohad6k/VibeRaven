# Resend: unverified sending domain

Synthetic teaching example, not a captured incident or a completed provider check.
Adapted from Mohammed Sufiyan Ahmed's contribution in [public PR #53](https://github.com/ohad6k/VibeRaven/pull/53), commit `e85eef05d219ee830aef9379e2bd45c6e8f83dee`.
It preserves the provider-state boundary while correcting the original response and delivery claims.

An app can have an email helper in its repository while its sending domain still needs verification in Resend. Repository evidence alone cannot establish the live domain state or successful delivery. This example does not claim that VibeRaven currently detects or verifies this condition.

## Repository evidence

```ts
// lib/email.ts, illustrative only
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string) {
  const result = await resend.emails.send({
    from: 'Example App <hello@updates.example.com>',
    to,
    subject: 'Welcome',
    html: '<p>Welcome to the app.</p>',
  });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
```

`RESEND_API_KEY` is a variable name only. No key, customer address or real provider identifier is included.

## Expected provider error, not an observed result

Resend documents an unverified domain as HTTP `403`, error type `validation_error`. It does not document a successful `200` response followed by silent delivery loss for this condition. See the [official error reference](https://resend.com/docs/api-reference/errors).

Illustrative application log, not a provider receipt:

```text
email.send failed: status=403 type=validation_error domain=updates.example.com
domain verification required; delivery not checked
```

Handle the SDK's error result explicitly. An application that ignores it can hide the failure from its own user interface.

## Owner verification steps

1. Confirm the sender domain used by the deployed app and the intended Resend account.
2. In [Resend Domains](https://resend.com/domains), inspect the domain status and follow its current DNS instructions. Do not invent record values or treat committed configuration as proof of live DNS.
3. After the domain is verified, send a controlled test to an address the owner controls and retain a redacted provider receipt and delivery evidence.

Blank evidence record for a future check:

| Check | Current result |
| --- | --- |
| Live domain verification | Not checked |
| Deployed sender/account configuration | Not checked |
| Controlled send accepted | Not checked |
| Delivery to the intended inbox | Not checked |

A verified domain or an accepted send alone does not prove inbox delivery or overall application readiness. Those claims need their own evidence.
