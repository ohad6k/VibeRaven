export const localUiClientJs = `
const app = document.getElementById('vr-app');
const stateEl = document.getElementById('vr-state');
const currentState = JSON.parse(stateEl.textContent || '{}');
let missionCards = currentState.missionCards || null;

const demo = {
  activeNavId: 'flow',
  selectedProviderId: 'supabase',
  selectedReleaseId: 'v1.3.0',
  activeStepId: 'agent',
  agentFixing: false,
  verified: false,
  notice: '',
  providerPickerOpen: false,
  activeModal: null,
  activeStudioTab: 'chat',
  selectedCliId: 'codex',
  cliConnected: false,
  cliSetupComplete: false,
  cliConnectTargetId: null,
  cliLastConnectTargetId: null,
  cliProbeStatus: 'idle',
  cliProbeMessage: '',
  simulateFresh: false,
  cliAgentsHydrated: false,
  cliTerminalLines: [],
  cliTerminalTitle: '',
  cliTerminalDraft: '',
  cliConnectCompleteAgentId: null,
  cliSessionReady: {},
  studioExpanded: false,
  activeChatCount: 1,
  selectedModelId: 'gpt-5.5',
  selectedReasoning: 'High',
  selectedContext: 'Production',
  selectedAccessMode: 'approve',
  modelMenuOpen: false,
  reasoningMenuOpen: false,
  contextMenuOpen: false,
  accessMenuOpen: false,
  pickerChatIndex: 0,
  chatContexts: [{ providerId: null, releaseId: null, cliId: 'codex', modelId: 'gpt-5.5', reasoning: 'High', context: 'Production', accessMode: 'approve', messages: [], activeTask: null }],
  activeRecentChatId: null,
  droppedProviderId: null,
  dragKind: null,
  dragProviderId: null,
  dragReleaseId: null,
  dragChatId: null,
  dropActive: false,
  droppedReleaseId: null,
  fixPlanExpandedChatIndex: null,
  releaseDiff: { text: '', from: '', to: '', fromLabel: '', toLabel: '', stats: null, loading: false, error: '' },
  releaseChangelog: { entries: [], from: '', to: '', fromLabel: '', toLabel: '', loading: false, error: '' },
};

function readCliSessionReady() {
  try {
    let raw = localStorage.getItem('viberaven-cli-ready');
    if (!raw) {
      raw = sessionStorage.getItem('viberaven-cli-ready');
      if (raw) localStorage.setItem('viberaven-cli-ready', raw);
    }
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCliSessionReady(value) {
  try {
    localStorage.setItem('viberaven-cli-ready', JSON.stringify(value || {}));
  } catch {
    // Ignore storage failures in preview shells.
  }
}

demo.cliSessionReady = readCliSessionReady();

function cliAgentInstalled(agent) {
  if (!agent) return false;
  if (agent.id === 'terminal') return true;
  if (agent.installed === true) return true;
  return agent.connected !== false;
}

function cliAgentReady(agentId) {
  return demo.cliSessionReady[agentId] === true;
}

function markCliSessionReady(agentId) {
  if (!agentId || agentId === 'terminal') return;
  demo.cliSessionReady[agentId] = true;
  writeCliSessionReady(demo.cliSessionReady);
}

function setConnectTarget(agentId) {
  if (!agentId || agentId === 'terminal') return;
  demo.cliConnectTargetId = agentId;
  demo.cliLastConnectTargetId = agentId;
}

function terminalTargetId() {
  const target = demo.cliConnectTargetId || demo.cliLastConnectTargetId;
  if (target && target !== 'terminal') return target;
  const coding = cliAgents.find((agent) => agent.id !== 'terminal');
  return coding?.id || demo.selectedCliId || 'codex';
}

function shouldShowConnectToolbar() {
  const targetId = terminalTargetId();
  if (!targetId || targetId === 'terminal') return !demo.cliSetupComplete;
  if (!demo.cliSetupComplete) return true;
  return !cliAgentReady(targetId);
}

function terminalStatusLabel(targetId) {
  const agent = cliAgents.find((item) => item.id === targetId);
  if (demo.cliProbeStatus === 'probing') return 'verifying…';
  if (demo.cliProbeStatus === 'failed') return 'verify failed — sign in and test again';
  if (cliAgentReady(targetId)) return 'ready for chat';
  if (agent && cliAgentInstalled(agent)) return 'installed — sign in required';
  return 'not installed';
}

function terminalConnectTitle(agent) {
  const targetId = agent?.id || terminalTargetId();
  if (!demo.cliSetupComplete || !cliAgentReady(targetId)) {
    return 'Connect ' + (agent?.label || targetId);
  }
  return demo.cliTerminalTitle || agent?.label || targetId;
}

const providerAssets = {
  supabase: '/report/assets/provider-supabase.png',
  vercel: '/report/assets/provider-vercel.png',
  stripe: '/report/assets/provider-stripe.png',
  github: '/report/assets/provider-github.png',
  sentry: '/report/assets/provider-sentry.png',
  posthog: '/report/assets/provider-posthog.png',
  clerk: '/report/assets/provider-clerk.png',
  authjs: '/report/assets/provider-clerk.png',
  resend: '/report/assets/provider-resend.png',
  upstash: '/report/assets/provider-upstash.png',
};

const providerMarkAssets = {
  supabase: '/report/assets/provider-supabase-mark.svg',
  vercel: '/report/assets/provider-vercel-mark.svg',
  stripe: '/report/assets/provider-stripe-mark.svg',
  github: '/report/assets/provider-github-mark.svg',
  sentry: '/report/assets/provider-sentry-mark.svg',
  posthog: '/report/assets/provider-posthog-mark.svg',
  clerk: '/report/assets/provider-clerk-mark.svg',
  authjs: '/report/assets/provider-clerk-mark.svg',
  resend: '/report/assets/provider-resend-mark.svg',
  upstash: '/report/assets/provider-upstash-mark.svg',
};

const mascotAssets = {
  idle: '/report/assets/viberaven-mascot.png',
  fixing: '/report/assets/viberaven-mascot.png',
  verified: '/report/assets/viberaven-mascot.png',
  alert: '/report/assets/viberaven-mascot.png',
};

const providerDashboardUrls = {
  supabase: 'https://supabase.com/dashboard/projects',
  vercel: 'https://vercel.com/dashboard',
  stripe: 'https://dashboard.stripe.com',
  github: 'https://github.com/ohad6k/VibeRaven',
  sentry: 'https://sentry.io',
  posthog: 'https://app.posthog.com',
  clerk: 'https://dashboard.clerk.com',
  authjs: 'https://authjs.dev',
  resend: 'https://resend.com/emails',
  upstash: 'https://console.upstash.com',
};

const publicGithubUrl = 'https://github.com/ohad6k/VibeRaven';
const publicGithubApiUrl = 'https://api.github.com/repos/ohad6k/VibeRaven';
const docsUrl = 'https://viberaven.dev';
const communityUrl = 'https://github.com/ohad6k/VibeRaven/discussions/7';

const githubStats = {
  loading: false,
  loaded: false,
  error: false,
  stars: 0,
  forks: 0,
  issues: 0,
};

let lastRenderedModal = demo.activeModal;
const chatScrollCache = {};
let chatTaskTimer = null;

function providerTone(state, status) {
  const text = String(status || '').toLowerCase();
  if (state === 'live_verified' || text.includes('connected') || text.includes('verified')) return 'green';
  if (state === 'needs_repo_fix' || state === 'blocked' || text.includes('fix') || text.includes('blocked')) return 'red';
  if (state === 'repo_evidence_found' || text.includes('detected')) return 'green';
  if (state === 'requires_user_action' || state === 'connect_live') return 'orange';
  return 'neutral';
}

function providerChecks(provider) {
  const items = Array.isArray(provider.launchPath) ? provider.launchPath : [];
  if (!items.length) return provider.state === 'not_detected' ? '0/0' : '1/1';
  const ready = items.filter((item) => item.state === 'ready').length;
  return ready + '/' + items.length;
}

const providerScopeHints = {
  supabase: ['supabase'],
  vercel: ['vercel'],
  stripe: ['stripe'],
  github: ['github'],
  sentry: ['sentry'],
  posthog: ['posthog'],
  clerk: ['clerk'],
  authjs: ['auth.js', 'authjs', 'next-auth', 'nextauth'],
  resend: ['resend'],
  upstash: ['upstash'],
};

function providerTextMentionsOthers(text, providerId) {
  const lower = String(text || '').toLowerCase();
  if (!lower.trim()) return false;
  return Object.keys(providerScopeHints).some((id) => {
    if (id === providerId) return false;
    return (providerScopeHints[id] || [id]).some((hint) => lower.includes(hint));
  });
}

function providerScopedDetail(provider) {
  const name = provider.name || 'Provider';
  const area = provider.area || 'Production';
  if (provider.state === 'not_detected') {
    return name + ' is not linked in this project yet. Drag it into chat or ask the agent to connect.';
  }
  const launchPath = Array.isArray(provider.launchPath) ? provider.launchPath : [];
  const blocked = launchPath.find((item) => item.state === 'blocked' || item.state === 'needs_fix');
  if (blocked) {
    return name + ': ' + blocked.title + '. ' + (blocked.shortReason || 'Complete this step before launch.');
  }
  if (provider.nextFix?.whatToChange && !providerTextMentionsOthers(provider.nextFix.whatToChange, provider.id)) {
    return provider.nextFix.whatToChange;
  }
  if (provider.cockpit?.action?.whyThisMatters && !providerTextMentionsOthers(provider.cockpit.action.whyThisMatters, provider.id)) {
    return provider.cockpit.action.whyThisMatters;
  }
  if (provider.nextFix?.title && !providerTextMentionsOthers(provider.nextFix.title, provider.id)) {
    return provider.nextFix.title + ' for ' + name + '.';
  }
  const ready = launchPath.filter((item) => item.state === 'ready').length;
  const total = launchPath.length || 1;
  if (ready >= total && provider.state === 'live_verified') {
    return name + ' live proof is verified. Review the launch path before shipping.';
  }
  if (ready >= total) {
    return name + ' repo evidence looks complete. Finish dashboard proof and verify before launch.';
  }
  if (ready > 0) {
    return name + ' has partial repo evidence (' + ready + '/' + total + ' checks). Ask the agent for the next ' + name + ' step.';
  }
  return area + ' slot for ' + name + '. Drag into chat for a scoped production check.';
}

function providerDetail(provider) {
  return providerScopedDetail(provider);
}

function launchPathCheckState(item) {
  if (item.state === 'ready') return 'done';
  if (item.state === 'blocked' || item.state === 'needs_fix') return 'active';
  return 'pending';
}

function launchPathStatusText(item) {
  if (item.state === 'ready') return 'OK';
  if (item.state === 'blocked') return 'Blocked';
  if (item.state === 'needs_fix') return 'Needs fix';
  if (item.state === 'not_checked') return 'Not checked';
  return 'Pending';
}

function providerModalCheckRows(raw) {
  const launchPath = Array.isArray(raw?.launchPath) ? raw.launchPath : [];
  const proofChecks = raw?.cockpit?.proof?.checks || [];
  const rows = [];
  if (launchPath.length) {
    launchPath.forEach((item) => {
      rows.push({
        label: item.title,
        caption: item.shortReason || item.detail || 'Launch path check for ' + (raw?.name || 'provider') + '.',
        state: launchPathCheckState(item),
        status: launchPathStatusText(item),
      });
    });
  } else {
    const detected = raw?.state !== 'not_detected';
    rows.push({
      label: 'Repo evidence',
      caption: detected ? 'Code evidence found for ' + raw.name + '.' : raw.name + ' not detected in this project.',
      state: detected ? 'done' : 'pending',
      status: detected ? 'Found' : 'Missing',
    });
  }
  const liveCheck = proofChecks.find((item) => String(item.label || '').toLowerCase().includes('live'));
  const needsDashboard = raw?.state === 'requires_user_action' || raw?.state === 'connect_live' || liveCheck?.status === 'no' || liveCheck?.status === 'unknown';
  if (liveCheck || needsDashboard) {
    const liveOk = liveCheck?.status === 'yes';
    rows.push({
      label: 'Dashboard proof',
      caption: liveOk ? raw.name + ' live verification recorded.' : 'Open the ' + raw.name + ' dashboard for live setup steps.',
      state: liveOk ? 'done' : 'active',
      status: liveOk ? 'Verified' : 'Needed',
    });
  }
  const checks = providerChecks(raw || {});
  const parts = checks.split('/');
  const ready = Number(parts[0]) || 0;
  const total = Number(parts[1]) || 0;
  const allReady = total > 0 && ready === total;
  rows.push({
    label: 'Verification',
    caption: checks + ' launch checks ready for ' + (raw?.name || 'provider') + '.',
    state: allReady ? 'done' : ready > 0 ? 'active' : 'pending',
    status: checks,
  });
  return rows;
}

function providerHealth(raw, normalized) {
  const state = raw?.state || normalized?.state || 'not_detected';
  const checks = providerChecks(raw || normalized || {});
  const parts = checks.split('/');
  const ready = Number(parts[0]) || 0;
  const total = Number(parts[1]) || 0;
  const allReady = total > 0 && ready === total;
  const summary = providerScopedDetail(raw || normalized || {});
  if (state === 'not_detected') {
    return { label: 'Missing', tone: 'orange', summary, meta: 'Not linked' };
  }
  if (state === 'live_verified') {
    return { label: 'Ready', tone: 'green', summary, meta: checks + ' checks' };
  }
  if (state === 'needs_repo_fix' || state === 'blocked' || state === 'error') {
    return { label: 'Needs work', tone: 'orange', summary, meta: checks + ' checks' };
  }
  if (!allReady && total > 0) {
    return { label: 'Incomplete', tone: 'orange', summary, meta: checks + ' checks' };
  }
  if (state === 'requires_user_action' || state === 'connect_live') {
    return { label: 'Action needed', tone: 'orange', summary, meta: 'Dashboard' };
  }
  return { label: 'Detected', tone: 'green', summary, meta: checks + ' checks' };
}

function providerModalMascot(health) {
  if (health.tone === 'green' && health.label === 'Ready') return mascotAssets.verified;
  if (health.tone === 'orange' || health.label === 'Needs work' || health.label === 'Incomplete') return mascotAssets.alert;
  return mascotAssets.idle;
}

function providerHealthIcon(health) {
  if (health.tone === 'green' && (health.label === 'Ready' || health.label === 'Detected')) return Icon('heart');
  if (health.label === 'Missing') return Icon('flag');
  return Icon('refresh');
}

function providerMcp(provider) {
  return provider && provider.mcp ? provider.mcp : {
    status: 'disconnected',
    label: 'Connect MCP',
    connectCommand: 'Add this provider to your local MCP config, then drag it into chat.',
    capabilities: [],
  };
}

function providerMcpChip(provider) {
  const mcp = providerMcp(provider);
  const connected = mcp.status === 'connected';
  const label = connected ? 'MCP connected' : 'MCP not connected';
  return '<span class="vr-provider-mcp-chip ' + (connected ? 'is-connected' : 'is-disconnected') + '" title="' + escapeHtml(label) + '" aria-label="' + escapeHtml(label) + '">' +
    '<i></i><span>' + escapeHtml(label) + '</span>' +
    '</span>';
}

function providerAssetSrc(provider) {
  if (!provider) return providerAssets.supabase;
  return providerMarkAssets[provider.id] || providerAssets[provider.id] || providerAssets.supabase;
}

function ProviderToken(provider, extraClass) {
  const className = 'vr-provider-token' + (extraClass ? ' ' + extraClass : '');
  const iconHtml = provider && provider.iconHtml ? String(provider.iconHtml) : '';
  return '<span class="' + className + '">' + (iconHtml.trim() ? iconHtml : '<img src="' + providerAssetSrc(provider) + '" alt="" />') + '</span>';
}

function ProviderLogo(provider, className) {
  const iconHtml = provider && provider.iconHtml ? String(provider.iconHtml) : '';
  return iconHtml.trim()
    ? '<span class="' + className + ' is-logo-html">' + iconHtml + '</span>'
    : '<img class="' + className + '" src="' + providerAssetSrc(provider) + '" alt="" />';
}

function ProviderMcpPanel(provider) {
  const mcp = providerMcp(provider);
  const connected = mcp.status === 'connected';
  const capabilities = Array.isArray(mcp.capabilities) && mcp.capabilities.length ? mcp.capabilities : ['provider context', 'repo-aware chat'];
  return '<section class="vr-provider-mcp-panel ' + (connected ? 'is-connected' : 'is-disconnected') + '">' +
    '<header><span>' + Icon('agent') + '</span><div><strong>' + escapeHtml(connected ? 'MCP connected' : 'Connect MCP') + '</strong><em>' + escapeHtml(connected ? (mcp.source || 'local MCP config') : (mcp.connectCommand || 'Add this provider MCP server in your local MCP config.')) + '</em></div></header>' +
    '<div>' + capabilities.map((item) => '<small>' + escapeHtml(item) + '</small>').join('') + '</div>' +
    '</section>';
}

function normalizeProvider(provider) {
  const missing = provider.state === 'not_detected';
  return {
    id: provider.id,
    name: provider.name,
    area: provider.area,
    status: missing ? 'Missing' : (provider.statusText || 'Detected in repo'),
    tone: providerTone(provider.state, missing ? 'Missing' : provider.statusText),
    detail: missing ? 'Not linked — drag into chat or ask agent to connect' : providerDetail(provider),
    region: missing ? 'not linked' : 'local repo',
    lastSync: currentState.project && currentState.project.scannedAt ? 'scan artifact' : 'startup',
    checks: providerChecks(provider),
    state: provider.state || 'not_detected',
    mcp: provider.mcp || null,
    iconHtml: provider.iconHtml || '',
  };
}

const providers = Array.isArray(currentState.providers) && currentState.providers.length
  ? currentState.providers.map(normalizeProvider)
  : [];

let releases = Array.isArray(currentState.releases) && currentState.releases.length
  ? currentState.releases.map((release, index) => ({
      id: release.id || release.label || 'workspace',
      label: release.label || release.id || 'Workspace',
      meta: release.meta || (index === 0 ? 'current workspace' : 'local history'),
      branch: release.branch || 'local',
      tone: release.tone || (index === 0 ? 'current' : 'prod'),
      summary: release.summary || '',
    }))
  : [{ id: 'workspace', label: 'Workspace', meta: 'not released', branch: 'local', tone: 'current', summary: 'No release detected yet.' }];

function syncReleasesFromState(state) {
  if (!state || !Array.isArray(state.releases) || !state.releases.length) return;
  releases = state.releases.map((release, index) => ({
    id: release.id || release.label || 'workspace',
    label: release.label || release.id || 'Workspace',
    meta: release.meta || (index === 0 ? 'current workspace' : 'local history'),
    branch: release.branch || 'local',
    tone: release.tone || (index === 0 ? 'current' : 'prod'),
    summary: release.summary || '',
  }));
  if (!releases.some((item) => item.id === demo.selectedReleaseId)) {
    demo.selectedReleaseId = releases[0].id;
  }
}

function releaseComparePair() {
  const selectedIndex = releases.findIndex((item) => item.id === demo.selectedReleaseId);
  const toIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const fromIndex = toIndex + 1;
  if (fromIndex < releases.length) {
    return {
      from: releases[fromIndex].id,
      to: releases[toIndex].id,
      fromLabel: releases[fromIndex].label,
      toLabel: releases[toIndex].label,
    };
  }
  return { from: 'HEAD~1', to: 'HEAD', fromLabel: 'Previous commit', toLabel: 'HEAD' };
}

function rollbackTargetRef() {
  return releaseComparePair().from;
}

function formatDiffPreHtml(diffText) {
  const lines = String(diffText || '').split('\\n');
  return lines.map(function(line) {
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff ')) {
      return '<b>' + escapeHtml(line) + '</b>';
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      return '<span class="add">' + escapeHtml(line) + '</span>';
    }
    if (line.startsWith('-') && !line.startsWith('---')) {
      return '<span class="del">' + escapeHtml(line) + '</span>';
    }
    return escapeHtml(line);
  }).join('\\n');
}

function releaseChangelogHtml() {
  const log = demo.releaseChangelog || {};
  if (log.loading) return '<p>Loading changelog…</p>';
  if (log.error) return '<p class="vr-release-error">' + escapeHtml(log.error) + '</p>';
  if (Array.isArray(log.entries) && log.entries.length) {
    return '<ul class="vr-changelog-list">' + log.entries.map(function(entry) {
      return '<li><strong>' + escapeHtml(entry.short || entry.sha || '') + '</strong> ' + escapeHtml(entry.subject || '') + '<em>' + escapeHtml((entry.author || 'unknown') + ' · ' + (entry.when || '')) + '</em></li>';
    }).join('') + '</ul>';
  }
  return '<p>No commits between ' + escapeHtml(log.fromLabel || 'previous') + ' and ' + escapeHtml(log.toLabel || 'selected') + '.</p>';
}

async function runReleaseCompare() {
  const pair = releaseComparePair();
  demo.releaseDiff = {
    text: '',
    from: pair.from,
    to: pair.to,
    fromLabel: pair.fromLabel,
    toLabel: pair.toLabel,
    stats: null,
    loading: true,
    error: '',
  };
  demo.activeStudioTab = 'diff';
  render();
  try {
    const url = '/api/releases/compare?from=' + encodeURIComponent(pair.from) + '&to=' + encodeURIComponent(pair.to);
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Compare failed');
    demo.releaseDiff = {
      text: data.diff || '',
      from: data.from || pair.from,
      to: data.to || pair.to,
      fromLabel: data.fromLabel || pair.fromLabel,
      toLabel: data.toLabel || pair.toLabel,
      stats: data.stats || null,
      loading: false,
      error: '',
    };
    demo.notice = 'Compared ' + demo.releaseDiff.fromLabel + ' → ' + demo.releaseDiff.toLabel + '.';
  } catch (error) {
    demo.releaseDiff.loading = false;
    demo.releaseDiff.error = error instanceof Error ? error.message : String(error);
    demo.notice = demo.releaseDiff.error;
  }
  render();
}

async function runReleaseChangelog(openModal) {
  const pair = releaseComparePair();
  demo.releaseChangelog = {
    entries: [],
    from: pair.from,
    to: pair.to,
    fromLabel: pair.fromLabel,
    toLabel: pair.toLabel,
    loading: true,
    error: '',
  };
  if (openModal) demo.activeModal = 'release';
  render();
  try {
    const url = '/api/releases/changelog?from=' + encodeURIComponent(pair.from) + '&to=' + encodeURIComponent(pair.to);
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Changelog failed');
    demo.releaseChangelog = {
      entries: Array.isArray(data.entries) ? data.entries : [],
      from: data.from || pair.from,
      to: data.to || pair.to,
      fromLabel: data.fromLabel || pair.fromLabel,
      toLabel: data.toLabel || pair.toLabel,
      loading: false,
      error: '',
    };
    demo.notice = demo.releaseChangelog.entries.length
      ? demo.releaseChangelog.entries.length + ' commits between ' + demo.releaseChangelog.fromLabel + ' and ' + demo.releaseChangelog.toLabel + '.'
      : 'No commits between ' + demo.releaseChangelog.fromLabel + ' and ' + demo.releaseChangelog.toLabel + '.';
  } catch (error) {
    demo.releaseChangelog.loading = false;
    demo.releaseChangelog.error = error instanceof Error ? error.message : String(error);
    demo.notice = demo.releaseChangelog.error;
  }
  render();
}

async function runReleaseRollback() {
  const target = rollbackTargetRef();
  const targetLabel = releases.find((item) => item.id === target)?.label || target;
  const confirmed = window.confirm('Check out ' + targetLabel + ' locally? Git will move to a detached HEAD at that release.');
  if (!confirmed) {
    demo.notice = 'Rollback cancelled.';
    render();
    return;
  }
  demo.notice = 'Rolling back to ' + targetLabel + '…';
  render();
  try {
    const response = await fetch('/api/releases/rollback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Rollback failed');
    syncReleasesFromState(data);
    demo.selectedReleaseId = target;
    demo.activeModal = null;
    demo.notice = (data.rollback && data.rollback.message) || ('Checked out ' + targetLabel + '.');
  } catch (error) {
    demo.notice = error instanceof Error ? error.message : String(error);
  }
  render();
}

demo.selectedProviderId = currentState.selectedProviderId || (providers[0] && providers[0].id) || 'supabase';
demo.selectedReleaseId = (releases[0] && releases[0].id) || 'workspace';

let cliAgents = [
  { id: 'codex', label: 'Codex CLI', caption: 'Connect OpenAI agent', tone: 'green', connected: false, setup: { installCommand: 'npm install -g @openai/codex', signInCommand: 'codex login', verifyCommand: 'codex --version', docsUrl: 'https://github.com/openai/codex' } },
  { id: 'claude', label: 'Claude Code', caption: 'Connect Anthropic agent', tone: 'purple', connected: false, setup: { installCommand: 'npm install -g @anthropic-ai/claude-code', signInCommand: 'claude', verifyCommand: 'claude --version', docsUrl: 'https://docs.anthropic.com/en/docs/claude-code/overview' } },
  { id: 'gemini', label: 'Gemini CLI', caption: 'Connect Google agent', tone: 'blue', connected: false, setup: { installCommand: 'npm install -g @google/gemini-cli', signInCommand: 'gemini', verifyCommand: 'gemini --version', docsUrl: 'https://github.com/google-gemini/gemini-cli' } },
  { id: 'terminal', label: 'Terminal', caption: 'Open local shell', tone: 'orange', connected: true, setup: { installCommand: '', signInCommand: '', verifyCommand: '', docsUrl: 'https://viberaven.dev' } },
];

let cliModels = {
  codex: ['GPT-5.5', 'GPT-5.4', 'GPT-5.4-Mini', 'GPT-5.3-Codex-Spark'],
  claude: ['Claude 3.5 Sonnet', 'Claude Opus', 'Claude Haiku'],
  gemini: ['Gemini 2.5 Pro', 'Gemini 2.5 Flash', 'Gemini CLI Fast'],
  terminal: ['Local shell', 'PowerShell', 'Node task runner'],
};

const reasoningLevels = ['Low', 'Medium', 'High', 'Extra High'];
const contextLevels = ['Production', 'Provider', 'Release', 'Security'];
const accessModes = [
  { id: 'ask', label: 'Ask approval', description: 'Confirm edits and external access' },
  { id: 'approve', label: 'Approve for me', description: 'Run safe repo actions automatically' },
  { id: 'full', label: 'Full access', description: 'Unrestricted local project access' },
];
const topStages = [
  { id: 'provider', number: '1', label: 'Provider Proof', state: 'Waiting' },
  { id: 'agent', number: '2', label: 'Agent Fix', state: 'Ready' },
  { id: 'verify', number: '3', label: 'Verify', state: 'Waiting' },
  { id: 'clear', number: '4', label: 'Clear', state: 'Waiting' },
];

const stackSlots = {
  supabase: 'Database',
  vercel: 'Cloud',
  stripe: 'Payments',
  github: 'Version',
  sentry: 'Monitoring',
  posthog: 'Analytics',
  clerk: 'Auth',
  authjs: 'Auth',
  resend: 'Email',
  upstash: 'Cache',
};

const providerBoardOrder = ['supabase', 'clerk', 'authjs', 'vercel', 'stripe', 'sentry', 'resend', 'posthog', 'upstash', 'github'];

function visibleBoardProviders() {
  const authProviders = providers.filter((provider) => provider.id === 'clerk' || provider.id === 'authjs');
  if (authProviders.length <= 1) return providers;
  const detectedAuth = authProviders.find((provider) => provider.state !== 'not_detected');
  const visibleAuth = detectedAuth || authProviders.find((provider) => provider.id === 'clerk') || authProviders[0];
  return providers.filter((provider) => provider.id !== 'clerk' && provider.id !== 'authjs').concat(visibleAuth);
}

function orderedProviders() {
  const visible = visibleBoardProviders();
  const ordered = providerBoardOrder
    .map((id) => visible.find((provider) => provider.id === id))
    .filter(Boolean);
  return ordered.concat(visible.filter((provider) => !providerBoardOrder.includes(provider.id)));
}

const RECENT_CHATS_KEY_PREFIX = 'viberaven-recent-chats-v1';
const RECENT_CHATS_MAX = 8;
const RECENT_MESSAGES_MAX = 80;
const RECENT_MESSAGE_TEXT_MAX = 6000;

let recentChats = [];

function projectPathHash(path) {
  const normalized = String(path || 'default').toLowerCase();
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function recentChatsStorageKey() {
  const path = currentState && currentState.project && currentState.project.path;
  return RECENT_CHATS_KEY_PREFIX + '-' + projectPathHash(path);
}

function serializeChatMessages(messages) {
  const list = Array.isArray(messages) ? messages : [];
  return list.slice(-RECENT_MESSAGES_MAX).map((item) => ({
    role: item.role,
    text: String(item.text || '').slice(0, RECENT_MESSAGE_TEXT_MAX),
    kind: item.kind || null,
    isError: Boolean(item.isError),
    providerId: item.providerId || null,
    releaseId: item.releaseId || null,
    cards: item.cards || null,
    ts: item.ts || null,
  }));
}

function recentChatTitle(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return 'Mission chat';
  return trimmed.length > 38 ? trimmed.slice(0, 35).trim() + '...' : trimmed;
}

function recentChatCaption(provider, release, chat) {
  if (provider) return (stackSlots[provider.id] || provider.area) + ' / ' + provider.name;
  if (release) return 'Release / ' + release.label;
  if (chat && chat.context) return chat.context;
  return 'Production';
}

function buildRecentChatEntry(prompt, provider, release, chat, existing) {
  const lane = chat || chatContext(0);
  const base = existing || {};
  return {
    id: base.id || ('chat-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7)),
    title: base.title || recentChatTitle(prompt),
    caption: base.caption || recentChatCaption(provider, release, lane),
    time: base.time || 'Just now',
    providerId: lane.providerId ?? provider?.id ?? base.providerId ?? null,
    releaseId: lane.releaseId ?? release?.id ?? base.releaseId ?? null,
    cliId: lane.cliId || base.cliId || demo.selectedCliId || 'codex',
    modelId: lane.modelId || base.modelId || demo.selectedModelId || 'gpt-5.5',
    reasoning: lane.reasoning || base.reasoning || demo.selectedReasoning || 'High',
    context: lane.context || base.context || demo.selectedContext || 'Production',
    accessMode: lane.accessMode || base.accessMode || demo.selectedAccessMode || 'approve',
    messages: serializeChatMessages(lane.messages),
  };
}

function loadRecentChats() {
  try {
    const raw = localStorage.getItem(recentChatsStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    recentChats = Array.isArray(parsed) ? parsed : [];
  } catch {
    recentChats = [];
  }
}

function saveRecentChats() {
  try {
    localStorage.setItem(recentChatsStorageKey(), JSON.stringify(recentChats));
  } catch {
    // Ignore storage failures in preview shells.
  }
}

function syncDemoFromChatContext(context) {
  demo.selectedCliId = context.cliId;
  demo.selectedModelId = context.modelId;
  demo.selectedReasoning = context.reasoning;
  demo.selectedContext = context.context;
  demo.selectedAccessMode = context.accessMode || 'approve';
  if (context.providerId) demo.selectedProviderId = context.providerId;
  if (context.releaseId) demo.selectedReleaseId = context.releaseId;
  syncPrimaryContext();
}

function restoreRecentChat(recent) {
  if (!recent) return defaultChatContext({});
  return defaultChatContext({
    providerId: recent.providerId || null,
    releaseId: recent.releaseId || null,
    cliId: recent.cliId,
    modelId: recent.modelId,
    reasoning: recent.reasoning,
    context: recent.context,
    accessMode: recent.accessMode,
    messages: recent.messages || [],
    draft: '',
    activeTask: null,
  });
}

function updateActiveRecentChatSnapshot() {
  if (!demo.activeRecentChatId) return;
  const index = recentChats.findIndex((chat) => chat.id === demo.activeRecentChatId);
  if (index < 0) return;
  const lane0 = chatContext(0);
  if (!lane0.messages.length) return;
  const existing = recentChats[index];
  const firstUser = lane0.messages.find((item) => item.role === 'user');
  recentChats[index] = buildRecentChatEntry(
    firstUser?.text || existing.title,
    providers.find((item) => item.id === lane0.providerId),
    releases.find((item) => item.id === lane0.releaseId),
    lane0,
    existing
  );
  saveRecentChats();
}

function persistCurrentChatToRecent() {
  const lane0 = chatContext(0);
  if (!lane0.messages.length) return;
  const firstUser = lane0.messages.find((item) => item.role === 'user');
  const prompt = firstUser?.text || lane0.messages[0]?.text || '';
  const provider = providers.find((item) => item.id === lane0.providerId);
  const release = releases.find((item) => item.id === lane0.releaseId);
  if (demo.activeRecentChatId) {
    const index = recentChats.findIndex((chat) => chat.id === demo.activeRecentChatId);
    if (index >= 0) {
      recentChats[index] = buildRecentChatEntry(prompt, provider, release, lane0, recentChats[index]);
      saveRecentChats();
      return;
    }
  }
  const entry = buildRecentChatEntry(prompt, provider, release, lane0);
  recentChats = [entry].concat(recentChats).slice(0, RECENT_CHATS_MAX);
  saveRecentChats();
}

function rememberRecentChat(prompt, provider, release, chat) {
  const text = String(prompt || '').trim();
  if (!text) return;
  const lane0 = chat || chatContext(0);
  if (demo.activeRecentChatId) {
    const index = recentChats.findIndex((item) => item.id === demo.activeRecentChatId);
    if (index >= 0) {
      recentChats[index] = buildRecentChatEntry(text, provider, release, lane0, recentChats[index]);
      saveRecentChats();
      return;
    }
  }
  const entry = buildRecentChatEntry(text, provider, release, lane0);
  recentChats = [entry].concat(recentChats).slice(0, RECENT_CHATS_MAX);
  demo.activeRecentChatId = entry.id;
  saveRecentChats();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function projectName() {
  const name = String(currentState.project && currentState.project.name || '').trim();
  return !name || name.toLowerCase() === 'project' ? 'acme-vibe-app' : name;
}

function StatusBadge(label, tone) {
  return '<span class="vr-status-badge" data-tone="' + escapeHtml(tone) + '">' + escapeHtml(label) + '</span>';
}

function compactNumber(value) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);
}

function GitHubStats() {
  if (githubStats.loaded) {
    return '<a class="vr-github-stat-row" href="' + publicGithubUrl + '" target="_blank" rel="noreferrer" aria-label="Open public GitHub repo stats">' +
      '<span><b>' + compactNumber(githubStats.stars) + '</b><em>stars</em></span>' +
      '<span><b>' + compactNumber(githubStats.forks) + '</b><em>forks</em></span>' +
      '<span><b>' + compactNumber(githubStats.issues) + '</b><em>issues</em></span>' +
      '</a><small>Live from the public GitHub repo</small>';
  }
  if (githubStats.error) {
    return '<a class="vr-github-stat-row" href="' + publicGithubUrl + '" target="_blank" rel="noreferrer" aria-label="Open public GitHub repo">' +
      '<span><b>Public</b><em>repo</em></span>' +
      '<span><b>Open</b><em>source</em></span>' +
      '<span><b>GitHub</b><em>link</em></span>' +
      '</a><small>Stats unavailable; repo link still opens GitHub</small>';
  }
  return '<a class="vr-github-stat-row is-loading" href="' + publicGithubUrl + '" target="_blank" rel="noreferrer" aria-label="Open public GitHub repo while stats load">' +
    '<span><b>...</b><em>stars</em></span>' +
    '<span><b>...</b><em>forks</em></span>' +
    '<span><b>...</b><em>issues</em></span>' +
    '</a><small>Loading public GitHub stats</small>';
}

function agentPromptText() {
  const provider = providers.find((item) => item.id === demo.selectedProviderId) || providers[0];
  return [
    'You are fixing one VibeRaven launch-readiness gap.',
    '',
    'Project: ' + projectName(),
    'Focus: ' + provider.name + ' ' + provider.area,
    'Stage: ' + (demo.activeStepId || 'agent'),
    '',
    'Goal:',
    '- Find the smallest repo-side fix that improves launch readiness.',
    '- Do not claim provider dashboard work from code alone.',
    '- Keep the change scoped and verify through the VibeRaven UI action.',
    '',
    'Return:',
    '- What changed',
    '- What still needs user/provider action',
    '- What to verify next'
  ].join('\\n');
}

async function copyText(value) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the textarea path for browsers without clipboard permission.
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

function setDragUi(kind) {
  if (!app) return;
  app.classList.toggle('is-dragging', Boolean(kind));
  app.classList.toggle('is-dragging-provider', kind === 'provider');
  app.classList.toggle('is-dragging-release', kind === 'release');
  app.classList.toggle('is-dragging-chat', kind === 'chat');
  if (kind) app.setAttribute('data-drag-kind', kind);
  else app.removeAttribute('data-drag-kind');
}

function setDragChip(event, label, detail, markHtml) {
  if (!event.dataTransfer || typeof event.dataTransfer.setDragImage !== 'function') return;
  const chip = document.createElement('div');
  chip.className = 'vr-drag-chip';
  chip.innerHTML = '<span class="vr-drag-chip-mark">' + (markHtml || '<i></i>') + '</span><div><strong>' + escapeHtml(label) + '</strong><span>' + escapeHtml(detail) + '</span></div>';
  document.body.appendChild(chip);
  event.dataTransfer.setDragImage(chip, 24, 24);
  window.setTimeout(() => chip.remove(), 0);
}

function GlowButton(label, options) {
  const opts = options || {};
  return '<button class="vr-glow-button" data-tone="' + escapeHtml(opts.tone || 'purple') + '" type="button" ' +
    (opts.id ? 'id="' + escapeHtml(opts.id) + '" ' : '') +
    (opts.action ? 'data-action="' + escapeHtml(opts.action) + '" ' : '') +
    (opts.dataCliAgent ? 'data-cli-agent="' + escapeHtml(opts.dataCliAgent) + '" ' : '') +
    '><span>' + escapeHtml(label) + '</span><i aria-hidden="true"></i></button>';
}

function Icon(name) {
  const paths = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z"/>',
    cube: '<path d="m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z"/><path d="M4 6.5 12 11l8-4.5M12 22V11"/>',
    agent: '<path d="M12 3l2.4 4.8L20 10l-5.6 2.2L12 17l-2.4-4.8L4 10l5.6-2.2L12 3Z"/>',
    doc: '<path d="M7 3h7l4 4v14H7V3Z"/><path d="M14 3v5h5M9 12h6M9 16h6"/>',
    branch: '<path d="M7 7v7a3 3 0 0 0 3 3h7"/><circle cx="7" cy="5" r="3"/><circle cx="17" cy="17" r="3"/><path d="M14 7h3v3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
    people: '<path d="M16 11a4 4 0 1 0-8 0"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M19 8a3 3 0 0 1 2 5"/>',
    report: '<path d="M5 4h14v16H5V4Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    bell: '<path d="M18 16H6l2-2v-4a4 4 0 1 1 8 0v4l2 2Z"/><path d="M10 19h4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.5 1.2c0 2-2.3 2.1-2.3 4"/><path d="M12 18h.01"/>',
    repo: '<path d="M4 6h6l2 2h8v10H4V6Z"/><path d="M4 10h16"/>',
    shield: '<path d="M12 3 20 6v6c0 5-3.2 8-8 9-4.8-1-8-4-8-9V6l8-3Z"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    check: '<path d="m5 12 4 4 10-10"/>',
    flag: '<path d="M6 21V4h11l-2 4 2 4H6"/>',
    guide: '<path d="M4 6h7a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H4V6Z"/><path d="M14 9a3 3 0 0 1 3-3h3v11h-3a3 3 0 0 0-3 3V9Z"/>',
    shell: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 9 10 12 7 15"/><path d="M13 15h4"/>',
    refresh: '<path d="M20 12a8 8 0 0 1-14.5 4.7"/><path d="M4 17h5v-5"/><path d="M4 12A8 8 0 0 1 18.5 7.3"/><path d="M20 7h-5v5"/>',
    prompt: '<path d="M4 5h16v14H4V5Z"/><path d="m8 10 3 2-3 2M13 15h4"/>',
    external: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/><path d="M5 5v14h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cloud: '<path d="M17.5 18H8a5 5 0 1 1 1.3-9.8A6 6 0 0 1 20 12.5 3.5 3.5 0 0 1 17.5 18Z"/>',
    heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    play: '<path d="M8 5v14l11-7-11-7Z"/>',
    code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
    arrowUp: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2.5"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
  };
  return '<i data-icon="' + escapeHtml(name) + '" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || paths.spark) + '</svg></i>';
}

function contextIconChip(iconName, size) {
  const cls = size === 'input' ? 'vr-context-icon-chip is-input' : 'vr-context-icon-chip';
  return '<span class="' + cls + '">' + Icon(iconName) + '</span>';
}

function BrandMark(id) {
  if (id === 'github') {
    return '<span class="vr-inline-brand-mark is-github"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.86 9.71.5.1.69-.22.69-.49 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.17-1.11-1.48-1.11-1.48-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.56 2.36 1.11 2.94.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.6.7.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"/></svg></span>';
  }
  return '<span class="vr-inline-brand-mark"><img src="' + escapeHtml(providerMarkAssets[id] || providerAssets[id]) + '" alt="" /></span>';
}

function mascotUrl() {
  if (demo.verified) return mascotAssets.verified;
  if (demo.agentFixing) return mascotAssets.fixing;
  if (demo.activeStepId === 'repo') return mascotAssets.alert;
  return mascotAssets.idle;
}

function selectedProvider() {
  return providers.find((item) => item.id === demo.selectedProviderId) || providers[0];
}

function defaultChatContext(seed) {
  const source = seed || {};
  const cliId = source.cliId || demo.selectedCliId || 'codex';
  const models = cliModels[cliId] || cliModels.codex;
  return {
    providerId: source.providerId || null,
    releaseId: source.releaseId || null,
    cliId,
    modelId: source.modelId || demo.selectedModelId || normalizeModelId(models[0]),
    reasoning: source.reasoning || demo.selectedReasoning || 'High',
    context: source.context || demo.selectedContext || 'Production',
    accessMode: source.accessMode || demo.selectedAccessMode || 'approve',
    draft: source.draft || '',
    messages: Array.isArray(source.messages) ? source.messages.slice() : [],
    activeTask: source.activeTask || null,
  };
}

function clearChatTaskTimer() {
  if (chatTaskTimer) window.clearTimeout(chatTaskTimer);
  chatTaskTimer = null;
}

function laneHasActiveTask(chat) {
  return Boolean(chat && chat.activeTask && chat.activeTask.phase === 'working');
}

function chatContext(index) {
  const safeIndex = Math.max(0, Number(index) || 0);
  while (!demo.chatContexts[safeIndex]) {
    const parent = demo.chatContexts[demo.chatContexts.length - 1];
    demo.chatContexts.push(defaultChatContext({
      ...parent,
      messages: [],
      activeTask: null,
      draft: '',
    }));
  }
  const context = demo.chatContexts[safeIndex];
  const hydrated = defaultChatContext(context);
  Object.assign(context, hydrated);
  return context;
}

function syncPrimaryContext() {
  const context = chatContext(0);
  demo.droppedProviderId = context.providerId;
  demo.droppedReleaseId = context.releaseId;
}

function truncateMissionLabel(text, max) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return '';
  return trimmed.length <= max ? trimmed : trimmed.slice(0, Math.max(0, max - 1)).trim() + '…';
}

function compactQuickLabel(text, max) {
  return truncateMissionLabel(String(text || '').trim(), max || 14);
}

function compactBlockerLabel(blocker) {
  if (!blocker) return 'Agent fix';
  const category = String(blocker.category || '').trim();
  if (category && category !== 'Quality') return category;
  const title = String(blocker.title || '').trim();
  const keywords = [
    ['monitoring', 'Monitor'],
    ['sentry', 'Sentry'],
    ['webhook', 'Webhook'],
    ['rls', 'RLS'],
    ['supabase', 'Supabase'],
    ['vercel', 'Vercel'],
    ['stripe', 'Billing'],
    ['billing', 'Billing'],
    ['auth', 'Auth'],
    ['secret', 'Secrets'],
    ['env', 'Env vars'],
    ['deploy', 'Deploy'],
    ['error', 'Errors'],
  ];
  const lower = title.toLowerCase();
  for (let i = 0; i < keywords.length; i++) {
    if (lower.includes(keywords[i][0])) return keywords[i][1];
  }
  return compactQuickLabel(title, 14);
}

function compactProviderLabel(provider, missingProvider) {
  if (!provider) return 'Provider';
  if (missingProvider) return 'Connect';
  return compactQuickLabel(provider.name, 12);
}

function rawProviderRecord(providerId) {
  const list = Array.isArray(currentState.providers) ? currentState.providers : [];
  return list.find((item) => item.id === providerId) || null;
}

function formatBlockerLines(blockers, limit) {
  return (Array.isArray(blockers) ? blockers : []).slice(0, limit).map((item, index) =>
    String(index + 1) + '. [' + (item.category || 'Quality') + '] ' + item.title + (item.detail ? ' — ' + item.detail : '')
  ).join('\\n');
}

function formatPlanLines(steps, limit) {
  return (Array.isArray(steps) ? steps : []).slice(0, limit).map((step, index) =>
    String(index + 1) + '. [' + (step.category || 'Quality') + '] ' + step.title + (step.requiresUserAction ? ' (dashboard/user action)' : ' (repo)')
  ).join('\\n');
}

function resolveQuickActionMission(kind, chatIndex, promptOverride) {
  const override = String(promptOverride || '').trim();
  const chat = chatContext(chatIndex);
  const cards = missionCards || { blockers: [], planSteps: [], connectProviders: [], summary: '' };
  const mc = currentState.missionControl || {};
  const gate = currentState.gate || {};
  const providerId = chat.providerId || demo.selectedProviderId;
  const provider = providers.find((item) => item.id === providerId) || selectedProvider();
  const raw = rawProviderRecord(provider.id);
  const slot = stackSlots[provider.id] || provider.area;
  const release = releases.find((item) => item.id === (chat.releaseId || demo.selectedReleaseId));
  const blockers = Array.isArray(cards.blockers) ? cards.blockers : [];
  const planSteps = Array.isArray(cards.planSteps) ? cards.planSteps : [];
  const connectProviders = Array.isArray(cards.connectProviders) ? cards.connectProviders : [];
  const topBlocker = blockers[0];
  const gateClear = gate.status === 'clear';
  const gateLabel = gate.label || 'Waiting for project evidence';
  const mainBlocker = mc.mainBlocker || topBlocker?.title || 'Run a scan to find launch blockers';
  const blockerText = formatBlockerLines(blockers, 6);
  const planText = formatPlanLines(planSteps, 8);
  const connectText = connectProviders.slice(0, 5).map((item) => '- ' + item.name + ' (' + item.status + ')').join('\\n');
  const nextFix = raw && raw.nextFix ? raw.nextFix : null;
  const missingProvider = provider.state === 'not_detected';

  const missions = {
    analyze: {
      title: 'Analyzing launch blockers',
      label: blockers.length ? 'Analyze ' + blockers.length + ' blocker' + (blockers.length === 1 ? '' : 's') : 'Analyze launch readiness',
      prompt: [
        'Analyze production launch readiness in this project folder.',
        '',
        'Project status: ' + gateLabel + ' (' + (gate.status || 'unknown') + ')',
        'Main blocker: ' + mainBlocker,
        blockers.length ? 'Known blockers from the latest scan:\\n' + blockerText : 'No blockers loaded yet — inspect .viberaven/gate-result.json and agent-tasklist.md if present.',
        connectText ? '\\nProviders needing connect:\\n' + connectText : '',
        '',
        'Instructions:',
        '- Inspect real files in this repo; do not dump CLI install manuals.',
        '- Summarize blockers with evidence paths and severity.',
        '- Recommend the smallest safe next fix and whether to run verify after.',
      ].filter(Boolean).join('\\n'),
      line: 'Reading repo evidence, provider proof, and release context.',
      steps: ['Scan evidence', 'Rank risks', 'Prepare fix plan'],
      notice: blockers.length ? 'Analyzing ' + blockers.length + ' launch blocker' + (blockers.length === 1 ? '' : 's') + '.' : 'Analyzing launch readiness.',
    },
    plan: {
      title: 'Building fix plan',
      label: planSteps.length ? 'Fix plan · ' + planSteps.length + ' action' + (planSteps.length === 1 ? '' : 's') : 'Build fix plan',
      prompt: [
        'Build a safe, ordered fix plan for this launch.',
        '',
        'Project status: ' + gateLabel,
        'Main blocker: ' + mainBlocker,
        blockers.length ? 'Blockers (' + blockers.length + '):\\n' + blockerText : 'No scan blockers loaded — inspect .viberaven artifacts first.',
        planSteps.length ? '\\nSuggested steps from scan:\\n' + planText : '',
        connectText ? '\\nProviders to connect:\\n' + connectText : '',
        '',
        'If the first repo-code step is clear, apply that fix in code before listing the rest.',
        'For each remaining step specify: repo edit vs dashboard/user action, owner (agent vs user), and how to verify.',
        'Keep steps executable in order. Prefer minimal diffs and one gap at a time.',
        'Do not paste generic VibeRaven operator manuals.',
      ].filter(Boolean).join('\\n'),
      line: 'Turning blockers into a short sequence the connected agent can execute.',
      steps: ['Group blockers', 'Scope changes', 'Choose verify'],
      notice: planSteps.length ? 'Fix plan mission started (' + planSteps.length + ' steps from scan).' : 'Fix plan mission started.',
    },
    fix: {
      title: 'Applying scoped fix',
      label: topBlocker ? 'Agent fix · ' + truncateMissionLabel(topBlocker.title, 34) : 'Apply next repo fix',
      prompt: [
        'Apply ONE scoped repo fix for the highest-priority launch blocker.',
        '',
        topBlocker ? 'Target blocker: ' + topBlocker.title : 'Target: ' + mainBlocker,
        topBlocker?.detail ? 'Detail: ' + topBlocker.detail : '',
        topBlocker?.id ? 'Gap id: ' + topBlocker.id : '',
        'Provider scope: ' + provider.name + ' / ' + slot,
        nextFix?.whatToChange ? 'Suggested change: ' + nextFix.whatToChange : '',
        nextFix?.prompt ? 'Repair prompt hint: ' + nextFix.prompt : '',
        '',
        'Rules:',
        '- Read existing code, then edit files in this repo. Do not reply with a manual checklist when code changes are possible.',
        '- Change only what this blocker requires.',
        '- Do not claim provider dashboard setup is complete from repo edits alone.',
        '- After edits, list files touched and recommend verify.',
      ].filter(Boolean).join('\\n'),
      line: 'Patching only the selected production gap, then preparing verification.',
      steps: ['Patch code', 'Update proof', 'Prepare verify'],
      notice: topBlocker ? 'Agent fix started for: ' + truncateMissionLabel(topBlocker.title, 48) + '.' : 'Agent fix mission started.',
    },
    verify: {
      title: 'Running verification',
      label: gateClear ? 'Re-verify readiness' : 'Verify readiness',
      prompt: [
        'Verify production launch readiness for this project.',
        '',
        'Project status: ' + gateLabel + ' (' + (gate.status || 'unknown') + ')',
        'Main blocker: ' + mainBlocker,
        blockers.length ? 'Open blockers:\\n' + blockerText : '',
        '',
        'Instructions:',
        '- Prefer running npx -y viberaven --verify when available, or inspect .viberaven/gate-result.json and agent-tasklist.md.',
        '- Report what passed, what still blocks, and any provider dashboard steps remaining.',
        '- Do not mark the gate clear unless evidence supports it.',
      ].filter(Boolean).join('\\n'),
      line: 'Checking evidence, provider state, and release readiness.',
      steps: ['Run checks', 'Read proof', 'Mark status'],
      notice: gateClear ? 'Re-verifying launch proof.' : 'Running production readiness verification.',
    },
    diff: {
      title: 'Reviewing diff',
      label: 'Review production diff',
      prompt: [
        'Review the current production diff for this project.',
        '',
        'Project status: ' + gateLabel,
        topBlocker ? 'Top blocker context: ' + topBlocker.title : '',
        '',
        'Show grouped changes, flag risky edits, and say what still needs verify before release.',
      ].filter(Boolean).join('\\n'),
      line: 'Opening the scoped launch diff without leaving the mission chat.',
      steps: ['Read diff', 'Group changes', 'Flag risk'],
      notice: 'Diff review mission started.',
    },
    explain: {
      title: 'Explaining changes',
      label: 'Explain changes & next steps',
      prompt: [
        'Explain recent production changes and what to verify next.',
        '',
        'Project status: ' + gateLabel,
        mainBlocker ? 'Main blocker: ' + mainBlocker : '',
        blockers.length ? 'Active blockers:\\n' + blockerText : '',
        '',
        'Summarize what changed, remaining proof gaps, and the next safe action.',
      ].filter(Boolean).join('\\n'),
      line: 'Summarizing the fix, remaining proof, and next action.',
      steps: ['Summarize fix', 'List proof', 'Next action'],
      notice: 'Explain changes mission started.',
    },
    provider: {
      title: missingProvider ? 'Connecting ' + provider.name : 'Checking ' + provider.name + ' proof',
      label: missingProvider ? 'Connect ' + provider.name : provider.name + ' proof check',
      prompt: missingProvider
        ? [
            'Help connect ' + provider.name + ' for production launch.',
            '',
            'Provider status: Missing (not linked in repo evidence)',
            connectText ? 'Other providers needing connect:\\n' + connectText : '',
            raw?.cockpit?.action?.whereToClick ? 'Dashboard path: ' + raw.cockpit.action.whereToClick : '',
            nextFix?.whatToChange ? 'What to change: ' + nextFix.whatToChange : '',
            '',
            'Return an env checklist, dashboard steps, and repo evidence gaps. Do not claim connected without proof.',
          ].filter(Boolean).join('\\n')
        : [
            'Check ' + provider.name + ' (' + slot + ') production proof.',
            '',
            'Provider status: ' + (provider.status || provider.state || 'unknown'),
            mainBlocker ? 'Launch blocker context: ' + mainBlocker : '',
            nextFix?.whyItMatters ? 'Why it matters: ' + nextFix.whyItMatters : '',
            raw?.cockpit?.proof?.summary ? 'Proof summary: ' + raw.cockpit.proof.summary : '',
            raw?.cockpit?.action?.whereToClick ? 'Dashboard path: ' + raw.cockpit.action.whereToClick : '',
            '',
            'Inspect repo evidence, list missing proof, and give the next safe action (repo vs dashboard).',
          ].filter(Boolean).join('\\n'),
      line: missingProvider
        ? 'Preparing honest connect steps for ' + provider.name + '.'
        : 'Inspecting ' + slot + ' slot status, dashboard action, and verification proof.',
      steps: missingProvider ? ['Check repo', 'List env', 'Dashboard steps'] : ['Read provider', 'Check proof', 'Attach context'],
      notice: missingProvider ? provider.name + ' connect mission started.' : provider.name + ' proof check started.',
    },
  };

  const mission = missions[kind] || missions.analyze;
  if (override) {
    if (kind === 'fix' && override.indexOf('\\n') < 0) {
      return {
        title: mission.title,
        label: 'Agent fix · ' + truncateMissionLabel(override, 34),
        prompt: [
          'Apply ONE scoped repo fix for this launch step.',
          '',
          'Target step: ' + override,
          'Provider scope: ' + provider.name + ' / ' + slot,
          topBlocker?.id ? 'Related gap id: ' + topBlocker.id : '',
          nextFix?.whatToChange ? 'Suggested change: ' + nextFix.whatToChange : '',
          '',
          'Read existing code, edit only what this step requires, then list files touched and recommend verify.',
        ].filter(Boolean).join('\\n'),
        line: mission.line,
        steps: mission.steps,
        notice: 'Agent fix started for: ' + truncateMissionLabel(override, 48) + '.',
      };
    }
    return {
      title: mission.title,
      label: truncateMissionLabel(override, 120),
      prompt: override,
      line: mission.line,
      steps: mission.steps,
      notice: mission.notice,
    };
  }
  return mission;
}

function taskMeta(kind, chatIndex) {
  const index = Number.isFinite(chatIndex) ? chatIndex : (demo.pickerChatIndex || 0);
  const mission = resolveQuickActionMission(kind, index);
  return {
    title: mission.title,
    prompt: mission.prompt,
    line: mission.line,
    steps: mission.steps,
    notice: mission.notice,
  };
}

function quickActionButtonSpec(index) {
  const chat = chatContext(index);
  const cards = missionCards || { blockers: [], planSteps: [] };
  const blockers = Array.isArray(cards.blockers) ? cards.blockers : [];
  const planSteps = Array.isArray(cards.planSteps) ? cards.planSteps : [];
  const topBlocker = blockers[0];
  const provider = chat.providerId
    ? providers.find((item) => item.id === chat.providerId)
    : providers.find((item) => item.id === demo.selectedProviderId) || providers[0];
  const missingProvider = provider && provider.state === 'not_detected';
  const gateClear = currentState.gate && currentState.gate.status === 'clear';
  return [
    {
      action: 'plan',
      icon: 'report',
      label: planSteps.length ? 'Plan · ' + planSteps.length : 'Plan',
      hint: planSteps.length ? 'Build fix plan · ' + planSteps.length + ' actions' : 'Build fix plan',
      primary: true,
    },
    {
      action: 'start-agent-fix',
      icon: 'agent',
      label: compactBlockerLabel(topBlocker),
      hint: topBlocker?.title || 'Apply next repo fix',
      primary: true,
      muted: !topBlocker,
    },
    {
      action: 'verify-now',
      icon: 'shield',
      label: gateClear ? 'Re-verify' : 'Verify',
      hint: gateClear ? 'Re-verify readiness' : 'Verify readiness',
      primary: true,
    },
    {
      action: 'provider-proof',
      icon: 'cube',
      label: compactProviderLabel(provider, missingProvider),
      hint: missingProvider ? 'Connect ' + (provider?.name || 'provider') : 'Check ' + (provider?.name || 'provider') + ' proof',
      primary: false,
    },
    { action: 'show-diff', icon: 'code', label: 'Diff', hint: 'Review code diff', primary: false, muted: true },
    { action: 'explain-changes', icon: 'prompt', label: 'Explain', hint: 'Explain recent changes', primary: false, muted: true },
  ];
}

function runChatTask(kind, promptOverride) {
  clearChatTaskTimer();
  const chatIndex = Math.max(0, Math.min(demo.pickerChatIndex || 0, demo.activeChatCount - 1));
  const chat = chatContext(chatIndex);
  const mission = resolveQuickActionMission(kind, chatIndex, promptOverride);
  const meta = taskMeta(kind, chatIndex);
  const attachedProviderId = chat.providerId || null;
  const attachedReleaseId = chat.releaseId || null;
  const providerId = attachedProviderId || demo.selectedProviderId;
  const releaseId = attachedReleaseId || demo.selectedReleaseId;
  const provider = providers.find((item) => item.id === providerId) || selectedProvider();
  const release = releases.find((item) => item.id === releaseId);
  const label = mission.label;
  const prompt = mission.prompt;
  const taskProviderId = attachedProviderId || (kind === 'provider' ? provider?.id : null);
  const taskReleaseId = attachedReleaseId || null;
  demo.activeStudioTab = 'chat';
  demo.activeChatCount = Math.max(1, demo.activeChatCount);
  demo.activeModal = null;
  chat.messages.push({
    role: 'user',
    text: label,
    providerId: taskProviderId,
    releaseId: taskReleaseId,
    ts: Date.now(),
  });
  chat.activeTask = {
    kind,
    phase: 'working',
    prompt: label,
    response: '',
    error: '',
    providerId: taskProviderId,
    releaseId: taskReleaseId,
  };
  if (chatIndex === 0) rememberRecentChat(label, provider, release, chat);
  chat.providerId = null;
  chat.releaseId = null;
  if (chatIndex === 0) syncPrimaryContext();
  demo.agentFixing = kind !== 'diff' && kind !== 'explain';
  demo.verified = kind === 'verify' ? false : demo.verified;
  demo.activeStepId = kind === 'verify' ? 'verify' : kind === 'provider' ? 'provider' : 'agent';
  demo.notice = meta.notice;
  render({ scrollToBottom: chatIndex });
  const finish = (message, isError, cardsPayload) => {
    const taskContext = chat.activeTask || {};
    const responseText = isError
      ? (message || 'The connected CLI did not return a usable response.')
      : (message || 'Ready for the next safe action.');
    const attachKinds = ['analyze', 'plan', 'provider', 'verify'];
    const cards = attachKinds.includes(kind)
      ? (cardsPayload || missionCards)
      : (cardsPayload && ['diff', 'explain'].includes(kind) ? cardsPayload : null);
    if (cardsPayload) missionCards = cardsPayload;
    chat.messages.push({
      role: 'agent',
      text: responseText,
      kind,
      isError,
      providerId: taskContext.providerId || null,
      releaseId: taskContext.releaseId || null,
      cards: cards || null,
      ts: Date.now(),
    });
    chat.activeTask = null;
    demo.agentFixing = false;
    if (chatIndex === 0) updateActiveRecentChatSnapshot();
    if (kind === 'verify') {
      demo.verified = true;
      demo.activeStepId = 'clear';
      demo.selectedReleaseId = 'v1.3.0';
      demo.notice = 'Verification finished in chat. Launch proof is green.';
    } else if (kind === 'fix') {
      demo.activeStepId = 'verify';
      demo.notice = 'Fix prepared in chat. Run Verify to update production readiness.';
    } else {
      demo.notice = taskMeta(kind).title + ' finished in chat.';
    }
    render({ scrollToBottom: chatIndex });
  };
  if (chat.cliId === 'terminal') {
    finish('Terminal chat execution is blocked. Use the Terminal tab for explicit commands.', true);
    return;
  }
  if (typeof fetch !== 'function') {
    chatTaskTimer = window.setTimeout(() => finish('', false), kind === 'verify' ? 1500 : 1250);
    return;
  }
  fetch('/api/agent-chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      cliId: chat.cliId,
      modelId: selectedModelLabel(chatIndex),
      reasoning: chat.reasoning,
      context: chat.context,
      accessMode: chat.accessMode || 'approve',
      prompt,
      displayPrompt: label,
      taskKind: kind,
      provider: { id: provider.id, area: provider.area, name: provider.name },
      release: release ? { id: release.id, label: release.label } : undefined
    })
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(await response.text());
      const payload = await response.json();
      const run = payload && payload.agentRun ? payload.agentRun : {};
      const output = String(run.output || run.stderr || '').trim();
      const failed = Boolean(run.timedOut || run.exitCode === null || Number(run.exitCode) !== 0);
      finish(output || 'The selected local CLI did not return output. Check that it is installed, signed in, and available on PATH.', failed || !output, payload.missionCards || null);
    })
    .catch((error) => {
      finish(error && error.message ? error.message : 'The connected CLI could not be reached.', true);
    });
}

function sendChatInput(chatIndex) {
  const safeIndex = Math.max(0, Math.min(Number(chatIndex) || 0, demo.activeChatCount - 1));
  const input = app.querySelector('[data-chat-input="' + String(safeIndex) + '"]');
  const chat = chatContext(safeIndex);
  const value = String(chat.draft || (input && 'value' in input ? input.value : '') || '').trim();
  demo.pickerChatIndex = safeIndex;
  if (!value) {
    demo.notice = 'Type a mission first, or use a VibeRaven quick action.';
    render();
    return;
  }
  chat.draft = '';
  if (input && 'value' in input) input.value = '';
  runChatTask(chat.releaseId ? 'diff' : chat.providerId ? 'provider' : 'analyze', value);
}

function resetLaunchPreview() {
  demo.activeNavId = 'launch';
  demo.activeStepId = 'repo';
  demo.selectedProviderId = 'supabase';
  demo.selectedReleaseId = 'v1.3.0';
  demo.agentFixing = false;
  demo.verified = false;
  demo.providerPickerOpen = false;
  demo.activeModal = null;
  demo.activeStudioTab = 'chat';
  demo.selectedCliId = 'codex';
  demo.cliConnected = true;
  demo.studioExpanded = false;
  demo.activeChatCount = 1;
  demo.selectedModelId = 'gpt-5.5';
  demo.selectedReasoning = 'High';
  demo.selectedContext = 'Production';
  demo.selectedAccessMode = 'approve';
  demo.modelMenuOpen = false;
  demo.reasoningMenuOpen = false;
  demo.contextMenuOpen = false;
  demo.accessMenuOpen = false;
  demo.pickerChatIndex = 0;
  demo.chatContexts = [defaultChatContext({ cliId: 'codex', modelId: 'gpt-5.5', reasoning: 'High', context: 'Production', accessMode: 'approve' })];
  demo.droppedProviderId = null;
  demo.droppedReleaseId = null;
  clearChatTaskTimer();
}

function SidebarNav() {
  const navItems = [
    ['launch', 'New Launch', 'plus'],
    ['flow', 'Launch Flow', 'bolt'],
    ['providers', 'Providers', 'cube'],
    ['agents', 'Agents', 'agent'],
    ['evidence', 'Evidence', 'doc'],
    ['versions', 'Versions & Releases', 'branch'],
    ['settings', 'Settings', 'gear'],
    ['community', 'Community', 'people'],
  ];
  return '<aside class="vr-sidebar">' +
    '<div class="vr-sidebar-brand"><span class="vr-brand-mascot"><img src="' + mascotAssets.idle + '" alt="" /></span><div><strong>VibeRaven</strong><span>Studio</span></div></div>' +
    '<nav class="vr-sidebar-nav" aria-label="VibeRaven navigation">' +
      navItems.map(([id, label, icon]) => '<button class="' + (id === demo.activeNavId ? 'is-active' : '') + '" type="button" data-nav-target="' + id + '">' + Icon(icon) + '<span>' + label + '</span></button>').join('') +
    '</nav>' +
    '<section class="vr-open-source-card"><strong>Open Source & Community</strong><p>Built for developers taking AI apps to production.</p><a class="vr-github-cta" href="' + publicGithubUrl + '" target="_blank" rel="noreferrer">' + BrandMark('github') + 'GitHub</a>' + GitHubStats() + '</section>' +
    '<div class="vr-workspace-switcher" aria-label="Current workspace"><span></span><div><strong>Acme Workspace</strong><em>Production</em></div></div>' +
    '</aside>';
}

function ProjectHeader() {
  return '<header class="vr-project-header">' +
    '<div class="vr-project-id" aria-label="Current project"><span>Project</span><strong>' + escapeHtml(projectName()) + '</strong></div>' +
    StatusBadge('Live', 'green') +
    '<span class="vr-branch-selector" aria-label="Current branch">' + Icon('branch') + '<span>main</span></span>' +
  '</header>';
}

function StudioTopBar() {
  return '<header class="vr-studio-topbar" aria-label="VibeRaven Studio header">' +
    '<a class="vr-topbar-brand" href="' + publicGithubUrl + '" target="_blank" rel="noreferrer" aria-label="Open VibeRaven on GitHub"><span><img src="' + mascotAssets.idle + '" alt="" /></span><strong>VibeRaven</strong></a>' +
    StatusBadge('Live', 'green') +
    '<span class="vr-topbar-spacer"></span>' +
  '</header>';
}

function TopStageStrip() {
  return '<nav class="vr-top-stage-strip" aria-label="Launch stage quick navigation">' + topStages.map((stage) => {
    const active = stage.id === demo.activeStepId || (demo.verified && stage.id === 'clear') || (demo.agentFixing && stage.id === 'agent');
    const state = stage.id === 'clear' && demo.verified ? 'Ready' : stage.id === 'verify' && demo.verified ? 'Ready' : stage.id === 'agent' && demo.agentFixing ? 'Fixing' : stage.state;
    return '<button class="' + (active ? 'is-active' : '') + '" type="button" data-stage-step="' + escapeHtml(stage.id) + '">' +
      '<span>' + escapeHtml(stage.number) + '</span><strong>' + escapeHtml(stage.label) + '</strong><em>' + escapeHtml(state) + '</em><b></b>' +
    '</button>';
  }).join('') + '</nav>';
}

function RecentChatRail() {
  return '<aside class="vr-recent-rail" aria-label="Recent production chats">' +
    '<button class="vr-new-chat-button" type="button" data-action="new-chat">' + Icon('plus') + '<span>New Chat</span><kbd>⌘ N</kbd></button>' +
    '<h2>Recent Chats</h2>' +
    '<div class="vr-recent-chat-list">' + recentChats.map((chat) =>
      '<button class="vr-recent-chat ' + (chat.id === demo.activeRecentChatId ? 'is-active' : '') + '" type="button" draggable="true" data-chat-id="' + escapeHtml(chat.id) + '">' +
        Icon('prompt') +
        '<span><strong>' + escapeHtml(chat.title) + '</strong><em>' + escapeHtml(chat.caption) + '</em></span>' +
        '<small>' + escapeHtml(chat.time) + '</small>' +
      '</button>'
    ).join('') + (recentChats.length ? '' : '<p class="vr-recent-empty">No saved chats yet. Split a mission when you need another lane.</p>') + '</div>' +
    '<button class="vr-view-all-chats" type="button" data-action="view-all-chats">View all chats <b></b></button>' +
    '</aside>';
}

function ProviderCard(provider) {
  const slot = stackSlots[provider.id] || provider.area;
  return '<button class="vr-provider-card ' + (provider.id === demo.selectedProviderId ? 'is-selected' : '') + '" type="button" draggable="true" data-provider="' + escapeHtml(provider.id) + '" data-provider-tone="' + escapeHtml(provider.tone || 'neutral') + '" aria-label="Open ' + escapeHtml(provider.name) + ' stack slot">' +
    ProviderToken(provider) +
    '<div><small>' + escapeHtml(slot) + '</small><strong>' + escapeHtml(provider.name) + '</strong><em>' + escapeHtml(provider.status) + '</em></div>' +
    providerMcpChip(provider) +
    '<span class="vr-provider-proof-chip"><span>Open</span>' + Icon('chevronRight') + '</span>' +
    '</button>';
}

function ProviderDetailPanel() {
  const provider = providers.find((item) => item.id === demo.selectedProviderId) || providers[0];
  return '<aside class="vr-provider-detail-panel">' +
    '<div class="vr-detail-head">' + ProviderToken(provider, 'is-large') + '<div><span>' + escapeHtml(provider.area) + '</span><strong>' + escapeHtml(provider.name) + '</strong></div>' + StatusBadge(provider.status, provider.tone) + '</div>' +
    '<p>' + escapeHtml(provider.detail) + '</p>' +
    '<div class="vr-provider-stats"><span><b>Checks</b><em>' + escapeHtml(provider.checks) + '</em></span><span><b>Region</b><em>' + escapeHtml(provider.region) + '</em></span><span><b>Last sync</b><em>' + escapeHtml(provider.lastSync) + '</em></span></div>' +
    ProviderMcpPanel(provider) +
    '<a class="vr-provider-dashboard" href="' + escapeHtml(providerDashboardUrls[provider.id] || docsUrl) + '" target="_blank" rel="noreferrer">Open dashboard ' + Icon('external') + '</a>' +
    '</aside>';
}

function ProviderGrid() {
  const boardProviders = orderedProviders();
  const activeCount = boardProviders.filter((provider) => provider.state !== 'not_detected').length;
  const summary = activeCount > 0 ? activeCount + ' production slot' + (activeCount === 1 ? '' : 's') + ' detected locally.' : 'No production providers detected yet.';
  return '<section class="vr-providers-panel" aria-label="Connected providers">' +
    '<div class="vr-panel-head"><div><h2>Provider Control Board</h2><p><b>Local project evidence</b> &middot; ' + escapeHtml(summary) + '</p></div><button class="vr-add-provider-inline" type="button" data-action="add-provider">' + Icon('plus') + 'Add Provider</button></div>' +
    (demo.providerPickerOpen ? ProviderPicker() : '') +
    '<div class="vr-provider-composition"><div class="vr-provider-grid" aria-label="Production provider slots">' + boardProviders.map(ProviderCard).join('') + '</div>' + ProviderDetailPanel() + '</div>' +
    '</section>';
}

function ProviderPicker() {
  const boardProviders = orderedProviders();
  return '<div class="vr-provider-picker" aria-label="Provider picker">' +
    '<div><strong>Connector picker</strong><span>Select one provider. VibeRaven opens its proof panel and next action.</span></div>' +
    '<div class="vr-provider-picker-list">' + boardProviders.map((provider) =>
      '<button type="button" data-provider="' + escapeHtml(provider.id) + '">' + ProviderToken(provider, 'is-picker') + '<span>' + escapeHtml(provider.name) + '</span></button>'
    ).join('') + '</div>' +
    '</div>';
}

function ReleaseCard(release) {
  const selected = release.id === demo.selectedReleaseId;
  return '<button class="vr-release-card ' + (selected ? 'is-selected' : '') + '" draggable="true" data-release="' + escapeHtml(release.id) + '" data-tone="' + escapeHtml(release.tone) + '" type="button">' +
    '<small>' + (release.tone === 'current' ? 'Current Release' : release.tone === 'prod' ? 'Stable' : '&nbsp;') + '</small>' +
    '<strong>' + escapeHtml(release.label) + '</strong>' +
    '<em>' + escapeHtml(release.meta) + ' &middot; ' + escapeHtml(release.branch) + '</em>' +
    '</button>';
}

function VersionTimeline() {
  const selected = releases.find((item) => item.id === demo.selectedReleaseId) || releases[0];
  const currentRelease = releases[0];
  const previousReleases = releases.slice(1, 4);
  return '<section class="vr-releases-panel" aria-label="Versions and releases">' +
    '<div class="vr-panel-head"><div><h2>Versions & Releases</h2><p>Current release, rollback context, and changelog actions.</p></div></div>' +
    '<div class="vr-release-composition">' +
      '<button class="vr-release-card vr-release-current ' + (currentRelease.id === demo.selectedReleaseId ? 'is-selected' : '') + '" draggable="true" data-release="' + escapeHtml(currentRelease.id) + '" data-tone="' + escapeHtml(currentRelease.tone) + '" type="button">' +
        '<small>Current Release</small><strong>' + escapeHtml(currentRelease.label) + '</strong><em>' + escapeHtml(currentRelease.meta) + ' &middot; ' + escapeHtml(currentRelease.branch) + '</em><span>' + escapeHtml(currentRelease.summary || 'Local release context') + '</span>' +
      '</button>' +
      '<section class="vr-release-list"><header><strong>Recent Versions</strong><button type="button" data-action="all-releases">View all</button></header>' +
        (previousReleases.length > 0 ? previousReleases.map((release) => '<button class="vr-release-row ' + (release.id === demo.selectedReleaseId ? 'is-selected' : '') + '" draggable="true" data-release="' + escapeHtml(release.id) + '" data-tone="' + escapeHtml(release.tone) + '" type="button"><span><strong>' + escapeHtml(release.label) + '</strong><em>' + escapeHtml(release.summary || release.branch) + '</em></span><small>' + escapeHtml(release.meta) + '</small></button>').join('') : '<div class="vr-release-empty">No previous releases detected.</div>') +
      '</section>' +
    '</div>' +
    '<div class="vr-release-actions"><button type="button" data-action="compare">' + Icon('branch') + 'Compare Releases</button><button type="button" data-action="changelog">' + Icon('report') + 'View Changelog</button><button type="button" data-action="rollback-release">' + Icon('refresh') + 'Rollback</button></div>' +
    '<div class="vr-release-track" aria-hidden="true">' + releases.map(ReleaseCard).join('') + '</div>' +
    '<div class="vr-timeline-rail">' + releases.map((release) => '<span class="' + (release.id === selected.id ? 'is-selected' : '') + '"></span>').join('') + '</div>' +
    '<p class="vr-release-detail">Selected release: <strong>' + escapeHtml(selected.label) + '</strong> &middot; branch ' + escapeHtml(selected.branch) + '</p>' +
    '</section>';
}

function ModalShell(kind, body) {
  return '<section class="vr-modal-backdrop" data-modal-backdrop="' + escapeHtml(kind) + '" aria-label="Preview detail modal">' +
    '<div class="vr-modal-card vr-modal-' + escapeHtml(kind) + '" role="dialog" aria-modal="true">' +
      '<button class="vr-modal-close" type="button" data-action="close-modal" aria-label="Close">' + Icon('x') + '</button>' +
      body +
    '</div>' +
    '</section>';
}

function ModalCheck(label, caption, state, statusText) {
  const status = statusText || (state === 'done' ? 'OK' : state === 'running' ? 'Running' : state === 'active' ? 'Ready' : 'Pending');
  return '<li class="' + escapeHtml(state) + '"><span></span><div><strong>' + escapeHtml(label) + '</strong><em>' + escapeHtml(caption) + '</em></div><b>' + escapeHtml(status) + '</b></li>';
}

function ProviderModal() {
  const provider = providers.find((item) => item.id === demo.selectedProviderId) || providers[0];
  const raw = rawProviderRecord(provider.id) || provider;
  const health = providerHealth(raw, provider);
  const checkRows = providerModalCheckRows(raw);
  return ModalShell('provider',
    '<header class="vr-modal-provider-head">' +
      ProviderLogo(provider, 'vr-modal-provider-logo') +
      '<div><h2>' + escapeHtml(provider.name) + '</h2>' + StatusBadge(provider.status, provider.tone) + '<p>' + escapeHtml(provider.area) + ' provider</p></div>' +
      '<img class="vr-modal-mascot" src="' + providerModalMascot(health) + '" alt="" />' +
    '</header>' +
    '<section class="vr-modal-health is-' + escapeHtml(health.tone) + '"><span>' + providerHealthIcon(health) + '</span><div><strong>' + escapeHtml(health.label) + '</strong><em>' + escapeHtml(health.summary) + '</em></div><b>' + escapeHtml(health.meta) + '</b></section>' +
    ProviderMcpPanel(provider) +
    '<div class="vr-modal-action-grid">' +
      GlowButton('Open slot', { action: 'guide', tone: 'purple' }) +
      '<button type="button" data-action="recheck">' + Icon('refresh') + 'Re-check</button>' +
      '<a href="' + docsUrl + '" target="_blank" rel="noreferrer">' + Icon('guide') + 'Open Docs</a>' +
    '</div>' +
    '<section class="vr-modal-checks"><h3>Checks & Requirements</h3><ul>' +
      checkRows.map((row) => ModalCheck(row.label, row.caption, row.state, row.status)).join('') +
    '</ul></section>' +
    '<footer class="vr-modal-foot">' + Icon('lock') + '<span>Credentials stay local and are never shown in this preview.</span><a href="' + (providerDashboardUrls[provider.id] || docsUrl) + '" target="_blank" rel="noreferrer">Open dashboard</a></footer>'
  );
}

function AddProviderModal() {
  const featured = [
    { slot: 'Database', provider: 'Supabase', icon: 'supabase', caption: 'Postgres, auth, storage, and RLS proof' },
    { slot: 'Monitoring', provider: 'Sentry', icon: 'sentry', caption: 'Error capture, DSN, and release tracking' },
    { slot: 'Payments', provider: 'Stripe', icon: 'stripe', caption: 'Webhook, product, and billing readiness' },
    { slot: 'Email', provider: 'Resend', icon: 'resend', caption: 'Transactional email and domain proof' },
  ];
  return ModalShell('add-provider',
    '<header class="vr-modal-add-head">' +
      '<div><p>Connect Provider</p><h2>Add a production slot</h2><em>Select the service type VibeRaven should verify next.</em></div>' +
      '<img class="vr-modal-agent-avatar" src="' + mascotAssets.verified + '" alt="" />' +
    '</header>' +
    '<section class="vr-modal-provider-options">' + featured.map((item) => {
      const provider = providers.find((candidate) => candidate.id === item.icon) || providers[0];
      return '<button type="button" data-provider="' + escapeHtml(provider.id) + '">' + ProviderToken(provider, 'is-large') + '<div><small>' + escapeHtml(item.slot) + '</small><strong>' + escapeHtml(item.provider) + '</strong><em>' + escapeHtml(item.caption) + '</em></div><b>Connect</b></button>';
    }).join('') + '</section>' +
    '<section class="vr-modal-connect-note">' + Icon('lock') + '<span>VibeRaven only opens setup guidance here. Real credentials stay in your local runner or provider dashboard.</span></section>'
  );
}

function ReleaseModal() {
  const release = releases.find((item) => item.id === demo.selectedReleaseId) || releases[0];
  const pair = releaseComparePair();
  return ModalShell('release',
    '<header class="vr-modal-release-head">' +
      '<div><p>' + Icon('spark') + 'Version Details</p><h2>' + escapeHtml(release.label) + '</h2><span>' + Icon('branch') + escapeHtml(release.branch) + '</span>' + StatusBadge(release.tone === 'current' ? 'Production' : 'Preview', release.tone === 'current' ? 'green' : 'purple') + '</div>' +
      '<img class="vr-modal-mascot" src="' + mascotAssets.idle + '" alt="" />' +
    '</header>' +
    '<button class="vr-modal-compare" type="button" data-action="compare">' + Icon('refresh') + 'Compare with previous release <b>' + escapeHtml(pair.fromLabel) + ' → ' + escapeHtml(pair.toLabel) + '</b></button>' +
    '<div class="vr-modal-two-col">' +
      '<section><h3>' + Icon('doc') + 'Changelog</h3>' + releaseChangelogHtml() + '</section>' +
      '<section><h3>' + Icon('cloud') + 'Deploy Status</h3><dl><dt>Environment</dt><dd>Production</dd><dt>Last checked</dt><dd>' + escapeHtml(release.meta) + '</dd><dt>Release</dt><dd>' + escapeHtml(release.label) + '</dd></dl></section>' +
    '</div>' +
    '<section class="vr-modal-notes"><h3>' + Icon('prompt') + 'Release Notes</h3><p>Compare against the previous tag, review the changelog, then verify before promoting.</p></section>' +
    '<div class="vr-modal-button-row"><button type="button" data-action="show-release-diff">' + Icon('code') + 'View diff</button><button type="button" data-action="compare">Compare</button><button type="button" data-action="changelog">' + Icon('external') + 'Open changelog</button></div>'
  );
}

function AgentModal() {
  const fixing = demo.agentFixing;
  const verified = demo.verified;
  return ModalShell('agent',
    '<header class="vr-modal-agent-head">' +
      '<img class="vr-modal-agent-avatar" src="' + mascotUrl() + '" alt="" />' +
      '<div><p>Agent Action</p><h2>VibeRaven</h2><em>' + (verified ? 'Everything is verified in preview mode.' : fixing ? 'I am fixing the selected launch gap now.' : 'I will fix the issue and verify everything works as expected.') + '</em></div>' +
      '<aside>' + Icon('clock') + '<span>' + (verified ? 'Status' : 'Estimated time') + '</span><strong>' + (verified ? 'Complete' : fixing ? 'Running' : '2 - 4 min') + '</strong></aside>' +
    '</header>' +
    '<section class="vr-modal-tasklist"><h3>Task checklist</h3><ul>' +
      ModalCheck('Diagnose issue', 'Find the highest-impact launch blocker.', fixing || verified ? 'done' : 'active', fixing || verified ? 'OK' : 'Ready') +
      ModalCheck('Apply focused fix', 'Patch only the selected launch gap.', verified ? 'done' : fixing ? 'running' : 'pending', verified ? 'OK' : fixing ? 'Running' : 'Pending') +
      ModalCheck('Run verification tests', 'Confirm the flow is safe after the fix.', verified ? 'done' : fixing ? 'active' : 'pending', verified ? 'OK' : fixing ? 'Queued' : 'Pending') +
      ModalCheck('Confirm systems operational', 'Move the launch flow to clear.', verified ? 'done' : 'pending') +
    '</ul></section>' +
    '<section class="vr-modal-progress ' + (!verified && !fixing ? 'is-ready' : '') + '">' + Icon('shield') + '<div><strong>' + (verified ? 'Verification complete' : fixing ? 'Fix in progress' : 'Ready for focused fix') + '</strong><p>' + (verified ? 'The launch flow is green in preview mode.' : fixing ? 'Running checks to ensure a safe and reliable fix.' : 'Start the agent when you are ready to patch one selected launch gap.') + '</p></div>' + Icon('spark') + '</section>' +
    '<div class="vr-modal-button-row">' +
      GlowButton(fixing ? 'Fixing...' : verified ? 'Complete' : 'Start Agent Fix', { action: 'start-agent-fix', tone: verified ? 'green' : 'purple' }) +
      '<button type="button" data-action="verify-now">Verify Now</button>' +
    '</div>' +
    '<footer class="vr-modal-safe">' + Icon('lock') + 'Safe. Verified. Automated.</footer>'
  );
}

function GuideModal() {
  const provider = providers.find((item) => item.id === demo.selectedProviderId) || providers[0];
  return ModalShell('guide',
    '<header class="vr-modal-guide-head">' +
      '<img class="vr-modal-agent-avatar" src="' + mascotAssets.idle + '" alt="" />' +
      '<div><p>Launch Guide</p><h2>Next best move</h2><em>Keep the flow simple: inspect proof, hand off the scoped fix, then verify.</em></div>' +
      '<aside>' + Icon('spark') + '<span>Focus</span><strong>' + escapeHtml(provider.name) + '</strong></aside>' +
    '</header>' +
    '<section class="vr-modal-flow-list">' +
      '<button type="button" data-provider="' + escapeHtml(provider.id) + '"><span>1</span><div><strong>Review provider proof</strong><em>Open ' + escapeHtml(provider.name) + ' status and dashboard action.</em></div>' + Icon('external') + '</button>' +
      '<button type="button" data-action="prompt"><span>2</span><div><strong>Open agent mission</strong><em>Give the connected CLI one scoped launch gap, not the whole app.</em></div>' + Icon('prompt') + '</button>' +
      '<button type="button" data-action="verify-now"><span>3</span><div><strong>Verify the flow</strong><em>Turn the launch path green after the focused fix.</em></div>' + Icon('check') + '</button>' +
    '</section>'
  );
}

function PromptModal() {
  return ModalShell('prompt',
    '<header class="vr-modal-prompt-head">' +
      '<img class="vr-modal-agent-avatar" src="' + mascotAssets.fixing + '" alt="" />' +
      '<div><p>Agent Mission</p><h2>Scoped handoff</h2><em>One clear mission for the connected coding agent.</em></div>' +
      '<aside>' + Icon('lock') + '<span>Scope</span><strong>One gap</strong></aside>' +
    '</header>' +
    '<section class="vr-modal-prompt-card"><pre>' + escapeHtml(agentPromptText()) + '</pre></section>' +
    '<div class="vr-modal-button-row">' +
      GlowButton('Use mission', { action: 'copy-prompt', tone: 'purple' }) +
      '<button type="button" data-action="start-agent-fix">' + Icon('agent') + 'Start Agent Fix</button>' +
      '<button type="button" data-action="guide">' + Icon('guide') + 'Guide me</button>' +
    '</div>'
  );
}

function PlanModal() {
  const provider = providers.find((item) => item.id === demo.selectedProviderId) || providers[0];
  return ModalShell('plan',
    '<header class="vr-modal-guide-head">' +
      '<img class="vr-modal-agent-avatar" src="' + mascotAssets.idle + '" alt="" />' +
      '<div><p>Production Plan</p><h2>Safe fix path</h2><em>One scoped mission: fix the highest-risk launch blocker, verify it, then prepare release proof.</em></div>' +
      '<aside>' + Icon('shield') + '<span>Context</span><strong>' + escapeHtml(provider.name) + '</strong></aside>' +
    '</header>' +
    '<section class="vr-modal-flow-list">' +
      '<button type="button" data-action="add-context"><span>1</span><div><strong>Add launch context</strong><em>Drag a provider or version into chat so the agent has the exact proof target.</em></div>' + Icon('plus') + '</button>' +
      '<button type="button" data-action="prompt"><span>2</span><div><strong>Open scoped mission</strong><em>Use a production-safe prompt tied to ' + escapeHtml(provider.area) + ' evidence.</em></div>' + Icon('prompt') + '</button>' +
      '<button type="button" data-action="start-agent-fix"><span>3</span><div><strong>Apply one fix</strong><em>Send the connected model to patch the selected launch gap only.</em></div>' + Icon('agent') + '</button>' +
      '<button type="button" data-action="show-diff"><span>4</span><div><strong>Review diff</strong><em>Inspect repo changes before accepting verification.</em></div>' + Icon('code') + '</button>' +
      '<button type="button" data-action="verify-now"><span>5</span><div><strong>Run verify</strong><em>Move the mission into a green verified state after review.</em></div>' + Icon('check') + '</button>' +
    '</section>' +
    '<div class="vr-modal-button-row">' +
      GlowButton('Apply Fix', { action: 'start-agent-fix', tone: 'purple' }) +
      '<button type="button" data-action="show-diff">' + Icon('code') + 'Open Diff</button>' +
      '<button type="button" data-action="provider-proof">' + Icon('cube') + 'Provider Proof</button>' +
    '</div>'
  );
}

function ExplainModal() {
  const provider = providers.find((item) => item.id === demo.selectedProviderId) || providers[0];
  const release = releases.find((item) => item.id === demo.selectedReleaseId) || releases[0];
  return ModalShell('explain',
    '<header class="vr-modal-prompt-head">' +
      '<img class="vr-modal-agent-avatar" src="' + (demo.verified ? mascotAssets.verified : mascotAssets.fixing) + '" alt="" />' +
      '<div><p>Change Summary</p><h2>What changed</h2><em>A short launch-safe explanation for the connected chat, release notes, or reviewer.</em></div>' +
      '<aside>' + Icon('repo') + '<span>Release</span><strong>' + escapeHtml(release.label) + '</strong></aside>' +
    '</header>' +
    '<div class="vr-modal-two-col">' +
      '<section><h3>' + Icon('shield') + 'Fix summary</h3><p>VibeRaven scoped the mission to ' + escapeHtml(provider.area) + ' proof. The preview diff adds guarded monitoring capture and keeps provider dashboard work separate from repo evidence.</p></section>' +
      '<section><h3>' + Icon('check') + 'Verify next</h3><dl><dt>Provider</dt><dd>' + escapeHtml(provider.name) + '</dd><dt>Branch</dt><dd>' + escapeHtml(release.branch || 'main') + '</dd><dt>Context</dt><dd>' + escapeHtml(demo.selectedContext) + '</dd></dl></section>' +
    '</div>' +
    '<section class="vr-modal-notes"><h3>' + Icon('prompt') + 'Agent-ready wording</h3><p>Explain the diff in production terms: what blocker was reduced, what evidence changed, what still needs dashboard proof, and which verify action should run next.</p></section>' +
    '<div class="vr-modal-button-row">' +
      GlowButton('Send to Chat', { action: 'prompt', tone: 'purple' }) +
      '<button type="button" data-action="show-diff">' + Icon('code') + 'Open Diff</button>' +
      '<button type="button" data-action="verify-now">' + Icon('shield') + 'Run Verify</button>' +
    '</div>'
  );
}

function NotificationsModal() {
  return ModalShell('notifications',
    '<header class="vr-modal-guide-head">' +
      '<img class="vr-modal-agent-avatar" src="' + (demo.verified ? mascotAssets.verified : mascotAssets.alert) + '" alt="" />' +
      '<div><p>Launch Signals</p><h2>' + (demo.verified ? 'Flow is green' : 'Needs attention') + '</h2><em>Only the actions that matter for this launch are shown.</em></div>' +
      '<aside>' + Icon('bell') + '<span>Status</span><strong>' + (demo.verified ? 'Clear' : '6 checks') + '</strong></aside>' +
    '</header>' +
    '<section class="vr-modal-signal-list">' +
      ModalCheck('Repo evidence', demo.verified ? 'Evidence has been verified in preview mode.' : 'One blocker is still active before launch.', demo.verified ? 'done' : 'active') +
      ModalCheck('Provider proof', 'Connected services are available to inspect.', 'done') +
      ModalCheck('Agent fix', demo.agentFixing ? 'Agent fix is running now.' : 'Ready to start a scoped fix.', demo.agentFixing || demo.verified ? 'done' : 'pending') +
      ModalCheck('Verification', demo.verified ? 'Verification state is green.' : 'Run verification after the scoped fix.', demo.verified ? 'done' : 'pending') +
    '</section>' +
    '<div class="vr-modal-button-row">' +
      GlowButton(demo.verified ? 'Verified' : 'Start Agent Fix', { action: demo.verified ? 'verify-now' : 'start-agent-fix', tone: demo.verified ? 'green' : 'purple' }) +
      '<button type="button" data-action="guide">' + Icon('guide') + 'Guide me</button>' +
      '<button type="button" data-action="prompt">' + Icon('prompt') + 'Open mission</button>' +
    '</div>'
  );
}

function cliSetupFor(agentId) {
  const agent = cliAgents.find((item) => item.id === agentId);
  return agent && agent.setup ? agent.setup : {
    installCommand: 'npm install -g ' + agentId,
    signInCommand: agentId,
    verifyCommand: agentId + ' --version',
    docsUrl: docsUrl,
  };
}

function connectedCodingAgents() {
  return cliAgents.filter((agent) => agent.id !== 'terminal' && cliAgentReady(agent.id));
}

function studioFreshQuery() {
  try {
    return new URLSearchParams(window.location.search).get('fresh') === '1' ? '?fresh=1' : '';
  } catch {
    return '';
  }
}

function markCliSetupComplete(agentId, chatIndex) {
  connectCliAgent(agentId, chatIndex || 0, { completeSetup: true });
}

function connectCliAgent(agentId, chatIndex, options) {
  const opts = options || {};
  if (!agentId || agentId === 'terminal') return;
  markCliSessionReady(agentId);
  demo.cliConnected = true;
  demo.selectedCliId = agentId;
  demo.cliLastConnectTargetId = agentId;
  demo.cliConnectTargetId = null;
  if (!opts.keepProbeState) {
    demo.cliProbeStatus = 'idle';
    demo.cliProbeMessage = '';
  }
  const models = cliModels[agentId] || cliModels.codex;
  const chat = chatContext(chatIndex || 0);
  chat.cliId = agentId;
  if (models && models.length) {
    chat.modelId = normalizeModelId(models[0]);
    demo.selectedModelId = chat.modelId;
  }
  demo.pickerChatIndex = chatIndex || 0;
  if (opts.completeSetup) {
    demo.cliSetupComplete = true;
    demo.chatContexts.forEach((context) => {
      context.cliId = agentId;
      if (models && models.length) context.modelId = normalizeModelId(models[0]);
    });
  }
}

function cliSetupProbeLabel() {
  return demo.cliProbeStatus === 'probing' ? 'Testing...' : demo.cliProbeStatus === 'success' ? 'Connected' : demo.cliProbeStatus === 'failed' ? 'Try again' : 'Test connection';
}

function CliSetupActions(targetId, index) {
  const setup = cliSetupFor(targetId);
  const probeLabel = cliSetupProbeLabel();
  return '<div class="vr-cli-connect-expand-actions">' +
    '<button class="vr-cli-action-button" type="button" data-action="run-cli-install" data-cli-agent="' + escapeHtml(targetId) + '" data-chat-index="' + String(index) + '">' + Icon('shell') + 'Run install</button>' +
    '<button class="vr-cli-action-button" type="button" data-action="run-cli-signin" data-cli-agent="' + escapeHtml(targetId) + '" data-chat-index="' + String(index) + '">' + Icon('shell') + 'Run sign in</button>' +
    '<button class="vr-cli-action-button is-primary" type="button" data-action="test-cli-connection" data-cli-agent="' + escapeHtml(targetId) + '" data-chat-index="' + String(index) + '">' + Icon('refresh') + escapeHtml(probeLabel) + '</button>' +
    '</div>' +
    '<p class="vr-cli-setup-hint">Run install and sign in, then use <strong>Test connection</strong> to unlock chat control. Commands: <code>' + escapeHtml(setup.installCommand) + '</code> then <code>' + escapeHtml(setup.signInCommand) + '</code></p>';
}

function appendTerminalLines(lines) {
  const next = Array.isArray(lines) ? lines : [lines];
  demo.cliTerminalLines = demo.cliTerminalLines.concat(next);
}

function resetCliConnectFlow(options) {
  const opts = options || {};
  if (opts.fullReset) {
    demo.cliConnectTargetId = null;
    demo.cliLastConnectTargetId = null;
  } else {
    const preserved = demo.cliConnectTargetId || demo.cliLastConnectTargetId || terminalTargetId();
    setConnectTarget(preserved);
  }
  if (!opts.keepLog) demo.cliTerminalLines = [];
  demo.cliTerminalTitle = opts.fullReset ? '' : 'Connect coding CLI';
  demo.cliTerminalDraft = '';
  demo.cliProbeStatus = 'idle';
  demo.cliProbeMessage = '';
  demo.cliConnectCompleteAgentId = null;
  demo.activeModal = null;
  if (opts.fullReset) {
    demo.cliSetupComplete = false;
    demo.cliConnected = false;
    demo.cliSessionReady = {};
    writeCliSessionReady({});
  }
}

async function runStudioShellCommand(command, label) {
  const trimmed = String(command || '').trim();
  if (!trimmed) return;
  appendTerminalLines(['$ ' + trimmed]);
  if (label) demo.cliTerminalTitle = label;
  render();
  try {
    const response = await fetch('/api/cli-agents/run-command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ command: trimmed }),
    });
    const payload = response.ok ? await response.json() : null;
    appendTerminalLines([
      String(payload?.output || payload?.message || 'Command finished.'),
      ''
    ]);
  } catch {
    appendTerminalLines(['Command could not run from Studio terminal.', '']);
  }
  render();
}

function selectTerminalCli(agentId) {
  const agent = cliAgents.find((item) => item.id === agentId);
  if (!agent || agent.id === 'terminal') return;
  setConnectTarget(agent.id);
  demo.cliTerminalTitle = 'Connect ' + (agent.label || agent.id);
  demo.activeStudioTab = 'terminal';
  if (!demo.cliTerminalLines.length) {
    demo.cliTerminalLines = [
      'VibeRaven Studio shell',
      'Run install, run sign in, then use Test connection to continue.',
      ''
    ];
  } else {
    appendTerminalLines(['--- switched to ' + (agent.label || agent.id) + ' ---', '']);
  }
  demo.cliTerminalDraft = cliSetupFor(agent.id).signInCommand;
  demo.cliProbeStatus = 'idle';
  demo.cliProbeMessage = '';
  render();
}

function TerminalCliSwitcher() {
  const targetId = terminalTargetId();
  const codingAgents = cliAgents.filter((agent) => agent.id !== 'terminal');
  return '<div class="vr-terminal-cli-switch">' + codingAgents.map((agent) => {
    const active = agent.id === targetId;
    const ready = cliAgentReady(agent.id);
    const installed = cliAgentInstalled(agent);
    const status = ready ? 'ready' : installed ? 'signin' : 'setup';
    return '<button class="vr-terminal-cli-chip ' + (active ? 'is-active' : '') + ' is-' + status + '" type="button" data-action="terminal-select-cli" data-cli-agent="' + escapeHtml(agent.id) + '" title="' + escapeHtml(ready ? 'Ready for chat' : installed ? 'Installed — sign in required' : 'Not installed') + '"><span></span><strong>' + escapeHtml(agent.label) + '</strong></button>';
  }).join('') + '</div>';
}

function StudioTerminalView() {
  const targetId = terminalTargetId();
  const agent = cliAgents.find((item) => item.id === targetId) || cliAgents[0];
  const showToolbar = shouldShowConnectToolbar();
  const shellDraft = demo.cliTerminalDraft || '';
  const lines = demo.cliTerminalLines.length
    ? demo.cliTerminalLines
    : [
      'VibeRaven Studio shell',
        'Type commands at the $ prompt. Use Test connection after sign-in.',
        ''
      ];
  const title = terminalConnectTitle(agent);
  const statusText = terminalStatusLabel(targetId);
  const toolbarTarget = demo.cliConnectTargetId || demo.cliLastConnectTargetId || targetId;
  return '<section class="vr-studio-terminal" aria-label="Connected agent terminal">' +
    '<header class="vr-terminal-head">' +
      '<div class="vr-terminal-head-copy"><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(statusText) + '</span></div>' +
      TerminalCliSwitcher() +
    '</header>' +
    '<div class="vr-terminal-screen" data-terminal-screen>' +
      '<div class="vr-terminal-scroll" data-terminal-scroll>' +
        lines.map((line) => '<div class="vr-terminal-line">' + escapeHtml(line) + '</div>').join('') +
      '</div>' +
      '<div class="vr-terminal-input-row">' +
        '<span class="vr-terminal-prompt">$</span>' +
        '<input type="text" class="vr-terminal-cursor-input" data-terminal-shell-input autocomplete="off" spellcheck="false" value="' + escapeHtml(shellDraft) + '" aria-label="Terminal command input" />' +
      '</div>' +
    '</div>' +
    (showToolbar
      ? '<div class="vr-terminal-toolbar">' + CliSetupActions(toolbarTarget, demo.pickerChatIndex || 0) +
        '<button class="vr-cli-os-fallback" type="button" data-action="open-os-terminal" data-cli-agent="' + escapeHtml(toolbarTarget) + '" data-chat-index="' + String(demo.pickerChatIndex || 0) + '">' + Icon('external') + 'Open OS terminal instead</button></div>'
      : '') +
    '</section>';
}

function CliConnectCompleteModal() {
  const agentId = demo.cliConnectCompleteAgentId || terminalTargetId();
  const agent = cliAgents.find((item) => item.id === agentId) || cliAgents[0];
  return ModalShell('connect-complete',
    '<header class="vr-modal-agent-head">' +
      '<img class="vr-modal-agent-avatar" src="' + mascotAssets.verified + '" alt="" />' +
      '<div><p>CLI ready</p><h2>' + escapeHtml(agent.label) + ' connected</h2><em>Reset only if you switched accounts or want to test first-time setup again.</em></div>' +
    '</header>' +
    '<section class="vr-modal-connect-note">' + Icon('spark') + '<span>Start chatting, or reset the connect flow if login still looks stale.</span></section>' +
    '<div class="vr-modal-button-row">' +
      GlowButton('Start chatting', { action: 'connect-complete-chat', tone: 'green', dataCliAgent: agentId }) +
      '<button type="button" data-action="reset-cli-connect" data-reset-mode="soft">Reset connect flow</button>' +
      '<button type="button" data-action="reset-cli-connect" data-reset-mode="full">Full reset</button>' +
    '</div>'
  );
}

function ChatFirstTimeConnect(index) {
  const codingAgents = cliAgents.filter((agent) => agent.id !== 'terminal');
  const targetAgent = (demo.cliConnectTargetId || demo.cliLastConnectTargetId)
    ? cliAgents.find((item) => item.id === (demo.cliConnectTargetId || demo.cliLastConnectTargetId))
    : null;
  const hintLine = targetAgent
    ? '<p class="vr-chat-first-connect-note">Continuing <strong>' + escapeHtml(targetAgent.label) + '</strong> in the Terminal tab.</p>'
    : '<p class="vr-chat-first-connect-note">Click Connect to open the Terminal tab — install, sign in, then test connection.</p>';
  return '<section class="vr-chat-empty-state vr-chat-first-connect" data-chat-index="' + String(index) + '">' +
    '<strong>First time</strong>' +
    '<span>Connect Codex, Claude Code, or Gemini through VibeRaven Studio.</span>' +
    '<div class="vr-cli-strip is-inline">' + codingAgents.map((agent) => CliAgentButton(agent, index)).join('') + '</div>' +
    hintLine +
  '</section>';
}

function ActiveModal() {
  if (demo.activeModal === 'connect-complete') return CliConnectCompleteModal();
  if (demo.activeModal === 'provider') return ProviderModal();
  if (demo.activeModal === 'add-provider') return AddProviderModal();
  if (demo.activeModal === 'release') return ReleaseModal();
  if (demo.activeModal === 'agent') return AgentModal();
  if (demo.activeModal === 'guide') return GuideModal();
  if (demo.activeModal === 'prompt') return PromptModal();
  if (demo.activeModal === 'plan') return PlanModal();
  if (demo.activeModal === 'explain') return ExplainModal();
  if (demo.activeModal === 'notifications') return NotificationsModal();
  return '';
}

function StudioTabButton(id, label) {
  return '<button class="' + (demo.activeStudioTab === id ? 'is-active' : '') + '" type="button" data-studio-tab="' + escapeHtml(id) + '">' + escapeHtml(label) + '</button>';
}

function CliAgentButton(agent, index) {
  const chat = chatContext(index);
  const installed = cliAgentInstalled(agent);
  const ready = cliAgentReady(agent.id);
  const isActive = chat.cliId === agent.id && ready;
  const label = isActive
    ? 'Active'
    : ready
      ? 'Connected'
      : installed
        ? 'Sign in'
        : 'Connect';
  return '<button class="' + (isActive ? 'is-selected' : '') + (ready && !isActive ? ' is-connected' : '') + (!ready && installed ? ' is-needs-signin' : '') + '" type="button" data-cli-agent="' + escapeHtml(agent.id) + '" data-chat-index="' + String(index) + '" data-tone="' + escapeHtml(agent.tone) + '" data-connected="' + (ready ? 'true' : 'false') + '" data-installed="' + (installed ? 'true' : 'false') + '">' +
    '<span></span><strong>' + escapeHtml(agent.label) + '</strong><b>' + label + '</b>' +
    '</button>';
}

function CliConnectExpand(index) {
  const targetId = demo.cliConnectTargetId;
  if (!targetId) return '';
  const targetAgent = cliAgents.find((item) => item.id === targetId);
  if (!targetAgent || cliAgentReady(targetId)) return '';
  const chat = chatContext(index);
  if (chat.cliId && chat.cliId !== targetId && cliAgentReady(chat.cliId)) return '';
  return '<div class="vr-cli-connect-expand" data-chat-index="' + String(index) + '">' +
    '<p>Finish connecting <strong>' + escapeHtml(targetAgent.label) + '</strong> in the <button type="button" data-studio-tab="terminal">Terminal</button> tab.</p>' +
    (demo.cliProbeMessage ? '<em>' + escapeHtml(demo.cliProbeMessage) + '</em>' : '') +
  '</div>';
}

function CliConnectPanel(index) {
  if (!demo.cliSetupComplete) return '';
  const codingAgents = cliAgents.filter((agent) => agent.id !== 'terminal');
  return '<section class="vr-cli-connect" aria-label="Connected coding CLI">' +
    '<div class="vr-cli-strip">' + codingAgents.map((agent) => CliAgentButton(agent, index)).join('') + '</div>' +
    CliConnectExpand(index) +
    '</section>';
}

function normalizeModelId(label) {
  return String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function allModelOptions(index) {
  const chat = chatContext(index);
  const selectedCli = chat.cliId || demo.selectedCliId;
  const connectedAgents = cliAgents.filter((item) => item.id !== 'terminal' && cliAgentReady(item.id));
  const agent = connectedAgents.find((item) => item.id === selectedCli) || connectedAgents[0] || cliAgents[0];
  const modelCliId = agent?.id || selectedCli;
  return (cliModels[modelCliId] || cliModels[selectedCli] || cliModels.codex).map((label) => ({
    cliId: modelCliId,
    label,
    id: normalizeModelId(label),
  }));
}

function selectedModelLabel(index) {
  const chat = chatContext(index || 0);
  const option = allModelOptions(index || 0).find((item) => item.id === chat.modelId);
  if (option) return option.label;
  const models = cliModels[chat.cliId] || cliModels.codex;
  return models[0];
}

async function silentProbeCliConnection(agentId, chatIndex) {
  if (!agentId || agentId === 'terminal') return false;
  try {
    const response = await fetch('/api/cli-agents/probe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cliId: agentId }),
    });
    if (!response.ok) return cliAgentReady(agentId);
    const payload = await response.json();
    const ready = Boolean(payload && (payload.ready === true || (payload.ready === undefined && payload.connected === true)));
    if (ready) {
      connectCliAgent(agentId, chatIndex || 0, { completeSetup: true });
      return true;
    }
    return false;
  } catch {
    return cliAgentReady(agentId);
  }
}

async function restoreCliConnections() {
  const readyIds = Object.keys(demo.cliSessionReady).filter((id) => demo.cliSessionReady[id] === true && id !== 'terminal');
  if (!readyIds.length) return;
  demo.cliSetupComplete = true;
  demo.cliConnected = true;
  if (!readyIds.includes(demo.selectedCliId)) demo.selectedCliId = readyIds[0];
  demo.chatContexts.forEach((context, index) => {
    const chat = chatContext(index);
    if (!readyIds.includes(chat.cliId)) chat.cliId = readyIds[0];
  });
  demo.cliConnectTargetId = null;
  demo.cliLastConnectTargetId = null;
  for (const agentId of readyIds) {
    await silentProbeCliConnection(agentId, 0);
  }
}

async function hydrateCliAgents(options) {
  if (typeof fetch !== 'function') return;
  const forceFresh = options && options.forceFresh === true;
  try {
    demo.simulateFresh = forceFresh || studioFreshQuery() === '?fresh=1';
    const response = await fetch('/api/cli-agents' + (demo.simulateFresh ? '?fresh=1' : ''));
    if (!response.ok) return;
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.agents)) return;
    const nextAgents = payload.agents.filter((agent) => agent && typeof agent.id === 'string' && typeof agent.label === 'string');
    if (nextAgents.length === 0) return;
    cliAgents = nextAgents.map((agent) => {
      const installed = agent.installed !== false || agent.connected !== false;
      return {
      id: agent.id,
      label: agent.label,
      caption: installed ? (cliAgentReady(agent.id) ? agent.caption : 'Sign in to use ' + agent.label) : 'Install or sign in with ' + agent.label,
      tone: agent.tone || 'green',
      connected: agent.connected !== false,
      installed,
      source: agent.source || 'fallback',
      setup: agent.setup || cliSetupFor(agent.id),
    };
    });
    demo.simulateFresh = payload.simulateFresh === true || demo.simulateFresh;
    cliModels = nextAgents.reduce((acc, agent) => {
      acc[agent.id] = Array.isArray(agent.models) && agent.models.length > 0 ? agent.models : (cliModels[agent.id] || cliModels.codex);
      return acc;
    }, { ...cliModels });
    const readyAgents = cliAgents.filter((agent) => agent.id !== 'terminal' && cliAgentReady(agent.id));
    const installedAgents = cliAgents.filter((agent) => agent.id !== 'terminal' && cliAgentInstalled(agent));
    const selected = payload.selectedCliId && readyAgents.some((agent) => agent.id === payload.selectedCliId) && cliModels[payload.selectedCliId]
      ? payload.selectedCliId
      : (readyAgents.find((agent) => agent.id === demo.selectedCliId)?.id || readyAgents[0]?.id || installedAgents[0]?.id || demo.selectedCliId);
    demo.selectedCliId = selected;
    const models = cliModels[selected] || cliModels.codex;
    if (!models.map(normalizeModelId).includes(demo.selectedModelId)) {
      demo.selectedModelId = normalizeModelId(models[0]);
    }
    demo.chatContexts.forEach((context, index) => {
      const chat = chatContext(index);
      const ready = readyAgents.some((agent) => agent.id === chat.cliId);
      if (!ready || !cliModels[chat.cliId]) chat.cliId = selected;
      const chatModels = cliModels[chat.cliId] || models;
      if (!chatModels.map(normalizeModelId).includes(chat.modelId)) chat.modelId = normalizeModelId(chatModels[0]);
    });
    demo.cliConnected = cliAgentReady(demo.selectedCliId);
    demo.cliAgentsHydrated = true;
    if (!demo.simulateFresh && readyAgents.length > 0) {
      demo.cliSetupComplete = true;
    }
    if (!demo.simulateFresh) {
      await restoreCliConnections();
    }
    render();
  } catch {
    // Keep the static preview state when local CLI detection is unavailable.
  }
}

async function probeCliConnection(agentId, chatIndex, finishSetup) {
  if (!agentId || agentId === 'terminal') return;
  const laneIndex = Math.max(0, Number(chatIndex) || 0);
  setConnectTarget(agentId);
  demo.cliProbeStatus = 'probing';
  demo.cliProbeMessage = 'Verifying install and sign-in for ' + agentId + '...';
  demo.activeStudioTab = 'terminal';
  render();
  try {
    const response = await fetch('/api/cli-agents/probe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cliId: agentId }),
    });
    const payload = response.ok ? await response.json() : null;
    const ready = Boolean(payload && (payload.ready === true || (payload.ready === undefined && payload.connected === true)));
    const installed = Boolean(payload && (payload.installed === true || payload.connected === true || ready));
    demo.cliProbeStatus = ready ? 'success' : 'failed';
    demo.cliProbeMessage = payload && payload.message ? payload.message : ready
      ? agentId + ' is ready for chat.'
      : installed
        ? agentId + ' is installed but not signed in. Run sign in, then test again.'
        : agentId + ' was not detected. Run install, then test again.';
    if (payload && payload.output) {
      appendTerminalLines(['--- test connection ---', String(payload.output), '']);
    }
    if (ready) {
      connectCliAgent(agentId, laneIndex, { completeSetup: !demo.cliSetupComplete, keepProbeState: true });
      if (finishSetup !== false) {
        demo.cliConnectCompleteAgentId = agentId;
        demo.activeModal = 'connect-complete';
        demo.notice = (cliAgents.find((item) => item.id === agentId)?.label || agentId) + ' verified. Start chatting or reset if something looks wrong.';
      }
    } else {
      setConnectTarget(agentId);
    }
  } catch {
    demo.cliProbeStatus = 'failed';
    demo.cliProbeMessage = 'Could not reach the local CLI probe. Restart VibeRaven Studio and try again.';
    setConnectTarget(agentId);
  }
  render();
}

async function runCliInstall(agentId, chatIndex) {
  const laneIndex = Math.max(0, Number(chatIndex) || 0);
  const agent = cliAgents.find((item) => item.id === agentId);
  setConnectTarget(agentId);
  demo.pickerChatIndex = laneIndex;
  demo.activeStudioTab = 'terminal';
  demo.cliTerminalTitle = 'Install ' + (agent?.label || agentId);
  demo.cliTerminalLines = ['Running install for ' + (agent?.label || agentId) + '...', ''];
  render();
  try {
    const response = await fetch('/api/cli-agents/run-setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cliId: agentId, step: 'install' }),
    });
    const payload = response.ok ? await response.json() : null;
    demo.cliTerminalLines = [
      '$ ' + (payload?.command || setupCommandFallback(agentId, 'install')),
      '',
      String(payload?.output || payload?.message || 'Install finished.'),
      '',
      'Next: click Run sign in, complete login, then Test connection.'
    ];
    demo.cliTerminalDraft = setupCommandFallback(agentId, 'sign-in');
    demo.notice = payload?.exitCode === 0 ? 'Install finished in Studio terminal. Run sign in next.' : 'Install finished with warnings. Check Studio terminal output.';
  } catch {
    demo.cliTerminalLines = ['Install could not run from Studio.', 'Type the install command manually in the terminal below, then sign in.'];
    demo.notice = 'Studio could not run the install command.';
  }
  render();
}

function setupCommandFallback(agentId, step) {
  const setup = cliSetupFor(agentId);
  return step === 'install' ? setup.installCommand : setup.signInCommand;
}

async function runCliSignInInStudio(agentId, chatIndex) {
  const laneIndex = Math.max(0, Number(chatIndex) || 0);
  const agent = cliAgents.find((item) => item.id === agentId);
  setConnectTarget(agentId);
  demo.pickerChatIndex = laneIndex;
  demo.activeStudioTab = 'terminal';
  demo.cliTerminalTitle = 'Sign in to ' + (agent?.label || agentId);
  appendTerminalLines(['Running sign-in for ' + (agent?.label || agentId) + '...', '']);
  render();
  try {
    const response = await fetch('/api/cli-agents/run-setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cliId: agentId, step: 'sign-in' }),
    });
    const payload = response.ok ? await response.json() : null;
    appendTerminalLines([
      '$ ' + (payload?.command || setupCommandFallback(agentId, 'sign-in')),
      '',
      String(payload?.output || payload?.message || 'Sign-in command finished.'),
      payload?.interactiveNote ? String(payload.interactiveNote) : '',
      '',
      'Complete any browser login, then click Test connection.'
    ]);
    demo.cliTerminalDraft = setupCommandFallback(agentId, 'sign-in');
    demo.notice = 'Sign-in ran in Studio terminal. Finish login if prompted, then test the connection.';
  } catch {
    appendTerminalLines(['Sign-in could not run from Studio.', 'Type the sign-in command below manually.']);
    demo.notice = 'Studio could not run the sign-in command.';
  }
  render();
}

async function openCliOsTerminal(agentId, chatIndex) {
  const laneIndex = Math.max(0, Number(chatIndex) || 0);
  const agent = cliAgents.find((item) => item.id === agentId);
  setConnectTarget(agentId);
  demo.pickerChatIndex = laneIndex;
  demo.activeStudioTab = 'terminal';
  demo.cliTerminalTitle = 'Sign in to ' + (agent?.label || agentId);
  appendTerminalLines(['Opening OS terminal for interactive sign-in fallback...', '']);
  render();
  try {
    const response = await fetch('/api/cli-agents/open-terminal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cliId: agentId, step: 'sign-in' }),
    });
    const payload = response.ok ? await response.json() : null;
    appendTerminalLines([
      '$ ' + (payload?.command || setupCommandFallback(agentId, 'sign-in')),
      '',
      String(payload?.message || 'Complete sign-in in the OS terminal window that opened.'),
      '',
      'When login finishes, return here and click Test connection.'
    ]);
    demo.notice = payload?.ok ? 'OS terminal opened for sign-in fallback.' : 'Could not open an OS terminal window.';
  } catch {
    appendTerminalLines(['Could not open an OS terminal window.', 'Type the sign-in command in the Studio terminal below.']);
    demo.notice = 'Could not open an OS terminal window.';
  }
  render();
}

function ModelPicker(index) {
  const chat = chatContext(index);
  const models = allModelOptions(index);
  const selectedModel = selectedModelLabel(index);
  const scoped = demo.pickerChatIndex === index;
  const access = accessModes.find((mode) => mode.id === chat.accessMode) || accessModes[1];
  return '<div class="vr-model-picker">' +
    '<button type="button" data-action="toggle-reasoning" data-chat-index="' + String(index) + '"><span>Reasoning</span><strong>' + escapeHtml(chat.reasoning) + '</strong><i></i></button>' +
    '<button type="button" data-action="toggle-models" data-chat-index="' + String(index) + '"><span>Model</span><strong>' + escapeHtml(selectedModel) + '</strong><i></i></button>' +
    '<button type="button" data-action="toggle-context" data-chat-index="' + String(index) + '"><span>Context</span><strong>' + escapeHtml(chat.context) + '</strong><i></i></button>' +
    '<button type="button" data-action="toggle-access" data-chat-index="' + String(index) + '"><span>Access</span><strong>' + escapeHtml(access.label) + '</strong><i></i></button>' +
    (scoped && demo.reasoningMenuOpen ? '<div class="vr-model-menu is-reasoning" role="menu"><p>Reasoning</p>' + reasoningLevels.map((level) =>
      '<button type="button" data-reasoning="' + escapeHtml(level) + '" data-chat-index="' + String(index) + '">' + escapeHtml(level) + (chat.reasoning === level ? '<b></b>' : '') + '</button>'
    ).join('') + '</div>' : '') +
    (scoped && demo.modelMenuOpen ? '<div class="vr-model-menu is-models" role="menu"><p>Model</p>' + models.map((model) =>
      '<button type="button" data-model="' + escapeHtml(model.id) + '" data-chat-index="' + String(index) + '"><span><strong>' + escapeHtml(model.label) + '</strong></span>' + (selectedModel === model.label ? '<b></b>' : '') + '</button>'
    ).join('') + '</div>' : '') +
    (scoped && demo.contextMenuOpen ? '<div class="vr-model-menu is-context" role="menu"><p>Context</p>' + contextLevels.map((level) =>
      '<button type="button" data-context="' + escapeHtml(level) + '" data-chat-index="' + String(index) + '">' + escapeHtml(level) + (chat.context === level ? '<b></b>' : '') + '</button>'
    ).join('') + '</div>' : '') +
    (scoped && demo.accessMenuOpen ? '<div class="vr-model-menu is-access" role="menu"><p>Access</p>' + accessModes.map((mode) =>
      '<button type="button" data-access-mode="' + escapeHtml(mode.id) + '" data-chat-index="' + String(index) + '"><span><strong>' + escapeHtml(mode.label) + '</strong><em>' + escapeHtml(mode.description) + '</em></span>' + (chat.accessMode === mode.id ? '<b></b>' : '') + '</button>'
    ).join('') + '</div>' : '') +
    '</div>';
}

function ChatBlockersSummary(cards) {
  const blockers = Array.isArray(cards.blockers) ? cards.blockers : [];
  const count = typeof cards.blockerCount === 'number' ? cards.blockerCount : blockers.length;
  if (!blockers.length) return '';
  return '<section><header><strong>Blockers Summary</strong><b>' + String(count) + ' blocking</b></header>' +
    blockers.map((blocker) =>
      '<span><i data-tone="' + escapeHtml(blocker.tone || 'neutral') + '"></i><em>' + escapeHtml(blocker.title || 'Launch blocker') +
      (blocker.detail ? '<small>' + escapeHtml(blocker.detail) + '</small>' : '') +
      '</em><b>' + escapeHtml(blocker.category || 'Quality') + '</b></span>'
    ).join('') +
    '</section>';
}

function ChatPlanCard(steps, chatIndex) {
  const rows = Array.isArray(steps) ? steps : [];
  if (!rows.length) return '';
  return '<section class="vr-chat-card vr-chat-plan-card"><header><strong>Fix plan</strong><b>' + String(rows.length) + ' actions</b></header><ol class="vr-chat-plan-list">' +
    rows.map((step, index) =>
      '<li><button class="vr-plan-step" type="button" data-action="mission-step" data-step-id="' + escapeHtml(step.id || ('step-' + String(index))) + '" data-chat-index="' + String(chatIndex) + '">' +
        '<span class="vr-plan-step-num"></span>' +
        '<span class="vr-plan-step-body">' +
          '<span class="vr-plan-step-title">' + escapeHtml(step.title || 'Fix step') + '</span>' +
          '<span class="vr-plan-step-tag">' + escapeHtml(step.category || 'Quality') + '</span>' +
        '</span>' +
        '<span class="vr-plan-step-go">' + Icon('chevronRight') + '</span>' +
      '</button></li>'
    ).join('') +
    '</ol></section>';
}

function ChatProviderConnectCard(connectProviders, chatIndex) {
  const rows = Array.isArray(connectProviders) ? connectProviders : [];
  if (!rows.length) return '';
  return '<section class="vr-chat-card vr-chat-connect-card"><header><strong>Connect Providers</strong><b>' + String(rows.length) + ' needed</b></header><div class="vr-chat-card-list">' +
    rows.map((provider) =>
      '<span data-tone="warn"><i></i><em>' + escapeHtml(provider.name || provider.id || 'Provider') + '<small>' + escapeHtml(provider.status || 'missing') + '</small></em><b>Provider</b>' +
      '<button type="button" data-action="connect-provider" data-provider-id="' + escapeHtml(provider.id || '') + '" data-chat-index="' + String(chatIndex) + '">Connect</button>' +
      (provider.dashboardUrl ? '<a class="vr-chat-connect-dashboard" href="' + escapeHtml(provider.dashboardUrl) + '" target="_blank" rel="noreferrer">Dashboard</a>' : '') +
      '</span>'
    ).join('') +
    '</div></section>';
}

function ChatMissionCards(cards, chatIndex, options) {
  if (!cards) return '';
  const opts = options || {};
  const blockers = Array.isArray(cards.blockers) ? cards.blockers : [];
  const planSteps = Array.isArray(cards.planSteps) ? cards.planSteps : [];
  const connectProviders = Array.isArray(cards.connectProviders) ? cards.connectProviders : [];
  const showPlan = Boolean(opts.showPlan || demo.fixPlanExpandedChatIndex === chatIndex);
  if (!blockers.length && !connectProviders.length && !planSteps.length) return '';
  let html = '<div class="vr-chat-mission-summary">';
  if (blockers.length) html += ChatBlockersSummary(cards);
  if (showPlan && planSteps.length) html += ChatPlanCard(planSteps, chatIndex);
  if (connectProviders.length) html += ChatProviderConnectCard(connectProviders, chatIndex);
  if (planSteps.length && !showPlan) {
    html += '<button class="vr-chat-plan-row" type="button" data-action="view-fix-plan" data-chat-index="' + String(chatIndex) + '">' + Icon('report') + '<strong>View fix plan</strong><em>' + String(planSteps.length) + ' actions</em><b></b></button>';
  }
  html += '</div>';
  return html;
}

function ChatTaskAnimation(chatIndex, compact) {
  const chat = chatContext(chatIndex);
  const task = chat.activeTask;
  if (!task || task.phase !== 'working') return '';
  const meta = taskMeta(task.kind);
  const statusText = task.kind === 'verify' ? 'Verifying...' : task.kind === 'diff' ? 'Reviewing...' : task.kind === 'explain' ? 'Explaining...' : 'Effecting...';
  const thoughtText = 'thinking';
  const compactClass = compact ? ' is-compact' : '';
  const rail = compact ? '' : '<div class="vr-task-rail" aria-hidden="true"><span></span></div>';
  const detail = compact ? '' : '<p>' + escapeHtml(meta.line) + '</p>';
  return '<section class="vr-chat-agent-task is-working' + compactClass + '" data-task="' + escapeHtml(task.kind) + '">' +
    '<header><span class="vr-task-glyph" aria-hidden="true"></span><div><strong>' + escapeHtml(statusText) + '</strong><em>(' + escapeHtml(thoughtText) + ' for launch)</em></div><b>' + escapeHtml(meta.title) + '</b></header>' +
    rail +
    detail +
    '</section>';
}

function formatAgentOutput(value) {
  let clean = String(value || '').replace(/\\r\\n/g, '\\n').trim();
  clean = clean
    .split('\\n')
    .filter((line) => !/^\\d{4}-\\d{2}-\\d{2}T.*\\s(WARN|ERROR)\\s/.test(line))
    .filter((line) => !/^(OpenAI Codex v|workdir:|model:|provider:|approval:|sandbox:|reasoning effort:|reasoning summaries:|session id:|--------$|user$)/.test(line.trim()))
    .join('\\n')
    .trim();
  if (/IneligibleTierError|UNSUPPORTED_CLIENT|no longer supported for Gemini Code Assist/i.test(clean)) {
    return 'Gemini CLI is installed, but this account/client is not eligible for the current Gemini Code Assist CLI. Connect a supported Gemini CLI account, then retry this chat.';
  }
  if (/not running in a trusted directory|--skip-trust|GEMINI_CLI_TRUST_WORKSPACE/i.test(clean)) {
    return 'Gemini CLI needs this project trusted for headless chat. VibeRaven now passes the trust flag for Gemini runs; retry after your Gemini account is eligible.';
  }
  if (/command not found|not recognized as an internal or external command|ENOENT/i.test(clean)) {
    return 'The selected CLI is not available on PATH. Install it or sign in, then reconnect it from the chat header.';
  }
  if (/authentication|not logged in|login required|sign in/i.test(clean)) {
    return 'The selected CLI needs sign-in before VibeRaven can use it. Sign in with the CLI, then retry this mission.';
  }
  const missionIndex = clean.indexOf('User mission:');
  if (missionIndex >= 0) {
    const afterMission = clean.slice(missionIndex + 'User mission:'.length).trim();
    if (afterMission && afterMission.length < clean.length) clean = afterMission;
  }
  if (!clean) return 'Ready for the next safe action.';
  return clean;
}

function agentVerifyButton(chatIndex) {
  return '<button type="button" class="vr-agent-inline-action is-primary" data-action="verify-now" data-chat-index="' + String(chatIndex) + '">' + Icon('shield') + '<span>Verify</span></button>';
}

function agentLinkButton(label, url) {
  return '<a class="vr-agent-inline-action" href="' + escapeHtml(url) + '" target="_blank" rel="noreferrer">' + Icon('external') + '<span>' + escapeHtml(label) + '</span></a>';
}

function agentApplyFixButton(chatIndex) {
  return '<button type="button" class="vr-agent-inline-action is-primary" data-action="start-agent-fix" data-chat-index="' + String(chatIndex) + '">' + Icon('agent') + '<span>Apply fix</span></button>';
}

function linkLabelForUrl(url) {
  const lower = String(url).toLowerCase();
  if (lower.includes('sentry.io')) return 'Open Sentry';
  if (lower.includes('supabase.com')) return 'Open Supabase';
  if (lower.includes('vercel.com')) return 'Open Vercel';
  if (lower.includes('stripe.com')) return 'Open Stripe';
  if (lower.includes('dashboard')) return 'Open dashboard';
  return 'Open link';
}

function stripVerifyCommandText(text) {
  const tick = String.fromCharCode(96);
  const cmd = '(?:' + tick + ')?npx(?:\\s+-y)?\\s+viberaven(?:\\s+--verify|\\s+verify)[^' + tick + '.]*(?:' + tick + ')?';
  return String(text || '')
    .replace(new RegExp(',?\\s*then run\\s+' + cmd + '\\.?', 'gi'), '.')
    .replace(new RegExp('run\\s+' + cmd + '\\s+once[^.]*\\.?', 'gi'), '')
    .replace(new RegExp(cmd, 'gi'), '')
    .replace(/\\s{2,}/g, ' ')
    .replace(/\\.\\s*\\./g, '.')
    .trim();
}

function inlineAgentMarkdown(line, chatIndex) {
  const tick = String.fromCharCode(96);
  let raw = String(line || '');
  const actions = [];
  const verifyPattern = new RegExp('npx(?:\\s+-y)?\\s+viberaven(?:\\s+--verify|\\s+verify)[^\\s,.' + tick + ']*', 'gi');
  raw = raw.replace(new RegExp(tick + 'npx[^' + tick + ']*viberaven[^' + tick + ']*' + tick, 'gi'), () => {
    actions.push('verify');
    return '';
  });
  raw = raw.replace(verifyPattern, () => {
    actions.push('verify');
    return '';
  });
  raw = raw.replace(/https?:\\/\\/[^\\s,)]+/g, (url) => {
    actions.push('link:' + url);
    return '';
  });
  raw = stripVerifyCommandText(raw);
  let html = escapeHtml(raw.trim());
  html = html.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
  html = html.replace(new RegExp(tick + '([^' + tick + ']+)' + tick, 'g'), '<code>$1</code>');
  if (actions.length) {
    const actionHtml = actions.map((token) => {
      if (token === 'verify') return agentVerifyButton(chatIndex);
      if (token.indexOf('link:') === 0) {
        const url = token.slice(5);
        return agentLinkButton(linkLabelForUrl(url), url);
      }
      return '';
    }).filter(Boolean).join('');
    html = (html ? html + ' ' : '') + '<span class="vr-agent-inline-actions">' + actionHtml + '</span>';
  }
  return html || '<span class="vr-agent-muted">—</span>';
}

function renderAgentListItems(items, chatIndex) {
  return items.map((item) => '<li>' + inlineAgentMarkdown(item, chatIndex) + '</li>').join('');
}

function normalizeAgentSectionKey(raw) {
  const key = String(raw || '').trim().toLowerCase().replace(/\\s*\\(\\d+\\)\\s*$/, '').trim();
  if (/^(gate|production gate)$/.test(key)) return null;
  if (/^(blockers?|launch blockers?)$/.test(key)) return 'Blockers';
  if (/^(suggested steps?|fix plan)$/.test(key)) return 'Suggested steps';
  if (/^(summary|tl;dr|tldr)$/.test(key)) return 'Summary';
  if (key === 'findings') return 'Findings';
  if (key === 'changes made') return 'Changes made';
  if (key === 'files touched') return 'Files touched';
  if (key === 'next step') return 'Next step';
  return null;
}

function dedupeAgentMarkdownBody(text, cards) {
  if (!cards) return String(text || '');
  let result = String(text || '');
  const blockers = Array.isArray(cards.blockers) ? cards.blockers : [];
  const planSteps = Array.isArray(cards.planSteps) ? cards.planSteps : [];
  if (!blockers.length && !planSteps.length) return result;
  const lines = result.split('\\n');
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    for (let i = 0; i < blockers.length; i += 1) {
      const title = String(blockers[i].title || '').trim();
      if (title && trimmed.indexOf(title) >= 0) return false;
    }
    for (let j = 0; j < planSteps.length; j += 1) {
      const stepTitle = String(planSteps[j].title || '').trim();
      if (stepTitle && trimmed.indexOf(stepTitle) >= 0) return false;
    }
    return true;
  });
  return filtered.join('\\n').replace(/\\n{3,}/g, '\\n\\n').trim();
}

function AgentGateStrip(gateText, gateState) {
  return '';
}

function parseAgentSections(text, options) {
  const opts = options || {};
  const skipPlanSections = Boolean(opts.skipPlanSections);
  const lines = String(text || '').split('\\n');
  const sections = [];
  let current = null;

  function pushSection(name, bodyLines) {
    const items = [];
    const paragraphs = [];
    bodyLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const bullet = trimmed.match(/^[-*]\\s+(.*)$/);
      const ordered = trimmed.match(/^\\d+[.)]\\s+(.*)$/);
      if (bullet) items.push(bullet[1]);
      else if (ordered) items.push(ordered[1]);
      else paragraphs.push(trimmed);
    });
    sections.push({ name, items, paragraphs });
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    const heading = trimmed.match(/^#{1,3}\\s+(.+)$/) || trimmed.match(/^\\*\\*([^*]+)\\*\\*$/) || trimmed.match(/^\\d+[.)]\\s+\\*\\*([^*]+)\\*\\*$/);
    if (heading) {
      const normalized = normalizeAgentSectionKey(heading[1]);
      if (normalized) {
        if (skipPlanSections && normalized === 'Suggested steps') return;
        if (current) pushSection(current.name, current.lines);
        current = { name: normalized, lines: [] };
        return;
      }
    }
    if (current) current.lines.push(line);
  });
  if (current) pushSection(current.name, current.lines);
  return sections.length >= 2 ? sections : null;
}

function renderAgentSectionCard(section, chatIndex) {
  const name = section.name;
  const lower = name.toLowerCase();
  if (lower === 'gate') {
    return '';
  }
  const isNext = lower === 'next step';
  const isBlockers = lower === 'blockers';
  const isSummary = lower === 'summary';
  const bodyParts = [];
  if (section.paragraphs.length) {
    bodyParts.push(section.paragraphs.map((p) => '<p>' + inlineAgentMarkdown(p, chatIndex) + '</p>').join(''));
  }
  if (section.items.length) {
    const listClass = isBlockers ? 'vr-agent-list is-blockers' : 'vr-agent-list';
    bodyParts.push('<ul class="' + listClass + '">' + renderAgentListItems(section.items, chatIndex) + '</ul>');
  }
  let footer = '';
  if (isNext) {
    const blob = section.items.concat(section.paragraphs).join(' ').toLowerCase();
    const actions = [];
    if (/fix|wire|implement|add|configure|apply|sentry|monitor/.test(blob)) actions.push(agentApplyFixButton(chatIndex));
    if (blob.includes('sentry')) actions.push(agentLinkButton('Open Sentry', providerDashboardUrls.sentry || 'https://sentry.io'));
    if (blob.includes('supabase')) actions.push(agentLinkButton('Open Supabase', providerDashboardUrls.supabase || 'https://supabase.com/dashboard/projects'));
    if (blob.includes('vercel')) actions.push(agentLinkButton('Open Vercel', providerDashboardUrls.vercel || 'https://vercel.com/dashboard'));
    if (/npx|viberaven|verify|re-run|gate-result/.test(blob)) actions.push(agentVerifyButton(chatIndex));
    if (!actions.length) actions.push(agentVerifyButton(chatIndex));
    footer = '<div class="vr-agent-section-actions">' + actions.join('') + '</div>';
  }
  const sectionClass = 'vr-agent-section' + (isBlockers ? ' is-blockers' : isSummary ? ' is-summary' : '');
  return '<article class="' + sectionClass + '"><h4 class="vr-agent-heading">' + escapeHtml(name) + '</h4>' +
    (bodyParts.join('') || '<p class="vr-agent-muted">No details yet.</p>') +
    footer +
  '</article>';
}

function renderAgentAnswerHtml(rawText, chatIndex, cards) {
  const tick = String.fromCharCode(96);
  const fence = tick + tick + tick;
  const text = formatAgentOutput(rawText);
  if (!text) return '<div class="vr-agent-answer-body"><p class="vr-agent-empty">Ready for the next safe action.</p></div>';
  let visibleText = dedupeAgentMarkdownBody(text, cards);
  const hasMissionPlanSteps = Boolean(cards && Array.isArray(cards.planSteps) && cards.planSteps.length);
  const structured = parseAgentSections(visibleText, { skipPlanSections: hasMissionPlanSteps });
  if (structured) {
    const sectionCards = structured.map((section) => renderAgentSectionCard(section, chatIndex)).join('');
    return '<div class="vr-agent-answer-body vr-agent-answer-structured"><div class="vr-agent-sections">' + sectionCards + '</div></div>';
  }
  const blocks = [];
  let listType = null;
  let listItems = [];
  let codeLines = [];
  let inCode = false;

  function flushList() {
    if (!listType || !listItems.length) return;
    blocks.push('<' + listType + ' class="vr-agent-list">' + listItems.map((item) => '<li>' + item + '</li>').join('') + '</' + listType + '>');
    listType = null;
    listItems = [];
  }

  function flushCode() {
    if (!codeLines.length) return;
    blocks.push('<pre class="vr-agent-code"><code>' + escapeHtml(codeLines.join('\\n')) + '</code></pre>');
    codeLines = [];
  }

  visibleText.split('\\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith(fence)) {
      flushList();
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
      }
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }
    if (!trimmed) {
      flushList();
      return;
    }
    if (/^#{1,3}\\s+/.test(trimmed)) {
      flushList();
      blocks.push('<h4 class="vr-agent-heading">' + inlineAgentMarkdown(trimmed.replace(/^#{1,3}\\s+/, ''), chatIndex) + '</h4>');
      return;
    }
    if (/^\\*\\*[^*]+\\*\\*$/.test(trimmed)) {
      flushList();
      blocks.push('<h4 class="vr-agent-heading">' + inlineAgentMarkdown(trimmed.replace(/^\\*\\*|\\*\\*$/g, ''), chatIndex) + '</h4>');
      return;
    }
    const ordered = trimmed.match(/^\\d+[.)]\\s+(.*)$/);
    if (ordered) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(inlineAgentMarkdown(ordered[1], chatIndex));
      return;
    }
    if (/^[-*]\\s+/.test(trimmed)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(inlineAgentMarkdown(trimmed.replace(/^[-*]\\s+/, ''), chatIndex));
      return;
    }
    flushList();
    blocks.push('<p>' + inlineAgentMarkdown(trimmed, chatIndex) + '</p>');
  });
  flushList();
  if (inCode) flushCode();

  const body = blocks.join('') || ('<p>' + inlineAgentMarkdown(visibleText, chatIndex) + '</p>');
  return '<div class="vr-agent-answer-body">' + body + '</div>';
}

function AgentFollowUpButton(spec, chatIndex) {
  return '<button type="button" class="' + (spec.primary ? 'is-primary' : '') + '" data-action="' + escapeHtml(spec.action) + '" data-chat-index="' + String(chatIndex) + '">' +
    Icon(spec.icon) + '<span>' + escapeHtml(spec.label) + '</span></button>';
}

function AgentActionRow(specs, chatIndex) {
  const seen = new Set();
  let primaryUsed = false;
  const deduped = [];
  (specs || []).forEach((spec) => {
    if (!spec || !spec.action || seen.has(spec.action)) return;
    seen.add(spec.action);
    let primary = Boolean(spec.primary);
    if (primary && primaryUsed) primary = false;
    if (primary) primaryUsed = true;
    deduped.push({ action: spec.action, label: spec.label, icon: spec.icon, primary: primary });
  });
  if (!deduped.length) return '';
  return '<div class="vr-agent-followups">' + deduped.slice(0, 4).map((spec) => AgentFollowUpButton(spec, chatIndex)).join('') + '</div>';
}

function AgentResponseFollowUps(kind, isError, chatIndex) {
  // Follow-ups always show — structured sections do not suppress the action row.
  if (isError) {
    return AgentActionRow([
      { action: 'start-agent-fix', label: 'Retry fix', icon: 'refresh', primary: true },
      { action: 'terminal-tab', label: 'Terminal', icon: 'shell' },
    ], chatIndex);
  }
  const specs = {
    plan: [
      { action: 'start-agent-fix', label: 'Apply fix', icon: 'agent', primary: true },
      { action: 'verify-now', label: 'Verify', icon: 'shield' },
      { action: 'view-fix-plan', label: 'View plan', icon: 'report' },
    ],
    fix: [
      { action: 'show-diff', label: 'Review diff', icon: 'code', primary: true },
      { action: 'verify-now', label: 'Verify', icon: 'shield' },
    ],
    verify: [
      { action: 'recheck', label: 'Re-check gate', icon: 'refresh', primary: true },
    ],
    analyze: [
      { action: 'plan', label: 'Build plan', icon: 'report', primary: true },
      { action: 'start-agent-fix', label: 'Apply fix', icon: 'agent' },
    ],
    provider: [
      { action: 'verify-now', label: 'Verify', icon: 'shield', primary: true },
    ],
    explain: [
      { action: 'show-diff', label: 'Review diff', icon: 'code', primary: true },
    ],
    diff: [
      { action: 'show-diff', label: 'Review diff', icon: 'code', primary: true },
      { action: 'verify-now', label: 'Verify', icon: 'shield' },
    ],
  };
  const items = specs[kind] || [{ action: 'verify-now', label: 'Verify', icon: 'shield', primary: true }];
  return AgentActionRow(items, chatIndex);
}

function readOnlyContextChipsHtml(providerId, releaseId) {
  const provider = providerId ? providers.find((item) => item.id === providerId) : null;
  const release = releaseId ? releases.find((item) => item.id === releaseId) : null;
  if (!provider && !release) return '';
  return (provider ? contextChipHtml({
    kind: 'provider',
    index: 0,
    id: provider.id,
    iconHtml: provider.iconHtml || '<img src="' + providerAssetSrc(provider) + '" alt="" />',
    mutedLabel: provider.area,
    label: provider.name,
    readOnly: true,
  }) : '') +
  (release ? contextChipHtml({
    kind: 'release',
    index: 0,
    id: release.id,
    iconHtml: contextIconChip('repo'),
    mutedLabel: 'Version',
    label: release.label,
    readOnly: true,
  }) : '');
}

function ChatAgentResponse(meta, responseText, isError, providerId, releaseId, kind, chatIndex, messageId, cards, cardsOptions) {
  const contextChips = readOnlyContextChipsHtml(providerId, releaseId);
  const contextLine = contextChips
    ? '<div class="vr-agent-context-line">' + contextChips + '</div>'
    : '';
  const cardsHtml = cards ? ChatMissionCards(cards, chatIndex, cardsOptions || {}) : '';
  return '<section class="vr-chat-message is-agent vr-chat-agent-response ' + (isError ? 'is-error' : 'is-ready') + '">' +
    '<div><span><img src="' + mascotUrl() + '" alt="" /></span><p><strong>VibeRaven Agent</strong><em>Just now</em></p></div>' +
    '<div class="vr-agent-response-meta"><span class="vr-agent-thinking-label">' + escapeHtml(isError ? 'Needs attention' : meta.title) + '</span></div>' +
    contextLine +
    '<div class="vr-agent-response-stack">' +
    cardsHtml +
    renderAgentAnswerHtml(responseText, chatIndex, cards) +
    AgentResponseFollowUps(kind, isError, chatIndex) +
    '</div>' +
    '</section>';
}

function SentContextPills(providerId, releaseId) {
  const chips = readOnlyContextChipsHtml(providerId, releaseId);
  if (!chips) return '';
  return '<div class="vr-sent-context">' + chips + '</div>';
}

function renderChatMessages(chat, index) {
  const html = (chat.messages || []).map((message, messageIndex) => {
    if (message.role === 'user') {
      return '<section class="vr-chat-message is-user"><p>' + escapeHtml(message.text) + '</p>' + SentContextPills(message.providerId, message.releaseId) + '</section>';
    }
    const meta = message.kind ? taskMeta(message.kind) : { title: 'VibeRaven Agent' };
    const messageId = String(index) + '-' + String(messageIndex);
    return ChatAgentResponse(meta, message.text, Boolean(message.isError), message.providerId, message.releaseId, message.kind, index, messageId, message.cards, { showPlan: demo.fixPlanExpandedChatIndex === index });
  }).join('');
  return html;
}

function ChatQuickActions(index) {
  return '<div class="vr-chat-inline-actions">' +
    quickActionButtonSpec(index).map((button) =>
      '<button type="button" class="' + (button.primary ? 'is-primary' : button.muted ? 'is-muted' : '') + '" data-chat-index="' + String(index) + '" data-action="' + escapeHtml(button.action) + '"' + (button.hint ? ' title="' + escapeHtml(button.hint) + '"' : '') + '>' +
        Icon(button.icon) + '<span>' + escapeHtml(button.label) + '</span></button>'
    ).join('') +
    '</div>';
}

function contextChipHtml(options) {
  const kind = options.kind;
  const readOnly = Boolean(options.readOnly);
  const dataAttr = readOnly ? '' : (kind === 'provider'
    ? ' data-attached-provider="' + escapeHtml(options.id) + '"'
    : ' data-attached-release="' + escapeHtml(options.id) + '"');
  const removeAction = kind === 'provider' ? 'remove-provider-context' : 'remove-release-context';
  const removeLabel = kind === 'provider' ? 'Remove provider context' : 'Remove version context';
  let chipClass = 'vr-context-chip';
  if (kind === 'release') chipClass += ' is-release';
  if (readOnly) chipClass += ' is-readonly';
  const removeBtn = readOnly ? '' : '<button class="vr-context-chip-remove" type="button" data-action="' + removeAction + '" data-chat-index="' + String(options.index) + '" aria-label="' + removeLabel + '">×</button>';
  return '<span class="' + chipClass + '"' + dataAttr + '>' +
    '<span class="vr-context-chip-icon">' + options.iconHtml + '</span>' +
    '<span class="vr-context-chip-label"><span class="muted">' + escapeHtml(options.mutedLabel) + '</span> · ' + escapeHtml(options.label) + '</span>' +
    removeBtn +
    '</span>';
}

function ContextDropZone(index, showAttached) {
  const show = showAttached !== false;
  const context = chatContext(index);
  const provider = show && context.providerId ? providers.find((item) => item.id === context.providerId) : null;
  const release = show && context.releaseId ? releases.find((item) => item.id === context.releaseId) : null;
  return '<div class="vr-provider-drop-zone ' + (demo.dropActive ? 'is-active' : '') + ((provider || release) ? ' has-provider' : '') + '" data-chat-drop="true" data-chat-index="' + String(index) + '">' +
    '<span class="vr-provider-drop-label">' + (provider || release ? 'Context attached' : 'Drop provider or version here to add context') + '</span>' +
    (provider ? contextChipHtml({
      kind: 'provider',
      index,
      id: provider.id,
      iconHtml: provider.iconHtml || '<img src="' + providerAssetSrc(provider) + '" alt="" />',
      mutedLabel: provider.area,
      label: provider.name,
    }) : '') +
    (release ? contextChipHtml({
      kind: 'release',
      index,
      id: release.id,
      iconHtml: contextIconChip('repo'),
      mutedLabel: 'Version',
      label: release.label,
    }) : '') +
    '</div>';
}

function StudioChatLane(index) {
  const provider = providers.find((item) => item.id === demo.selectedProviderId) || providers[0];
  const chat = chatContext(index);
  const agent = cliAgents.find((item) => item.id === chat.cliId) || cliAgents[0];
  const model = selectedModelLabel(index);
  const secondary = index > 0;
  const laneHasTask = laneHasActiveTask(chat);
  const fresh = !secondary && !demo.activeRecentChatId && chat.messages.length === 0 && !chat.activeTask && !chat.providerId && !chat.releaseId;
  const showFirstConnect = fresh && !demo.cliSetupComplete && index === 0;
  const introBlock = showFirstConnect
    ? ChatFirstTimeConnect(index)
    : secondary && chat.messages.length === 0
      ? '<p class="vr-chat-copy">This chat is ready for a focused release or provider follow-up.</p>'
      : '';
  const laneWorking = laneHasTask;
  const sendAction = laneWorking ? 'stop-agent' : 'send-chat-message';
  const sendIcon = laneWorking ? 'stop' : 'arrowUp';
  const sendLabel = laneWorking ? 'Stop connected agent' : 'Send mission to connected agent';
  const staticIntro = fresh
    ? '<section class="vr-chat-message is-agent"><div><span><img src="' + mascotUrl() + '" alt="" /></span><p><strong>VibeRaven Agent</strong><em>Ready</em></p></div><p>Start a production mission. Drag a provider or version into this chat, or ask what blocks launch.</p></section>'
    : '';
  return '<article class="vr-chat-lane ' + (secondary ? 'is-secondary' : 'is-primary') + '" data-chat-index="' + String(index) + '">' +
    (secondary ? '<button class="vr-chat-close" type="button" data-action="close-chat" data-chat-index="' + String(index) + '" aria-label="Close chat">' + Icon('x') + '</button>' : '') +
    CliConnectPanel(index) +
    '<div class="vr-chat-transcript" data-chat-transcript="' + String(index) + '">' +
      staticIntro +
      introBlock +
      renderChatMessages(chat, index) +
    '</div>' +
    '<footer class="vr-chat-command-bar">' +
      ChatQuickActions(index) +
      (laneHasTask ? ChatTaskAnimation(index, true) : '') +
      '<div class="vr-chat-composer" data-chat-drop="true" data-chat-index="' + String(index) + '"><textarea class="vr-chat-input" data-chat-input="' + String(index) + '" rows="2" placeholder="Ask VibeRaven anything about this deployment...">' + escapeHtml(chat.draft || '') + '</textarea>' + ContextDropZone(index, true) + ModelPicker(index) + '<button class="vr-chat-send ' + (laneWorking ? 'is-stop' : '') + '" type="button" data-action="' + sendAction + '" data-chat-index="' + String(index) + '" aria-label="' + sendLabel + '">' + Icon(sendIcon) + '</button></div>' +
    '</footer>' +
    '</article>';
}

function StudioChatView() {
  const lanes = Array.from({ length: demo.activeChatCount }, (_, index) => StudioChatLane(index)).join('');
  return '<section class="vr-studio-chat ' + (demo.activeChatCount > 1 ? 'is-split' : '') + (demo.dropActive ? ' is-drop-preview' : '') + '" data-chat-count="' + String(demo.activeChatCount) + '" aria-label="Production mission chat workspace">' +
    '<div class="vr-chat-lanes" data-chat-drop="true">' + lanes + '</div>' +
    '</section>';
}

function StudioDiffView() {
  const diff = demo.releaseDiff || {};
  const stats = diff.stats || null;
  const headerMeta = diff.loading
    ? 'Loading git diff…'
    : diff.error
      ? 'Compare failed'
      : stats && (stats.files || stats.insertions || stats.deletions)
        ? ('+' + String(stats.insertions || 0) + ' -' + String(stats.deletions || 0) + ' · ' + String(stats.files || 0) + ' files')
        : diff.text
          ? (diff.fromLabel && diff.toLabel ? diff.fromLabel + ' → ' + diff.toLabel : 'Release diff ready')
          : (demo.verified ? 'Verified changes' : demo.agentFixing ? 'Agent running' : 'Compare releases to load a diff');
  const body = diff.loading
    ? '<pre><code>Fetching git diff…</code></pre>'
    : diff.error
      ? '<pre><code class="del">' + escapeHtml(diff.error) + '</code></pre>'
      : diff.text
        ? '<pre>' + formatDiffPreHtml(diff.text) + '</pre>'
        : '<pre><code><em>Use Compare Releases in the Versions panel to load a real git diff.</em></code></pre>';
  return '<section class="vr-studio-diff" aria-label="Live git diff preview">' +
    '<header><strong>Live Diff</strong><span>' + escapeHtml(headerMeta) + '</span></header>' +
    body +
    '<footer><button type="button" data-action="diff-to-chat">Explain in Chat</button><button type="button" data-action="verify-now">Accept & Verify</button></footer>' +
    '</section>';
}

function StudioDock() {
  const view = demo.activeStudioTab === 'terminal' ? StudioTerminalView() : demo.activeStudioTab === 'diff' ? StudioDiffView() : StudioChatView();
  return '<section class="vr-studio-dock ' + (demo.agentFixing ? 'is-running' : '') + (demo.verified ? ' is-verified' : '') + '" aria-label="VibeRaven Studio agent workspace">' +
    '<div class="vr-studio-head">' +
      '<div><h2>VibeRaven Chat</h2></div>' +
      '<div class="vr-studio-head-actions"><button class="vr-studio-add-chat" type="button" data-action="split-chat" aria-label="Open a side-by-side chat">' + Icon('plus') + 'Split chat</button><div class="vr-studio-tabs">' + StudioTabButton('chat', 'Chat') + StudioTabButton('terminal', 'Terminal') + StudioTabButton('diff', 'Diff') + '</div></div>' +
    '</div>' +
    '<div class="vr-studio-body">' + view + '</div>' +
    '</section>';
}

function QuickActionRow(action) {
  return '<button class="vr-quick-action" type="button" data-action="' + escapeHtml(action.id) + '">' + Icon(action.icon) + '<span><strong>' + escapeHtml(action.title) + '</strong><em>' + escapeHtml(action.caption) + '</em></span></button>';
}

function AgentActionPanel() {
  const fixing = demo.agentFixing;
  const verified = demo.verified;
  const checklist = [
    ['Patch missing proof', fixing || verified],
    ['Update configs', fixing || verified],
    ['Re-run failed checks', verified],
    ['Prepare verification', verified],
  ];
  return '<aside class="vr-agent-panel" aria-label="VibeRaven AI Agent panel">' +
    '<div class="vr-agent-control">' +
      '<section class="vr-agent-hero ' + (fixing ? 'is-fixing' : '') + (verified ? ' is-verified' : '') + '">' +
        '<div><p>VibeRaven Agent</p><h2>' + (verified ? 'Ready to launch' : fixing ? 'Fixing launch gap' : 'Ready') + '</h2><em>' + (verified ? 'High confidence. Safe to proceed.' : fixing ? 'Patching proof now.' : 'High confidence. Safe to proceed.') + '</em></div>' +
        '<img src="' + mascotUrl() + '" alt="" />' +
      '</section>' +
      '<section class="vr-quick-actions"><h3>Quick Actions</h3>' +
        [
          { id: 'guide', icon: 'guide', title: 'Analyze Issues', caption: 'Find launch blockers' },
          { id: 'show-diff', icon: 'code', title: 'View Diff', caption: 'Review changes' },
          { id: 'recheck', icon: 'refresh', title: 'Run Verify', caption: 'Run checks again' },
          { id: 'explain-changes', icon: 'prompt', title: 'Explain Changes', caption: 'Summarize the fix' },
        ].map(QuickActionRow).join('') +
      '</section>' +
      '<section class="vr-agent-will"><h3>Live Activity <a href="' + publicGithubUrl + '" target="_blank" rel="noreferrer">View all</a></h3>' + checklist.map(([label, done], index) => '<span class="' + (done ? 'is-done' : '') + '"><i data-agent-step="' + String(index + 1) + '"></i>' + escapeHtml(label) + '<em>' + (done ? 'Done' : index === 0 ? '2m ago' : 'Just now') + '</em></span>').join('') + '</section>' +
      GlowButton(fixing ? 'Applying...' : verified ? 'Verified' : 'Apply Fix Plan', { id: 'vr-chat-agent-fix', action: 'chat-agent-fix', tone: verified ? 'green' : 'purple' }) +
    '</div>' +
    '</aside>';
}

function BottomTipBar() {
  const message = demo.notice || 'Connect all providers to unlock full verification and faster launches.';
  return '<footer class="vr-bottom-tip-bar"><span class="vr-tip-mascot"><img src="' + mascotAssets.idle + '" alt="" /></span><span><b>Tip:</b> ' + escapeHtml(message) + '</span><nav><a href="' + docsUrl + '" target="_blank" rel="noreferrer">Docs</a><a href="' + communityUrl + '" target="_blank" rel="noreferrer">Community</a><a class="vr-bottom-github" href="' + publicGithubUrl + '" target="_blank" rel="noreferrer">' + BrandMark('github') + 'GitHub</a></nav></footer>';
}

function LaunchFlowPage() {
  return StudioDock();
}

function VibeShell() {
  return '<main class="vr-composed-shell">' +
      StudioTopBar() +
      '<div class="vr-composition-body">' + RecentChatRail() + '<section class="vr-main-canvas">' + LaunchFlowPage() + '</section>' + AgentActionPanel() + '</div>' +
      '<div class="vr-bottom-inventory">' + ProviderGrid() + VersionTimeline() + '</div>' +
      BottomTipBar() +
    '</main>' +
    ActiveModal();
}

function captureChatScroll(node) {
  const lane = node.closest('.vr-chat-lane');
  const index = lane ? lane.getAttribute('data-chat-index') : node.getAttribute('data-chat-transcript');
  if (!index) return;
  chatScrollCache[index] = {
    top: node.scrollTop,
    nearBottom: node.scrollHeight - node.scrollTop - node.clientHeight < 56
  };
}

function readChatScrollState() {
  app.querySelectorAll('.vr-chat-transcript').forEach((node) => captureChatScroll(node));
  const state = {};
  Object.keys(chatScrollCache).forEach((key) => {
    state[key] = { ...chatScrollCache[key] };
  });
  return state;
}

function restoreChatScrollState(state, options) {
  const opts = options || {};
  const apply = () => {
    app.querySelectorAll('.vr-chat-transcript').forEach((node) => {
      const lane = node.closest('.vr-chat-lane');
      const index = lane ? lane.getAttribute('data-chat-index') : node.getAttribute('data-chat-transcript');
      if (!index) return;
      const saved = state[index] || chatScrollCache[index];
      const scrollToBottom = opts.scrollToBottom === true || opts.scrollToBottom === Number(index) || opts.scrollToBottom === index;
      if (scrollToBottom || (saved && saved.nearBottom)) {
        node.scrollTop = node.scrollHeight;
        captureChatScroll(node);
      } else if (saved) {
        node.scrollTop = saved.top;
        captureChatScroll(node);
      }
    });
  };
  window.requestAnimationFrame(() => {
    apply();
    window.requestAnimationFrame(apply);
  });
}

function refreshBottomTip() {
  const tipSpan = app.querySelector('.vr-bottom-tip-bar > span:nth-child(2)');
  if (!tipSpan) return;
  const message = demo.notice || 'Connect all providers to unlock full verification and faster launches.';
  tipSpan.innerHTML = '<b>Tip:</b> ' + escapeHtml(message);
}

function refreshPickerMenus() {
  app.querySelectorAll('.vr-chat-lane').forEach((lane) => {
    const index = Number(lane.getAttribute('data-chat-index') || '0');
    const picker = lane.querySelector('.vr-model-picker');
    if (!picker) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = ModelPicker(index);
    const nextPicker = wrapper.firstElementChild;
    if (nextPicker) picker.replaceWith(nextPicker);
  });
}

function render(options) {
  const opts = options || {};
  const scrollState = opts.preserveScroll === false ? null : readChatScrollState();
  app.innerHTML = VibeShell();
  window.requestAnimationFrame(() => {
    if (opts.scrollToBottom != null) {
      restoreChatScrollState({}, { scrollToBottom: opts.scrollToBottom });
    } else if (scrollState) {
      restoreChatScrollState(scrollState, {});
    }
    if (demo.activeModal && demo.activeModal !== lastRenderedModal) {
      const closeButton = app.querySelector('.vr-modal-close');
      if (closeButton) closeButton.focus({ preventScroll: true });
    }
    if (demo.activeStudioTab === 'terminal') {
      const shellInput = app.querySelector('[data-terminal-shell-input]');
      const scroll = app.querySelector('[data-terminal-scroll]');
      if (scroll) scroll.scrollTop = scroll.scrollHeight;
      if (shellInput && !demo.activeModal) shellInput.focus({ preventScroll: true });
    }
  });
  lastRenderedModal = demo.activeModal;
}

async function loadGithubStats() {
  if (githubStats.loading || githubStats.loaded) return;
  githubStats.loading = true;
  try {
    const response = await fetch(publicGithubApiUrl, { headers: { accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error('GitHub stats request failed');
    const data = await response.json();
    githubStats.stars = Number(data.stargazers_count) || 0;
    githubStats.forks = Number(data.forks_count) || 0;
    githubStats.issues = Number(data.open_issues_count) || 0;
    githubStats.loaded = true;
  } catch {
    githubStats.error = true;
  } finally {
    githubStats.loading = false;
    render();
  }
}

app.addEventListener('click', async (event) => {
  const recentChatButton = event.target.closest('[data-chat-id]');
  if (recentChatButton) {
    const chatId = recentChatButton.getAttribute('data-chat-id');
    const recent = recentChats.find((chat) => chat.id === chatId);
    demo.activeRecentChatId = chatId;
    demo.activeChatCount = 1;
    demo.chatContexts = [restoreRecentChat(recent)];
    syncDemoFromChatContext(demo.chatContexts[0]);
    demo.pickerChatIndex = 0;
    demo.activeStudioTab = 'chat';
    demo.agentFixing = false;
    demo.verified = false;
    demo.notice = recent ? recent.title + ' loaded with saved context.' : 'Recent production chat loaded into the mission workspace.';
    render();
    return;
  }

  const studioTab = event.target.closest('[data-studio-tab]');
  if (studioTab) {
    demo.activeStudioTab = studioTab.getAttribute('data-studio-tab');
    demo.activeNavId = 'agents';
    if (demo.activeStudioTab === 'terminal' && !demo.cliTerminalLines.length) {
        demo.cliTerminalLines = [
          'VibeRaven Studio shell',
          'Type commands at the $ prompt. Use Test connection after sign-in.',
          ''
        ];
      }
    demo.notice = 'Studio switched to ' + studioTab.textContent.trim() + '.';
    render();
    return;
  }

  const connectActionButton = event.target.closest('[data-action="run-cli-install"], [data-action="run-cli-signin"], [data-action="open-os-terminal"], [data-action="test-cli-connection"], [data-action="copy-cli-command"], [data-action="terminal-select-cli"], [data-action="terminal-shell-run"], [data-action="connect-complete-chat"], [data-action="reset-cli-connect"]');
  if (connectActionButton) {
    const action = connectActionButton.getAttribute('data-action');
    const agentId = connectActionButton.getAttribute('data-cli-agent') || demo.cliConnectTargetId || 'codex';
    const chatIndex = Number(connectActionButton.getAttribute('data-chat-index') || demo.pickerChatIndex || 0);
    if (action === 'terminal-select-cli') {
      selectTerminalCli(agentId);
      return;
    }
    if (action === 'terminal-shell-run') {
      const shellInput = app.querySelector('[data-terminal-shell-input]');
      const command = String((shellInput && 'value' in shellInput ? shellInput.value : demo.cliTerminalDraft) || '').trim();
      demo.cliTerminalDraft = command;
      await runStudioShellCommand(command);
      if (shellInput && 'value' in shellInput) shellInput.value = '';
      demo.cliTerminalDraft = '';
      return;
    }
    if (action === 'connect-complete-chat') {
      demo.activeModal = null;
      demo.activeStudioTab = 'chat';
      demo.cliConnectTargetId = null;
      demo.cliProbeStatus = 'idle';
      demo.cliProbeMessage = '';
      demo.notice = (cliAgents.find((item) => item.id === agentId)?.label || agentId) + ' ready for chat missions.';
      render();
      return;
    }
    if (action === 'reset-cli-connect') {
      const mode = connectActionButton.getAttribute('data-reset-mode') || 'soft';
      resetCliConnectFlow({ fullReset: mode === 'full', keepLog: mode !== 'full' });
      if (mode === 'full') {
        await hydrateCliAgents({ forceFresh: true });
      }
      demo.activeStudioTab = mode === 'full' ? 'chat' : 'terminal';
      demo.notice = mode === 'full' ? 'Connect flow fully reset. First-time setup is visible again.' : 'Connect flow reset. Terminal log cleared.';
      render();
      return;
    }
    if (action === 'copy-cli-command') {
      const command = connectActionButton.getAttribute('data-cli-command') || '';
      const copied = command ? await copyText(command) : false;
      demo.notice = copied ? 'CLI command copied. Run it in your terminal, then test the connection.' : 'Copy the command manually if clipboard access is blocked.';
      render();
      return;
    }
    if (action === 'run-cli-install') {
      await runCliInstall(agentId, chatIndex);
      return;
    }
    if (action === 'run-cli-signin') {
      await runCliSignInInStudio(agentId, chatIndex);
      return;
    }
    if (action === 'open-os-terminal') {
      await openCliOsTerminal(agentId, chatIndex);
      return;
    }
    if (action === 'test-cli-connection') {
      const currentTarget = terminalTargetId();
      if (demo.cliProbeStatus === 'success' && currentTarget === agentId) {
        demo.cliConnectCompleteAgentId = agentId;
        demo.activeModal = 'connect-complete';
        render();
        return;
      }
      await probeCliConnection(agentId, chatIndex, true);
      return;
    }
  }

  const cliButton = event.target.closest('[data-cli-agent]:not([data-action])');
  if (cliButton) {
    const chatIndex = Number(cliButton.getAttribute('data-chat-index') || String(demo.pickerChatIndex || 0));
    const chat = chatContext(chatIndex);
    const agentId = cliButton.getAttribute('data-cli-agent');
    if (cliButton.getAttribute('data-connected') === 'false') {
      if (agentId && demo.cliSessionReady[agentId] === true) {
        const restored = await silentProbeCliConnection(agentId, chatIndex);
        if (restored) {
          demo.pickerChatIndex = chatIndex;
          demo.notice = (cliAgents.find((item) => item.id === agentId)?.label || agentId) + ' is connected and ready.';
          render();
          return;
        }
      }
      demo.modelMenuOpen = false;
      demo.reasoningMenuOpen = false;
      demo.contextMenuOpen = false;
      demo.accessMenuOpen = false;
      demo.cliProbeStatus = 'idle';
      demo.cliProbeMessage = '';
      demo.pickerChatIndex = chatIndex;
      demo.notice = 'Follow install and sign-in in the Terminal tab for ' + (cliButton.querySelector('strong')?.textContent || agentId) + '.';
      selectTerminalCli(agentId);
      return;
    }
    chat.cliId = cliButton.getAttribute('data-cli-agent');
    demo.cliConnectTargetId = null;
    demo.cliLastConnectTargetId = null;
    demo.cliProbeStatus = 'idle';
    demo.cliProbeMessage = '';
    if (!demo.cliSetupComplete) {
      markCliSetupComplete(chat.cliId, chatIndex);
    } else {
      demo.selectedCliId = chat.cliId;
      demo.cliConnected = true;
      const models = cliModels[chat.cliId] || cliModels.codex;
      chat.modelId = normalizeModelId(models[0]);
      demo.selectedModelId = chat.modelId;
    }
    demo.activeStudioTab = chat.cliId === 'terminal' ? 'terminal' : 'chat';
    demo.activeNavId = 'agents';
    demo.pickerChatIndex = chatIndex;
    demo.modelMenuOpen = false;
    demo.reasoningMenuOpen = false;
    demo.contextMenuOpen = false;
    demo.accessMenuOpen = false;
    demo.notice = (cliAgents.find((item) => item.id === chat.cliId)?.label || chat.cliId) + ' selected for this chat.';
    render();
    return;
  }

  const modelButton = event.target.closest('[data-model]');
  if (modelButton) {
    event.preventDefault();
    const chatIndex = Number(modelButton.getAttribute('data-chat-index') || String(demo.pickerChatIndex || 0));
    const chat = chatContext(chatIndex);
    chat.modelId = modelButton.getAttribute('data-model');
    demo.selectedModelId = chat.modelId;
    demo.selectedCliId = chat.cliId;
    demo.cliConnected = true;
    demo.modelMenuOpen = false;
    demo.reasoningMenuOpen = false;
    demo.contextMenuOpen = false;
    demo.accessMenuOpen = false;
    demo.activeStudioTab = 'chat';
    demo.pickerChatIndex = chatIndex;
    demo.notice = selectedModelLabel(chatIndex) + ' selected for this chat.';
    refreshPickerMenus();
    refreshBottomTip();
    return;
  }

  const reasoningButton = event.target.closest('[data-reasoning]');
  if (reasoningButton) {
    event.preventDefault();
    const chatIndex = Number(reasoningButton.getAttribute('data-chat-index') || String(demo.pickerChatIndex || 0));
    const chat = chatContext(chatIndex);
    chat.reasoning = reasoningButton.getAttribute('data-reasoning');
    demo.selectedReasoning = chat.reasoning;
    demo.reasoningMenuOpen = false;
    demo.modelMenuOpen = false;
    demo.contextMenuOpen = false;
    demo.accessMenuOpen = false;
    demo.activeStudioTab = 'chat';
    demo.pickerChatIndex = chatIndex;
    demo.notice = chat.reasoning + ' reasoning selected for this chat.';
    refreshPickerMenus();
    refreshBottomTip();
    return;
  }

  const contextButton = event.target.closest('[data-context]');
  if (contextButton) {
    event.preventDefault();
    const chatIndex = Number(contextButton.getAttribute('data-chat-index') || String(demo.pickerChatIndex || 0));
    const chat = chatContext(chatIndex);
    chat.context = contextButton.getAttribute('data-context');
    demo.selectedContext = chat.context;
    demo.contextMenuOpen = false;
    demo.modelMenuOpen = false;
    demo.reasoningMenuOpen = false;
    demo.accessMenuOpen = false;
    demo.activeStudioTab = 'chat';
    demo.pickerChatIndex = chatIndex;
    demo.notice = chat.context + ' context selected for this chat.';
    refreshPickerMenus();
    refreshBottomTip();
    return;
  }

  const accessButton = event.target.closest('[data-access-mode]');
  if (accessButton) {
    event.preventDefault();
    const chatIndex = Number(accessButton.getAttribute('data-chat-index') || String(demo.pickerChatIndex || 0));
    const chat = chatContext(chatIndex);
    const selected = accessModes.find((mode) => mode.id === accessButton.getAttribute('data-access-mode')) || accessModes[1];
    chat.accessMode = selected.id;
    demo.selectedAccessMode = selected.id;
    demo.accessMenuOpen = false;
    demo.contextMenuOpen = false;
    demo.modelMenuOpen = false;
    demo.reasoningMenuOpen = false;
    demo.activeStudioTab = 'chat';
    demo.pickerChatIndex = chatIndex;
    demo.notice = selected.label + ' selected for this chat.';
    refreshPickerMenus();
    refreshBottomTip();
    return;
  }

  const stageButton = event.target.closest('[data-stage-step]');
  if (stageButton) {
    const stage = stageButton.getAttribute('data-stage-step');
    demo.activeStepId = stage;
    demo.modelMenuOpen = false;
    demo.reasoningMenuOpen = false;
    demo.contextMenuOpen = false;
    demo.accessMenuOpen = false;
    if (stage === 'provider') {
      demo.activeStudioTab = 'chat';
      demo.providerPickerOpen = true;
      demo.notice = 'Provider Proof selected. Drag a provider into chat or open a stack slot.';
    } else if (stage === 'agent') {
      demo.activeStudioTab = 'chat';
      demo.providerPickerOpen = false;
      demo.notice = 'Agent Fix selected. Use chat actions to plan, fix, verify, or inspect provider proof.';
    } else if (stage === 'verify') {
      demo.activeStudioTab = 'terminal';
      demo.providerPickerOpen = false;
      demo.notice = 'Verify selected. Run verification from the chat, agent panel, or terminal view.';
    } else if (stage === 'clear') {
      demo.activeStudioTab = 'diff';
      demo.providerPickerOpen = false;
      demo.verified = true;
      demo.agentFixing = false;
      demo.notice = 'Clear selected. Review the verified diff and release state.';
    }
    render();
    return;
  }

  const providerButton = event.target.closest('[data-provider]');
  if (providerButton) {
    demo.selectedProviderId = providerButton.getAttribute('data-provider');
    const provider = providers.find((item) => item.id === demo.selectedProviderId);
    demo.activeNavId = 'providers';
    demo.activeStepId = 'provider';
    demo.providerPickerOpen = false;
    demo.activeModal = 'provider';
    demo.notice = provider ? provider.name + ' stack slot selected. Open status, dashboard setup, and verification from one place.' : '';
    render();
    return;
  }

  const releaseButton = event.target.closest('[data-release]');
  if (releaseButton) {
    demo.selectedReleaseId = releaseButton.getAttribute('data-release');
    demo.activeNavId = 'versions';
    demo.activeModal = 'release';
    demo.notice = 'Release ' + demo.selectedReleaseId + ' selected. Compare changes before verification.';
    runReleaseChangelog(false);
    return;
  }

  const navButton = event.target.closest('[data-nav-target]');
  if (navButton) {
    const target = navButton.getAttribute('data-nav-target');
    demo.activeNavId = target;
    const navActions = {
      launch: () => {
        resetLaunchPreview();
        demo.notice = 'New Launch starts at repo evidence, then moves through providers, agent fix, verify, and clear.';
      },
      flow: () => {
        demo.activeStepId = 'agent';
        demo.notice = 'Launch Flow shows the five-step production path.';
      },
      providers: () => {
        demo.activeStepId = 'provider';
        demo.providerPickerOpen = true;
        demo.notice = 'Providers are ready to inspect. Pick one connector to view proof and dashboard action.';
      },
      agents: () => {
        demo.activeStepId = 'agent';
        demo.notice = 'Agent view is focused. Start Agent Fix to preview the handoff.';
      },
      evidence: () => {
        demo.activeStepId = 'repo';
        demo.notice = 'Evidence view starts with repo proof before provider dashboards matter.';
      },
      versions: () => {
        demo.notice = 'Versions & Releases is focused. Select a release to compare launch proof.';
      },
      settings: () => {
        demo.notice = 'Settings will hold project, branch, and provider preferences.';
      },
      community: () => {
        demo.notice = 'Community links are live in the open-source card and bottom bar.';
      },
    };
    if (navActions[target]) navActions[target]();
    else demo.notice = navButton.textContent.trim().replace(/\\s+/g, ' ') + ' is active in this launch-control preview.';
    render();
    return;
  }

  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  const action = actionButton.getAttribute('data-action');
  const actionChatIndex = Math.max(0, Math.min(Number(actionButton.getAttribute('data-chat-index') || actionButton.closest('.vr-chat-lane')?.getAttribute('data-chat-index') || demo.pickerChatIndex || 0) || 0, demo.activeChatCount - 1));
  if (action === 'close-modal') {
    demo.activeModal = null;
    demo.cliProbeStatus = 'idle';
    render();
    return;
  }
  if (action === 'copy-cli-command') {
    const command = actionButton.getAttribute('data-cli-command') || '';
    const copied = command ? await copyText(command) : false;
    demo.notice = copied ? 'CLI command copied. Run it in your terminal, then test the connection.' : 'Copy the command manually if clipboard access is blocked.';
    render();
    return;
  }
  if (action === 'run-cli-install') {
    const agentId = actionButton.getAttribute('data-cli-agent') || demo.cliConnectTargetId || 'codex';
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || demo.pickerChatIndex || 0);
    await runCliInstall(agentId, chatIndex);
    return;
  }
  if (action === 'run-cli-signin') {
    const agentId = actionButton.getAttribute('data-cli-agent') || demo.cliConnectTargetId || 'codex';
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || demo.pickerChatIndex || 0);
    await runCliSignInInStudio(agentId, chatIndex);
    return;
  }
  if (action === 'open-os-terminal') {
    const agentId = actionButton.getAttribute('data-cli-agent') || demo.cliConnectTargetId || 'codex';
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || demo.pickerChatIndex || 0);
    await openCliOsTerminal(agentId, chatIndex);
    return;
  }
  if (action === 'terminal-select-cli') {
    selectTerminalCli(actionButton.getAttribute('data-cli-agent') || 'codex');
    return;
  }
  if (action === 'terminal-shell-run') {
    const shellInput = app.querySelector('[data-terminal-shell-input]');
    const command = String((shellInput && 'value' in shellInput ? shellInput.value : demo.cliTerminalDraft) || '').trim();
    demo.cliTerminalDraft = command;
    await runStudioShellCommand(command);
    if (shellInput && 'value' in shellInput) shellInput.value = '';
    demo.cliTerminalDraft = '';
    return;
  }
  if (action === 'connect-complete-chat') {
    const agentId = actionButton.getAttribute('data-cli-agent') || demo.cliConnectCompleteAgentId || demo.selectedCliId || 'codex';
    demo.activeModal = null;
    demo.activeStudioTab = 'chat';
    demo.cliConnectTargetId = null;
    demo.cliProbeStatus = 'idle';
    demo.cliProbeMessage = '';
    demo.notice = (cliAgents.find((item) => item.id === agentId)?.label || agentId) + ' ready for chat missions.';
    render();
    return;
  }
  if (action === 'reset-cli-connect') {
    const mode = actionButton.getAttribute('data-reset-mode') || 'soft';
    resetCliConnectFlow({ fullReset: mode === 'full', keepLog: mode !== 'full' });
    if (mode === 'full') {
      await hydrateCliAgents({ forceFresh: true });
    }
    demo.activeStudioTab = mode === 'full' ? 'chat' : 'terminal';
    demo.notice = mode === 'full' ? 'Connect flow fully reset. First-time setup is visible again.' : 'Connect flow reset. Terminal log cleared.';
    render();
    return;
  }
  if (action === 'test-cli-connection') {
    const agentId = actionButton.getAttribute('data-cli-agent') || terminalTargetId() || 'codex';
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || demo.pickerChatIndex || 0);
    const currentTarget = terminalTargetId();
    if (demo.cliProbeStatus === 'success' && currentTarget === agentId) {
      demo.cliConnectCompleteAgentId = agentId;
      demo.activeModal = 'connect-complete';
      render();
      return;
    }
    await probeCliConnection(agentId, chatIndex, true);
    return;
  }
  if (action === 'copy-prompt') {
    const copied = await copyText(agentPromptText());
    demo.notice = copied ? 'Agent mission ready. Keep the connected CLI scoped to this launch gap.' : 'Mission is still visible; clipboard permission was not available.';
    render();
    return;
  }
  if (action === 'toggle-models') {
    event.preventDefault();
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || '0');
    const samePicker = demo.pickerChatIndex === chatIndex && demo.modelMenuOpen;
    demo.activeStudioTab = 'chat';
    demo.pickerChatIndex = chatIndex;
    demo.modelMenuOpen = !samePicker;
    demo.reasoningMenuOpen = false;
    demo.contextMenuOpen = false;
    demo.accessMenuOpen = false;
    refreshPickerMenus();
    return;
  }
  if (action === 'toggle-reasoning') {
    event.preventDefault();
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || '0');
    const samePicker = demo.pickerChatIndex === chatIndex && demo.reasoningMenuOpen;
    demo.activeStudioTab = 'chat';
    demo.pickerChatIndex = chatIndex;
    demo.reasoningMenuOpen = !samePicker;
    demo.modelMenuOpen = false;
    demo.contextMenuOpen = false;
    demo.accessMenuOpen = false;
    refreshPickerMenus();
    return;
  }
  if (action === 'toggle-context') {
    event.preventDefault();
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || '0');
    const samePicker = demo.pickerChatIndex === chatIndex && demo.contextMenuOpen;
    demo.activeStudioTab = 'chat';
    demo.pickerChatIndex = chatIndex;
    demo.contextMenuOpen = !samePicker;
    demo.modelMenuOpen = false;
    demo.reasoningMenuOpen = false;
    demo.accessMenuOpen = false;
    refreshPickerMenus();
    return;
  }
  if (action === 'toggle-access') {
    event.preventDefault();
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || '0');
    const samePicker = demo.pickerChatIndex === chatIndex && demo.accessMenuOpen;
    demo.activeStudioTab = 'chat';
    demo.pickerChatIndex = chatIndex;
    demo.accessMenuOpen = !samePicker;
    demo.modelMenuOpen = false;
    demo.reasoningMenuOpen = false;
    demo.contextMenuOpen = false;
    refreshPickerMenus();
    return;
  }
  if (action === 'remove-provider-context') {
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || '0');
    chatContext(chatIndex).providerId = null;
    if (chatIndex === 0) syncPrimaryContext();
    demo.dropActive = false;
    demo.notice = 'Provider context removed from this chat.';
    render();
    return;
  }
  if (action === 'remove-release-context') {
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || '0');
    chatContext(chatIndex).releaseId = null;
    if (chatIndex === 0) syncPrimaryContext();
    demo.dropActive = false;
    demo.notice = 'Version context removed from this chat.';
    render();
    return;
  }
  if (action === 'chat-agent-fix' || action === 'start-agent-fix') {
    demo.pickerChatIndex = actionChatIndex;
    runChatTask('fix');
    return;
  }
  if (action === 'verify-now') {
    demo.pickerChatIndex = actionChatIndex;
    runChatTask('verify');
    return;
  }
  if (action === 'recheck') {
    demo.pickerChatIndex = actionChatIndex;
    runChatTask('verify');
    return;
  }
  if (action === 'show-diff') {
    demo.pickerChatIndex = actionChatIndex;
    runChatTask('diff');
    return;
  }
  if (action === 'stop-agent') {
    clearChatTaskTimer();
    const stopChat = chatContext(actionChatIndex);
    if (laneHasActiveTask(stopChat)) {
      const stoppedTask = stopChat.activeTask;
      stopChat.messages.push({
        role: 'agent',
        text: 'Ready for the next safe action.',
        kind: stoppedTask.kind,
        isError: false,
        providerId: stoppedTask.providerId || null,
        releaseId: stoppedTask.releaseId || null,
        ts: Date.now(),
      });
      stopChat.activeTask = null;
    }
    demo.agentFixing = false;
    demo.activeStudioTab = 'chat';
    demo.notice = 'Agent stopped. No destructive command ran in this preview.';
    render();
    return;
  }
  if (action === 'send-chat-message') {
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || '0');
    sendChatInput(chatIndex);
    return;
  }
  if (action === 'terminal-send') {
    const chatIndex = Math.max(0, Math.min(demo.pickerChatIndex || 0, demo.activeChatCount - 1));
    const terminalInput = app.querySelector('[data-terminal-input]');
    const value = String((terminalInput && 'value' in terminalInput ? terminalInput.value : '') || '').trim();
    if (!value) {
      demo.notice = 'Type a terminal-safe mission first, then send it to chat.';
      render();
      return;
    }
    chatContext(chatIndex).draft = value;
    demo.activeStudioTab = 'chat';
    demo.notice = 'Terminal note moved into chat. Press send when ready.';
    render();
    return;
  }
  if (action === 'diff-to-chat') {
    const chatIndex = Math.max(0, Math.min(demo.pickerChatIndex || 0, demo.activeChatCount - 1));
    chatContext(chatIndex).draft = 'Explain this diff, identify production risk, and suggest the next safe verification step.';
    demo.activeStudioTab = 'chat';
    demo.notice = 'Diff question moved into chat.';
    render();
    return;
  }
  if (action === 'add-chat') {
    demo.activeStudioTab = 'chat';
    demo.activeChatCount = 1;
    demo.activeRecentChatId = null;
    demo.fixPlanExpandedChatIndex = null;
    demo.droppedProviderId = null;
    demo.droppedReleaseId = null;
    demo.chatContexts = [defaultChatContext({ providerId: null, releaseId: null })];
    demo.pickerChatIndex = 0;
    demo.modelMenuOpen = false;
    demo.reasoningMenuOpen = false;
    demo.contextMenuOpen = false;
    demo.accessMenuOpen = false;
    demo.notice = 'New chat opened.';
    render();
    return;
  }
  if (action === 'new-chat') {
    persistCurrentChatToRecent();
    demo.activeStudioTab = 'chat';
    demo.activeChatCount = 1;
    demo.activeRecentChatId = null;
    demo.fixPlanExpandedChatIndex = null;
    demo.chatContexts = [defaultChatContext({ providerId: null, releaseId: null })];
    demo.pickerChatIndex = 0;
    demo.dropActive = false;
    demo.dragKind = null;
    demo.dragProviderId = null;
    demo.dragReleaseId = null;
    demo.dragChatId = null;
    demo.agentFixing = false;
    demo.verified = false;
    clearChatTaskTimer();
    setDragUi(null);
    demo.notice = demo.cliSetupComplete ? 'New chat opened.' : 'New chat opened. Connect a CLI below to start.';
    render();
    return;
  }
  if (action === 'split-chat') {
    const lane0 = chatContext(0);
    const lane0Active = laneHasActiveTask(lane0);
    demo.activeStudioTab = 'chat';
    demo.activeChatCount = Math.min(4, demo.activeChatCount + 1);
    chatContext(demo.activeChatCount - 1);
    demo.pickerChatIndex = demo.activeChatCount - 1;
    demo.dropActive = false;
    demo.dragKind = null;
    demo.dragProviderId = null;
    demo.dragReleaseId = null;
    demo.dragChatId = null;
    if (!lane0Active) {
      demo.agentFixing = false;
      demo.verified = false;
    }
    setDragUi(null);
    demo.notice = 'New side-by-side mission chat opened. Drag a provider or version into that lane.';
    render();
    return;
  }
  if (action === 'view-all-chats') {
    demo.notice = 'Recent chats are local preview state. Open any chat or drag one into the workspace.';
    render();
    return;
  }
  if (action === 'close-chat') {
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || String(demo.activeChatCount - 1));
    if (chatIndex > 0) {
      const closing = chatContext(chatIndex);
      if (laneHasActiveTask(closing)) {
        clearChatTaskTimer();
        closing.activeTask = null;
      }
      if (demo.chatContexts.length > chatIndex) demo.chatContexts.splice(chatIndex, 1);
    }
    demo.activeChatCount = Math.max(1, demo.activeChatCount - 1);
    demo.pickerChatIndex = Math.min(demo.pickerChatIndex, demo.activeChatCount - 1);
    demo.activeStudioTab = 'chat';
    demo.notice = 'Extra mission chat closed.';
    render();
    return;
  }
  if (action === 'guide') {
    demo.pickerChatIndex = actionChatIndex;
    runChatTask('analyze');
    return;
  }
  if (action === 'prompt') {
    demo.activeNavId = 'agents';
    demo.activeStepId = 'agent';
    demo.providerPickerOpen = false;
    demo.activeModal = 'prompt';
    demo.notice = 'Agent mission is ready. Keep the fix scoped to the selected launch gap.';
    render();
    return;
  }
  if (action === 'add-provider') {
    demo.activeNavId = 'providers';
    demo.activeStepId = 'provider';
    demo.providerPickerOpen = false;
    demo.activeModal = 'add-provider';
    demo.notice = 'Add Provider opened. Choose a production slot to connect next.';
    render();
    return;
  }
  if (action === 'provider-proof') {
    demo.pickerChatIndex = actionChatIndex;
    runChatTask('provider');
    return;
  }
  if (action === 'plan') {
    demo.pickerChatIndex = actionChatIndex;
    runChatTask('plan');
    return;
  }
  if (action === 'view-fix-plan') {
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || String(actionChatIndex));
    demo.fixPlanExpandedChatIndex = demo.fixPlanExpandedChatIndex === chatIndex ? null : chatIndex;
    demo.pickerChatIndex = chatIndex;
    demo.notice = demo.fixPlanExpandedChatIndex === chatIndex ? 'Fix plan expanded in chat.' : 'Fix plan collapsed.';
    render();
    return;
  }
  if (action === 'connect-provider') {
    const providerId = actionButton.getAttribute('data-provider-id');
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || String(actionChatIndex));
    const provider = providers.find((item) => item.id === providerId);
    demo.pickerChatIndex = chatIndex;
    const lane = chatContext(chatIndex);
    lane.providerId = providerId;
    if (providerId) demo.selectedProviderId = providerId;
    runChatTask('provider');
    return;
  }
  if (action === 'mission-step') {
    const stepId = actionButton.getAttribute('data-step-id');
    const chatIndex = Number(actionButton.getAttribute('data-chat-index') || String(actionChatIndex));
    demo.pickerChatIndex = chatIndex;
    const steps = (missionCards && Array.isArray(missionCards.planSteps) ? missionCards.planSteps : []);
    const step = steps.find((item) => item.id === stepId);
    if (step) runChatTask('fix', step.title);
    return;
  }
  if (action === 'add-context') {
    demo.dropActive = true;
    demo.notice = 'Drag a provider or version into the chat composer to attach context.';
    render();
    window.setTimeout(() => {
      demo.dropActive = false;
      render();
    }, 1200);
    return;
  }
  if (action === 'terminal-tab') {
    demo.activeStudioTab = 'terminal';
    demo.notice = 'Terminal tab opened.';
    render();
    return;
  }
  if (action === 'compare' || action === 'show-release-diff') {
    runReleaseCompare();
    return;
  }
  if (action === 'changelog') {
    runReleaseChangelog(true);
    return;
  }
  if (action === 'rollback-release') {
    runReleaseRollback();
    return;
  }
  const actionMessages = {
    notifications: 'Launch signals opened: blockers, provider proof, agent fix, and verification.',
    environment: 'Environment selector is scoped to the local Studio preview.',
    account: 'VibeRaven agent opened from the header mascot.',
    'all-releases': 'Release history view opens next; this preview keeps the timeline focused.',
    'explain-changes': 'Change summary opened for production-safe review wording.',
  };
  if (actionMessages[action]) {
    if (action === 'all-releases') {
      demo.activeModal = 'release';
      runReleaseChangelog(false);
      return;
    }
    if (action === 'notifications') demo.activeModal = 'notifications';
    if (action === 'explain-changes') {
      demo.pickerChatIndex = actionChatIndex;
      runChatTask('explain');
      return;
    }
    if (action === 'account') {
      demo.activeNavId = 'agents';
      demo.activeStepId = 'agent';
      demo.activeModal = 'agent';
    }
    demo.notice = actionMessages[action];
    render();
  }
});

app.addEventListener('pointerdown', (event) => {
  if (event.target && event.target.matches('[data-modal-backdrop]')) {
    demo.activeModal = null;
    render();
  }
});

app.addEventListener('input', (event) => {
  const input = event.target && event.target.closest ? event.target.closest('.vr-chat-input') : null;
  if (input) {
    const chatIndex = Number(input.getAttribute('data-chat-input') || '0');
    chatContext(chatIndex).draft = input.value || '';
    return;
  }
  const terminalInput = event.target && event.target.closest ? event.target.closest('[data-terminal-input]') : null;
  if (terminalInput) chatContext(demo.pickerChatIndex || 0).draft = terminalInput.value || '';
  const shellInput = event.target && event.target.closest ? event.target.closest('[data-terminal-shell-input]') : null;
  if (shellInput) demo.cliTerminalDraft = shellInput.value || '';
});

app.addEventListener('keydown', (event) => {
  const shellInput = event.target && event.target.closest ? event.target.closest('[data-terminal-shell-input]') : null;
  if (shellInput && event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const command = String(shellInput.value || '').trim();
    if (!command) return;
    demo.cliTerminalDraft = command;
    runStudioShellCommand(command).then(() => {
      shellInput.value = '';
      demo.cliTerminalDraft = '';
    });
    return;
  }
  const input = event.target && event.target.closest ? event.target.closest('.vr-chat-input') : null;
  if (!input || event.key !== 'Enter' || event.shiftKey) return;
  event.preventDefault();
  sendChatInput(input.getAttribute('data-chat-input') || '0');
});

app.addEventListener('dragstart', (event) => {
  const providerButton = event.target.closest('[data-provider]');
  const releaseButton = event.target.closest('[data-release]');
  const chatButton = event.target.closest('[data-chat-id]');
  if (providerButton) {
    const providerId = providerButton.getAttribute('data-provider');
    const provider = providers.find((item) => item.id === providerId);
    demo.dragKind = 'provider';
    demo.dragProviderId = providerId;
    demo.dragReleaseId = null;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', 'provider:' + providerId);
      event.dataTransfer.setData('application/x-viberaven-provider', providerId);
      event.dataTransfer.effectAllowed = 'copyMove';
      event.dataTransfer.dropEffect = 'copy';
    }
    setDragChip(
      event,
      provider ? provider.name : 'Provider',
      provider ? provider.area : 'Drop into VibeRaven chat',
      provider ? (provider.iconHtml || '<img src="' + providerAssetSrc(provider) + '" alt="" />') : ''
    );
    providerButton.classList.add('is-being-dragged');
    demo.notice = 'Dragging provider context. Drop it into a chat composer or Split chat.';
    setDragUi('provider');
    return;
  }
  if (releaseButton) {
    const releaseId = releaseButton.getAttribute('data-release');
    const release = releases.find((item) => item.id === releaseId);
    demo.dragKind = 'release';
    demo.dragReleaseId = releaseId;
    demo.dragProviderId = null;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', 'release:' + releaseId);
      event.dataTransfer.setData('application/x-viberaven-release', releaseId);
      event.dataTransfer.effectAllowed = 'copyMove';
      event.dataTransfer.dropEffect = 'copy';
    }
    setDragChip(event, release ? release.label : 'Release', 'Drop to compare in chat', contextIconChip('repo', 'input'));
    releaseButton.classList.add('is-being-dragged');
    demo.notice = 'Dragging version context. Drop it into chat to compare or prepare rollback.';
    setDragUi('release');
    return;
  }
  if (chatButton) {
    const chatId = chatButton.getAttribute('data-chat-id');
    demo.dragKind = 'chat';
    demo.dragChatId = chatId;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', 'chat:' + chatId);
      event.dataTransfer.effectAllowed = 'copyMove';
      event.dataTransfer.dropEffect = 'copy';
    }
    setDragChip(event, 'Mission chat', 'Drop to split workspace');
    chatButton.classList.add('is-being-dragged');
    setDragUi('chat');
  }
});

app.addEventListener('dragover', (event) => {
  const dropTarget = event.target.closest('[data-chat-drop], [data-action="split-chat"]');
  if (!dropTarget) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  demo.dropActive = true;
  dropTarget.classList.add('is-drop-active');
});

app.addEventListener('dragleave', (event) => {
  const dropTarget = event.target.closest('[data-chat-drop], [data-action="split-chat"]');
  if (!dropTarget) return;
  dropTarget.classList.remove('is-drop-active');
  demo.dropActive = false;
});

app.addEventListener('drop', (event) => {
  const newChatTarget = event.target.closest('[data-action="split-chat"]');
  const dropTarget = event.target.closest('[data-chat-drop]');
  if (!newChatTarget && !dropTarget) return;
  event.preventDefault();
  (newChatTarget || dropTarget).classList.remove('is-drop-active');
  const targetLane = event.target.closest('.vr-chat-lane');
  const chatId = event.dataTransfer?.getData('text/plain').replace(/^chat:/, '') || (demo.dragKind === 'chat' ? demo.dragChatId : '');
  const isRecentChatDrop = Boolean(chatId && recentChats.some((chat) => chat.id === chatId));
  let newChatIndex = null;
  if (newChatTarget || isRecentChatDrop) {
    demo.activeChatCount = Math.min(4, demo.activeChatCount + 1);
    newChatIndex = demo.activeChatCount - 1;
    chatContext(newChatIndex);
  }
  const rawChatIndex = newChatIndex !== null ? String(newChatIndex) : (dropTarget?.getAttribute('data-chat-index') || targetLane?.getAttribute('data-chat-index') || '0');
  const chatIndex = Math.max(0, Math.min(Number(rawChatIndex) || 0, demo.activeChatCount - 1));
  const context = chatContext(chatIndex);
  const providerId = event.dataTransfer?.getData('application/x-viberaven-provider') || (demo.dragKind === 'provider' ? demo.dragProviderId : '');
  const releaseId = event.dataTransfer?.getData('application/x-viberaven-release') || (demo.dragKind === 'release' ? demo.dragReleaseId : '');
  if (isRecentChatDrop) {
    const recent = recentChats.find((chat) => chat.id === chatId);
    demo.activeRecentChatId = chatId;
    const restored = restoreRecentChat(recent);
    Object.assign(context, restored);
    demo.notice = recent ? recent.title + ' opened beside the active mission.' : 'Recent production chat opened beside the active mission.';
  }
  if (providerId) {
    demo.selectedProviderId = providerId;
    context.providerId = providerId;
    const provider = providers.find((item) => item.id === providerId);
    if (newChatTarget) demo.activeRecentChatId = null;
    if (chatIndex === 0) syncPrimaryContext();
    if (provider && provider.state === 'not_detected') {
      context.draft = 'Help me connect ' + provider.name + ' for production. What env vars and dashboard steps do I need?';
      demo.notice = provider.name + ' is missing — connect steps prefilled. Send when ready.';
    } else {
      demo.notice = provider ? provider.name + ' context attached to chat ' + String(chatIndex + 1) + '. Suggested actions updated for ' + (stackSlots[provider.id] || provider.area) + '.' : 'Provider context attached.';
    }
  }
  if (releaseId) {
    demo.selectedReleaseId = releaseId;
    context.releaseId = releaseId;
    const release = releases.find((item) => item.id === releaseId);
    if (newChatTarget) demo.activeRecentChatId = null;
    if (chatIndex === 0) syncPrimaryContext();
    demo.notice = release ? 'Version ' + release.label + ' attached to chat ' + String(chatIndex + 1) + '. Ask for compare, rollback, or provider changes.' : 'Version context attached.';
  }
  demo.activeStudioTab = 'chat';
  demo.dropActive = false;
  demo.dragKind = null;
  demo.dragProviderId = null;
  demo.dragReleaseId = null;
  demo.dragChatId = null;
  setDragUi(null);
  render();
});

app.addEventListener('dragend', () => {
  if (!demo.dragKind && !demo.dropActive) return;
  app.querySelectorAll('.is-being-dragged').forEach((item) => item.classList.remove('is-being-dragged'));
  demo.dragKind = null;
  demo.dragProviderId = null;
  demo.dragReleaseId = null;
  demo.dragChatId = null;
  demo.dropActive = false;
  setDragUi(null);
  render();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && demo.activeModal) {
    demo.activeModal = null;
    demo.notice = 'Panel closed. Continue from the launch flow.';
    render();
  }
});

app.addEventListener('scroll', (event) => {
  const target = event.target;
  if (target && target.classList && target.classList.contains('vr-chat-transcript')) {
    captureChatScroll(target);
  }
}, true);

loadRecentChats();
render();
hydrateCliAgents();
loadGithubStats();
`;
