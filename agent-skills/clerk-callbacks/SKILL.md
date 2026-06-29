---
name: clerk-callbacks
description: Find auth callback and redirect URI mismatches across local, preview, and production.
---

# Clerk Callbacks

## When To Use

Use this when a repo uses Clerk and login, signup, callback, redirect, preview, production domain, OAuth, or route-protection behavior may be misaligned. This skill should fire before production launch and after auth route, middleware, domain, or Vercel preview changes.

## Repo Signals To Inspect

- `middleware.ts`
- `middleware.js`
- `app/**`
- `pages/**`
- `src/middleware.*`
- `clerkMiddleware`, `authMiddleware`, `ClerkProvider`, `SignIn`, `SignUp`, `RedirectToSignIn`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- production and preview domain references

## Agent Actions

- Compare Clerk sign-in/sign-up route env vars and component props against actual app routes; every URL or path should resolve in local, preview, and production.
- Check force and fallback redirect variables for both sign-in and sign-up; Clerk recommends defining both sides because users can switch between flows.
- Inspect middleware matchers so public auth routes, callback routes, static assets, Sentry tunnels, and provider webhooks are not accidentally blocked.
- Search for localhost, preview, and production domains in repo config and verify the intended domain source is explicit.
- Verify `CLERK_SECRET_KEY` stays server-only and only publishable Clerk keys appear in client code.
- For production, look for evidence of allowed origins/subdomain allowlist and `authorizedParties` when request authorization needs origin allowlisting.

## Failure Modes To Catch

- Login works locally but redirects to localhost, preview, or a missing route in production.
- Sign-in fallback is configured but sign-up fallback is missing, or vice versa.
- Middleware blocks Clerk auth routes or redirects callback traffic into a protected route loop.
- Production uses development Clerk keys, or a secret key is exposed to client code.
- OAuth/social login works in development but production provider credentials or allowed redirect origins are missing.
- The agent claims dashboard domains are configured without Clerk dashboard evidence.

## Acceptable Evidence

- Repo evidence that Clerk route env vars, component props, and app routes agree.
- Middleware evidence showing auth pages and callbacks remain reachable while protected routes stay protected.
- Provider/dashboard receipt for production domains, allowed origins, OAuth provider settings, and redirect behavior.
- A smoke test or recorded auth flow showing sign-in/sign-up returns to the intended production route.
- A clear "unknown provider state" finding when dashboard settings are not available.

## What Must Be Verified

- Local, preview, and production callback URLs are represented correctly in repo config.
- Redirect URLs match the app routes that actually exist.
- Server-only Clerk secrets are not exposed to client code.
- Middleware protects the intended routes without blocking required callbacks.
- Dashboard callback state is either proven by provider evidence or listed as missing.

## Human-Action Boundary

The repo cannot prove Clerk dashboard domains, OAuth credentials, allowed origins, or production instance settings without provider evidence. Ask the user to verify production domains, preview domains, callback URLs, authorized parties, and allowed redirects in Clerk.

## Provider References

- Clerk redirect URL customization: https://clerk.com/docs/guides/development/customize-redirect-urls
- Clerk production deployment guide: https://clerk.com/docs/guides/development/deployment/production

## Output

Return:

1. evidence found
2. evidence missing
3. repo-code fixes or none
4. provider or human action needed
