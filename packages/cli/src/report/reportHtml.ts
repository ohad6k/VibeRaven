import type { CliScanArtifact } from '../types';
import { getStationHtml } from '../../../../src/webview/getStationHtml';
import { hydrateArtifactForReport } from './hydrateArtifact';

const STATIC_REPORT_NONCE = 'viberaven-static-report';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function stripEvidenceFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripEvidenceFields);
  }
  if (!isRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      key === 'evidence' ? [] : stripEvidenceFields(entry)
    ])
  );
}

function stripProviderTruthEvidence(artifact: CliScanArtifact): CliScanArtifact {
  if (!artifact.providerTruth) {
    return artifact;
  }
  return {
    ...artifact,
    providerTruth: stripEvidenceFields(artifact.providerTruth) as CliScanArtifact['providerTruth']
  };
}

const CATEGORY_KEYS = [
  'appFlow',
  'frontend',
  'backend',
  'auth',
  'database',
  'payments',
  'deployment',
  'monitoring',
  'security',
  'testing',
  'landing',
  'errorHandling'
];

function defaultAreaKey(artifact: CliScanArtifact): string {
  const fromGap = artifact.gaps[0]?.primaryMapCategory;
  if (fromGap) {
    return fromGap;
  }
  const areas = artifact.missionGraph.areas ?? [];
  if (areas.some((area) => area.key === 'frontend')) {
    return 'frontend';
  }
  const fromArea = areas.find((area) => CATEGORY_KEYS.includes(area.key))?.key;
  return fromArea ?? 'frontend';
}

function buildStaticSession(artifact: CliScanArtifact): Record<string, unknown> {
  return {
    signedIn: Boolean(artifact.accountEmail || artifact.usage || artifact.plan),
    account: {
      email: artifact.accountEmail ?? '',
      plan: artifact.plan ?? artifact.usage?.plan ?? 'free'
    },
    usage: artifact.usage ?? null
  };
}

function staticStateScript(artifact: CliScanArtifact): string {
  const state = {
    lastPayload: artifact,
    lastScannedAt: artifact.scannedAt,
    selectedProductionCategoryKey: defaultAreaKey(artifact),
    selectedProviders: artifact.selectedProviders ?? {},
    productionConnectionChoices: { version: 1, choices: {} },
    staticSession: buildStaticSession(artifact)
  };
  const stateJson = JSON.stringify(state).replace(/</g, '\\u003c');
  return `<script nonce="${STATIC_REPORT_NONCE}">
window.__VIBERAVEN_STATIC_STATE__ = ${stateJson};
function acquireVsCodeApi() {
  var state = window.__VIBERAVEN_STATIC_STATE__ || {};
  return {
    getState: function () { return state; },
    setState: function (nextState) {
      state = Object.assign({}, state, nextState || {});
      window.__VIBERAVEN_STATIC_STATE__ = state;
    },
    postMessage: function (message) {
      if (!message || typeof message !== 'object') return;
      if (message.type === 'session:refresh') {
        window.postMessage({ type: 'session:update', payload: state.staticSession || null }, '*');
        return;
      }
      if (message.type === 'station:openExternal' && typeof message.url === 'string') {
        window.open(message.url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (message.type === 'station:copy' && typeof message.text === 'string' && navigator.clipboard) {
        navigator.clipboard.writeText(message.text).catch(function () {});
      }
    }
  };
}
</script>`;
}

export function generateReportHtml(artifact: CliScanArtifact): string {
  const hydrated = stripProviderTruthEvidence(hydrateArtifactForReport(artifact));
  const html = getStationHtml(STATIC_REPORT_NONCE, 'report/station.css', 'report/station.js', {
    surface: 'panel',
    skin: 'editorial',
    cspSource: "'self'",
    logoImageUri: 'report/assets/viberaven-logo.png'
  });
  return html.replace(
    `<script nonce="${STATIC_REPORT_NONCE}" src="report/station.js"></script>`,
    `${staticStateScript(hydrated)}
      <script nonce="${STATIC_REPORT_NONCE}" src="report/station.js"></script>`
  );
}
