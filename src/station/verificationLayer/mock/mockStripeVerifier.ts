import { buildVerificationCheck } from '../shared/buildCheck';
import { resolveProviderConnectionState } from '../shared/connection';
import {
  buildRepoScanContext,
  collectReferencedEnvNames,
  collectStripePriceEnvNames,
  findStripeWebhookRoute,
  hasStripeWebhookSignature
} from '../shared/repoSignals';
import { providerCheckId } from '../types';
import type {
  ProviderConfigDetection,
  ProviderConnectionState,
  ProviderVerifier,
  RepoProviderDiff,
  VerificationCheck,
  VerifierContext
} from '../types';

const REQUIRED_STRIPE_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed'
];

/** Mock Stripe dashboard state — replaced by Stripe MCP in phase 2. */
const MOCK_STRIPE_HAS_WEBHOOK_ENDPOINT = false;
const MOCK_STRIPE_CONFIGURED_EVENTS = new Set<string>();
const MOCK_STRIPE_LIVE_PRICE_IDS = new Set<string>();

export const mockStripeVerifier: ProviderVerifier = {
  provider: 'stripe',

  detectConfig(ctx: VerifierContext): ProviderConfigDetection {
    const repo = buildRepoScanContext(ctx.scan);
    const signals: string[] = [];
    if (ctx.scan.stackSignals.hasStripe) {
      signals.push('stack: hasStripe');
    }
    if (repo.deps.some((dep) => dep === 'stripe' || dep.startsWith('@stripe/'))) {
      signals.push('package: stripe');
    }
    if (findStripeWebhookRoute(repo)) {
      signals.push(`route: ${findStripeWebhookRoute(repo)}`);
    }
    const detected = signals.length > 0;
    return { provider: 'stripe', detected, signals };
  },

  connectStatus(ctx: VerifierContext): ProviderConnectionState {
    return resolveProviderConnectionState('stripe', ctx.mcpVerifierState);
  },

  runChecks(ctx: VerifierContext): VerificationCheck[] {
    const connectionState = this.connectStatus(ctx);
    const repo = buildRepoScanContext(ctx.scan);
    const webhookRoute = findStripeWebhookRoute(repo);
    const referencedEnv = collectReferencedEnvNames(ctx.scan, ctx.repositoryEvidence);
    const priceEnvNames = collectStripePriceEnvNames(repo, referencedEnv);
    const missingEvents = REQUIRED_STRIPE_EVENTS.filter((event) => !MOCK_STRIPE_CONFIGURED_EVENTS.has(event));

    return [
      buildVerificationCheck({
        provider: 'stripe',
        checkKey: 'dashboard-webhook-endpoint',
        area: 'payments',
        title: 'Stripe dashboard webhook endpoint',
        description: webhookRoute
          ? 'Repo defines a webhook route; Stripe dashboard endpoint must match and be reachable.'
          : 'No Stripe webhook route found in repo; dashboard endpoint check still applies when Stripe is used.',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: Boolean(webhookRoute),
        providerObservationMet: MOCK_STRIPE_HAS_WEBHOOK_ENDPOINT,
        fixType: 'provider-config',
        severity: 'critical',
        repoSignals: webhookRoute ? [`route: ${webhookRoute}`] : [],
        providerSignals: ['Stripe webhooks API or MCP'],
        requiredEvidence: ['Webhook endpoint URL registered in Stripe'],
        manualAction: 'Register the production webhook URL in Stripe Dashboard → Developers → Webhooks.'
      }),
      buildVerificationCheck({
        provider: 'stripe',
        checkKey: 'webhook-events',
        area: 'payments',
        title: 'Stripe webhook event subscriptions',
        description:
          missingEvents.length > 0
            ? `Missing required events: ${missingEvents.join(', ')}`
            : 'Required subscription lifecycle events are configured (mock).',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: Boolean(webhookRoute && hasStripeWebhookSignature(repo)),
        providerObservationMet: missingEvents.length === 0,
        fixType: 'provider-config',
        severity: 'critical',
        repoSignals: hasStripeWebhookSignature(repo) ? ['webhooks.constructEvent in repo'] : [],
        providerSignals: ['Stripe webhook endpoint event list'],
        requiredEvidence: REQUIRED_STRIPE_EVENTS.map((event) => `event: ${event}`)
      }),
      buildVerificationCheck({
        provider: 'stripe',
        checkKey: 'live-price-ids',
        area: 'payments',
        title: 'Stripe live price IDs',
        description:
          priceEnvNames.length > 0
            ? 'Price/product env vars are referenced in repo; live Stripe prices must match.'
            : 'No Stripe price env vars detected; confirm products/prices if billing is enabled.',
        evidenceSource: 'provider',
        connectionState,
        repoExpectationMet: priceEnvNames.length > 0,
        providerObservationMet:
          priceEnvNames.length > 0 &&
          priceEnvNames.every((name) => MOCK_STRIPE_LIVE_PRICE_IDS.has(name)),
        fixType: 'provider-config',
        severity: priceEnvNames.length > 0 ? 'warning' : 'info',
        repoSignals: priceEnvNames.map((name) => `env: ${name}`),
        providerSignals: ['Stripe products/prices API or MCP'],
        requiredEvidence: ['Live price IDs match env configuration']
      })
    ];
  },

  buildDiffs(ctx: VerifierContext): RepoProviderDiff[] {
    const repo = buildRepoScanContext(ctx.scan);
    const webhookRoute = findStripeWebhookRoute(repo);
    const diffs: RepoProviderDiff[] = [];

    if (webhookRoute && !MOCK_STRIPE_HAS_WEBHOOK_ENDPOINT) {
      diffs.push({
        id: providerCheckId('stripe', 'webhook-endpoint-mismatch'),
        provider: 'stripe',
        area: 'payments',
        title: 'Stripe webhook endpoint not registered',
        description:
          'The repo implements a webhook handler, but no matching endpoint is registered in the mock Stripe account.',
        repoExpectation: `Webhook route: ${webhookRoute}`,
        providerActual: 'No Stripe webhook endpoint (mock empty dashboard)',
        severity: 'critical',
        suggestedFix: 'provider-config',
        evidenceRefs: [`route: ${webhookRoute}`]
      });
    }

    const referencedEnv = collectReferencedEnvNames(ctx.scan, ctx.repositoryEvidence);
    if (referencedEnv.includes('STRIPE_WEBHOOK_SECRET') && !MOCK_STRIPE_HAS_WEBHOOK_ENDPOINT) {
      diffs.push({
        id: providerCheckId('stripe', 'webhook-secret-without-endpoint'),
        provider: 'stripe',
        area: 'payments',
        title: 'STRIPE_WEBHOOK_SECRET without dashboard endpoint',
        description:
          'Repo expects STRIPE_WEBHOOK_SECRET but Stripe dashboard webhook endpoint is not confirmed.',
        repoExpectation: 'STRIPE_WEBHOOK_SECRET referenced in repo',
        providerActual: 'No webhook endpoint to deliver signed events',
        severity: 'critical',
        suggestedFix: 'provider-config',
        evidenceRefs: ['env: STRIPE_WEBHOOK_SECRET']
      });
    }

    return diffs;
  }
};
