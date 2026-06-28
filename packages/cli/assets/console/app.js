const endpoint = window.__VIBERAVEN_ACTIONS_ENDPOINT__ || '/api/actions';
const commandEndpoint = '/api/command';

const nodes = {
  actions: document.getElementById('actions'),
  actionCount: document.getElementById('actionCount'),
  artifactPath: document.getElementById('artifactPath'),
  gateStatus: document.getElementById('gateStatus'),
  generatedAt: document.getElementById('generatedAt'),
  message: document.getElementById('message'),
  refreshButton: document.getElementById('refreshButton'),
};

function text(value, fallback = '-') {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
}

function payloadToText(value) {
  if (Array.isArray(value)) return value.join('\n');
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2);
  return text(value, '');
}

async function copyPayload(value, button) {
  const content = payloadToText(value);
  const previous = button ? button.textContent : '';

  try {
    await navigator.clipboard.writeText(content);
  } catch {
    if (!button) return;

    button.textContent = 'Copy failed';
    window.setTimeout(() => {
      button.textContent = previous;
    }, 1200);
    return;
  }

  if (!button) return;

  button.textContent = 'Copied';
  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = previous;
    button.disabled = false;
  }, 900);
}

function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function appendText(parent, className, value) {
  const node = document.createElement('p');
  node.className = className;
  node.textContent = value;
  parent.appendChild(node);
  return node;
}

function appendPill(parent, value, className = '') {
  const pill = document.createElement('span');
  pill.className = `pill ${className}`.trim();
  pill.textContent = value;
  parent.appendChild(pill);
  return pill;
}

function appendButton(parent, label, value) {
  const button = document.createElement('button');
  button.className = 'button secondary';
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', () => copyPayload(value, button));
  parent.appendChild(button);
  return button;
}

function appendVerifyButton(parent, action, output) {
  const button = document.createElement('button');
  button.className = 'button secondary';
  button.type = 'button';
  const token = window.__VIBERAVEN_TOKEN__ || '';
  button.textContent = token ? 'Verify' : 'Verify unavailable';
  button.disabled = !token;
  button.addEventListener('click', async () => {
    if (!token) return;

    const previous = button.textContent;
    button.disabled = true;
    button.textContent = 'Verifying';
    output.hidden = false;
    output.textContent = 'Running verification...';

    try {
      const response = await fetch(commandEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${window.__VIBERAVEN_TOKEN__ || ''}`,
        },
        body: JSON.stringify({ type: 'verify-action', actionId: action.id }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        output.textContent = body && body.error ? body.error : 'Verification failed.';
        return;
      }

      const result = body.result || {};
      const outputParts = [];
      outputParts.push(`Exit code: ${text(result.exitCode, 'unknown')}`);
      if (result.stdout) outputParts.push(result.stdout);
      if (result.stderr) outputParts.push(result.stderr);
      output.textContent = outputParts.join('\n\n');
    } catch (error) {
      output.textContent = error instanceof Error ? error.message : 'Verification failed.';
    } finally {
      button.disabled = false;
      button.textContent = previous;
    }
  });
  parent.appendChild(button);
  return button;
}

function actionProvider(action) {
  return action.provider || (action.target && action.target.provider) || '';
}

function renderAction(action) {
  const card = document.createElement('article');
  card.className = 'action-card';

  const header = document.createElement('div');
  header.className = 'action-header';
  card.appendChild(header);

  const titleRow = document.createElement('div');
  titleRow.className = 'action-title-row';
  header.appendChild(titleRow);

  const title = document.createElement('h2');
  title.className = 'action-title';
  title.textContent = `${text(action.id)}: ${text(action.title, 'Untitled action')}`;
  titleRow.appendChild(title);
  appendPill(titleRow, text(action.status), 'status');

  const meta = document.createElement('div');
  meta.className = 'meta-row';
  header.appendChild(meta);
  appendPill(meta, text(action.kind, 'action'));
  appendPill(meta, text(action.primaryControl, 'none'));
  const provider = actionProvider(action);
  if (provider) appendPill(meta, provider);

  const target = document.createElement('section');
  card.appendChild(target);
  appendText(target, 'section-label', 'Target');
  appendText(target, 'target', `${text(action.target && action.target.label)} ${text(action.target && action.target.value, '')}`.trim());

  const readiness = document.createElement('section');
  card.appendChild(readiness);
  const readinessLabel = appendText(readiness, 'section-label', 'Readiness');
  const readinessItems = Array.isArray(action.readiness) ? action.readiness : [];
  readinessLabel.textContent = `Readiness (${readinessItems.length})`;
  if (readinessItems.length > 0) {
    const list = document.createElement('ul');
    list.className = 'readiness-list';
    readinessItems.slice(0, 5).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = text(item);
      list.appendChild(li);
    });
    readiness.appendChild(list);
  } else {
    appendPill(readiness, 'No readiness evidence', 'ready');
  }

  const payload = Array.isArray(action.copyPayloads) ? action.copyPayloads[0] : undefined;
  const payloadSection = document.createElement('section');
  card.appendChild(payloadSection);
  appendText(payloadSection, 'section-label', payload ? `Copy: ${text(payload.label)}` : 'Copy payload');
  const commandBox = document.createElement('pre');
  commandBox.className = 'command-box';
  commandBox.textContent = payload ? payloadToText(payload.value) : 'No copy payload provided.';
  payloadSection.appendChild(commandBox);

  const footer = document.createElement('div');
  footer.className = 'action-footer';
  card.appendChild(footer);
  if (payload) appendButton(footer, `Copy ${text(payload.label, 'Payload')}`, payload.value);
  const verifyOutput = document.createElement('pre');
  verifyOutput.className = 'command-box';
  verifyOutput.hidden = true;
  if (action.verify && action.id) appendVerifyButton(footer, action, verifyOutput);
  if (action.resumeInstruction) appendButton(footer, 'Copy Resume', action.resumeInstruction);
  card.appendChild(verifyOutput);

  return card;
}

function renderState(state) {
  clearChildren(nodes.actions);
  nodes.message.hidden = true;
  nodes.message.textContent = '';

  nodes.artifactPath.textContent = text(state.artifactPath);
  if (!state.ok) {
    nodes.gateStatus.textContent = text(state.reason, 'Unavailable');
    nodes.actionCount.textContent = '0';
    nodes.generatedAt.textContent = '-';
    nodes.message.textContent = text(state.message, 'Unable to load VibeRaven actions.');
    nodes.message.hidden = false;
    return;
  }

  nodes.gateStatus.textContent = text(state.gateStatus);
  nodes.actionCount.textContent = String(state.actions.length);
  nodes.generatedAt.textContent = text(state.generatedAt);
  state.actions.forEach((action) => nodes.actions.appendChild(renderAction(action)));
}

async function refreshActions() {
  nodes.refreshButton.disabled = true;
  nodes.refreshButton.textContent = 'Refreshing';
  try {
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    const state = await response.json();
    renderState(state);
  } catch (error) {
    clearChildren(nodes.actions);
    nodes.message.textContent = error instanceof Error ? error.message : 'Unable to load VibeRaven actions.';
    nodes.message.hidden = false;
  } finally {
    nodes.refreshButton.disabled = false;
    nodes.refreshButton.textContent = 'Refresh';
  }
}

nodes.refreshButton.addEventListener('click', refreshActions);

if ('EventSource' in window) {
  const events = new EventSource('/api/events');
  events.addEventListener('actions', refreshActions);
  events.addEventListener('error', () => {});
}

refreshActions();
