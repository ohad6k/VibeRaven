/** Client-side panel renderer for static CLI reports (extension-style sidebar). */

export function buildProviderStackCommand(areaKey: string, provider: string): string {
  const commandProvider = String(provider == null ? '' : provider)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');

  return `viberaven stack set ${areaKey} ${commandProvider} && viberaven scan`;
}



export const PANEL_CLIENT_SCRIPT = `

(function () {

  var artifact = JSON.parse(document.getElementById('scan-data').textContent);

  var defaultAreaKey = JSON.parse(document.getElementById('default-area-key').textContent);

  var logoPayload = JSON.parse(document.getElementById('provider-logos').textContent);

  var panel = document.getElementById('detail-panel');

  var areas = (artifact.missionGraph && artifact.missionGraph.areas) || [];

  var gaps = artifact.gaps || [];

  var providerOptions = artifact.providerOptions || {};

  var selectedProviders = Object.assign({}, artifact.selectedProviders || {});

  var projectProviders = Object.assign({}, artifact.selectedProviders || {});

  var stackAutomation = artifact.stackAutomation || {};

  var STACK_AREAS = { database: 1, auth: 1, payments: 1, deployment: 1, monitoring: 1, security: 1 };

  var CHOICE_HINTS = {

    appFlow: 'Choose flow focus',

    frontend: 'Choose frontend focus',

    backend: 'Choose backend focus',

    auth: 'Choose auth stack',

    database: 'Choose database stack',

    payments: 'Choose payment stack',

    deployment: 'Choose deployment stack',

    monitoring: 'Choose monitoring stack',

    security: 'Choose security control',

    testing: 'Choose coverage target',

    landing: 'Choose launch item',

    errorHandling: 'Choose reliability control'

  };

  var LABELS = {

    appFlow: 'App Flow', frontend: 'Frontend', backend: 'Backend / API', auth: 'Auth',

    database: 'Database', payments: 'Payments', deployment: 'Deployment', monitoring: 'Monitoring / Analytics',

    security: 'Security', testing: 'Testing', landing: 'Landing / Onboarding', errorHandling: 'Error Handling'

  };

  var MAX_GROUP_ITEMS = 6;



  function esc(s) {

    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  }



  function attrEsc(s) {

    return esc(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  }



  function normalizeProviderToken(value) {

    return String(value == null ? '' : value)
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '');

  }

  function buildProviderStackCommand(areaKey, provider) {

    return 'viberaven stack set ' + areaKey + ' ' + normalizeProviderToken(provider) + ' && viberaven scan';

  }



  function normKey(p) {

    if (!p) return '';

    var raw = String(p).trim().toLowerCase();

    var compact = raw.replace(/[^a-z0-9]+/g, '');

    if (logoPayload.aliases[raw]) return logoPayload.aliases[raw];

    if (logoPayload.aliases[compact]) return logoPayload.aliases[compact];

    if (logoPayload.logos[compact]) return compact;

    var parts = raw.split('-').filter(Boolean);

    if (parts.length >= 2) {

      if (logoPayload.logos[parts[0]] || logoPayload.aliases[parts[0]]) return logoPayload.aliases[parts[0]] || parts[0];

      var two = parts.slice(0, 2).join('');

      if (logoPayload.logos[two] || logoPayload.aliases[two]) return logoPayload.aliases[two] || two;

      var twoHyphen = parts.slice(0, 2).join('-');

      if (logoPayload.aliases[twoHyphen]) return logoPayload.aliases[twoHyphen];

    }

    return compact;

  }



  function logoClass(p) {

    var key = normKey(p);

    if (!key) return '';

    var cls = ' provider-logo--' + key;

    if (logoPayload.brandKeys && logoPayload.brandKeys.indexOf(key) >= 0) {

      cls += ' provider-logo--brand';

    }

    return cls;

  }



  function logoHtml(p, label) {

    var key = normKey(p);

    if (key && logoPayload.inlineOnly && logoPayload.inlineOnly.indexOf(key) >= 0 && logoPayload.logos[key]) {

      return logoPayload.logos[key];

    }

    if (key && logoPayload.assetUrls && logoPayload.assetUrls[key]) {

      return '<img class="provider-logo__img" src="' + esc(logoPayload.assetUrls[key]) + '" alt="" decoding="async" data-provider-logo-key="' + esc(key) + '" />';

    }

    if (key && logoPayload.logos[key]) return logoPayload.logos[key];

    if (key && logoPayload.iconUrls && logoPayload.iconUrls[key]) {

      return '<img class="provider-logo__img" src="' + esc(logoPayload.iconUrls[key]) + '" alt="" decoding="async" data-provider-logo-key="' + esc(key) + '" />';

    }

    var t = (label || p || '?').trim();

    return '<span aria-hidden="true">' + esc(t.slice(0, 2).toUpperCase()) + '</span>';

  }



  function benefitText(p, desc) {

    var key = normKey(p);

    return (key && logoPayload.benefits[key]) || desc || 'Useful path for this section.';

  }



  function panelTitle(areaKey, label) {

    return esc(String(label || LABELS[areaKey] || areaKey).toUpperCase()) +

      (STACK_AREAS[areaKey] ? ' STACK' : ' CONTROLS');

  }



  function evidenceBadgeHtml(missions) {

    var open = missions.flatMap(function (m) {

      return (m.checks || []).filter(function (c) {

        return c.status === 'missing' || c.status === 'failed' || c.status === 'needs-connection';

      });

    });

    var tone = open.length > 0 ? 'missing' : 'repo';

    var label = open.length > 0 ? 'Missing repo fixes' : 'Repo evidence found';

    return '<span class="studio-evidence-badge studio-evidence-badge--' + tone + '">' + esc(label) + '</span>';

  }



  function automationFor(areaKey, mission, currentProvider) {

    var byKey = stackAutomation.byKey || {};

    if (mission && mission.key && byKey[mission.key]) return byKey[mission.key];

    var items = stackAutomation.items || [];

    var current = normKey(currentProvider || (mission && (mission.provider || mission.providerLabel)));

    return items.find(function (item) {

      return item.area === areaKey && (!current || normKey(item.provider || item.providerLabel) === current);

    }) || null;

  }



  function optionFor(areaKey, currentProvider) {

    var options = providerOptions[areaKey] || [];

    var current = normKey(currentProvider);

    return options.find(function (opt) {

      var p = opt.provider || opt.label;

      return p === currentProvider || normKey(p) === current;

    }) || null;

  }



  function sameProvider(a, b) {

    if (!a || !b) return false;

    return String(a).toLowerCase() === String(b).toLowerCase() || normKey(a) === normKey(b);

  }



  function projectProviderFor(areaKey, missions) {

    if (projectProviders[areaKey]) return projectProviders[areaKey];

    var mission = preferredMission(missions, '');

    return (mission && (mission.provider || mission.providerLabel)) || '';

  }



  function missionMatchesProvider(mission, currentProvider) {

    if (!mission || !currentProvider) return false;

    var current = normKey(currentProvider);

    return normKey(mission.provider || mission.providerLabel || mission.key) === current ||

      normKey(mission.providerLabel || mission.provider || mission.key) === current;

  }



  function missionForProvider(missions, currentProvider) {

    if (!missions || !missions.length) return null;

    if (!currentProvider) return missions[0];

    return missions.find(function (mission) {

      return missionMatchesProvider(mission, currentProvider);

    }) || null;

  }

  function missionEvidenceScore(mission) {

    if (!mission || !mission.checks) return 0;

    var repoVerified = mission.checks.filter(function (check) {

      return check.evidenceClass === 'repo-verified' || check.status === 'passed';

    }).length;

    var missing = mission.checks.filter(function (check) {

      return check.evidenceClass === 'missing-repo-fix' || check.status === 'missing' || check.status === 'failed';

    }).length;

    return repoVerified * 100 + (mission.readinessPercent || 0) - missing;

  }



  function preferredMission(missions, selectedProvider) {

    if (!missions || !missions.length) return null;

    var selected = selectedProvider ? missionForProvider(missions, selectedProvider) : null;

    if (selected) return selected;

    return missions.slice().sort(function (a, b) {

      return missionEvidenceScore(b) - missionEvidenceScore(a);

    })[0] || missions[0];

  }



  function providerLabelFor(areaKey, currentProvider, mission, areaLabel) {

    var opt = optionFor(areaKey, currentProvider);

    return (opt && opt.label) || (mission && mission.providerLabel) || currentProvider || areaLabel;

  }

  function readProviderTruthArea(areaKey) {

    var providerTruth = artifact.providerTruth || null;

    var truthAreas = providerTruth && Array.isArray(providerTruth.areas)

      ? providerTruth.areas.filter(function (area) { return area && typeof area === 'object'; })

      : [];

    if (!truthAreas.length) return null;

    var normalizedAreaKey = areaKey === 'errorHandling' ? 'monitoring' : areaKey;

    return truthAreas.find(function (area) { return area.area === areaKey; }) ||

      truthAreas.find(function (area) { return area.area === normalizedAreaKey; }) ||

      null;

  }

  function providerTruthBadgeClass(label) {

    var normalized = String(label || '').toLowerCase();

    if (normalized.indexOf('live') >= 0 || normalized.indexOf('verified') >= 0) return ' provider-truth-badge--live';

    if (normalized.indexOf('mcp') >= 0) return ' provider-truth-badge--mcp';

    if (normalized.indexOf('manual') >= 0) return ' provider-truth-badge--manual';

    if (normalized.indexOf('conflict') >= 0 || normalized.indexOf('failed') >= 0 || normalized.indexOf('needs') >= 0) return ' provider-truth-badge--warn';

    if (normalized.indexOf('using') >= 0) return ' provider-truth-badge--using';

    if (normalized.indexOf('repo') >= 0) return ' provider-truth-badge--repo';

    return '';

  }

  function providerTruthAreaUsingNow(areaKey) {

    var truthArea = readProviderTruthArea(areaKey);

    if (!truthArea || typeof truthArea !== 'object') return null;

    if (truthArea.liveVerified && typeof truthArea.liveVerified === 'object' && providerTruthRowHasLiveProof(truthArea.liveVerified)) return truthArea.liveVerified;

    var rows = Array.isArray(truthArea.rows)

      ? truthArea.rows.filter(function (row) { return row && typeof row === 'object'; })

      : [];

    return rows.find(function (row) {

      return providerTruthRowHasLiveProof(row);

    }) || null;

  }

  function providerTruthProviderIsUsingNow(areaKey, provider) {

    var usingNow = providerTruthAreaUsingNow(areaKey);

    if (!usingNow) return false;

    return sameProvider(usingNow.provider, provider) || sameProvider(usingNow.providerLabel, provider);

  }

  function providerTruthRowHasLiveProof(row) {

    var roles = Array.isArray(row && row.roles) ? row.roles.map(String) : [];

    var proof = row && row.mcpProof && typeof row.mcpProof === 'object' ? row.mcpProof : null;

    return roles.indexOf('live-verified') >= 0 || Boolean(proof && proof.status === 'live-verified');

  }

  function safeProviderTruthBadges(row) {

    var roles = Array.isArray(row && row.roles) ? row.roles.map(String) : [];

    var hasLiveProof = providerTruthRowHasLiveProof(row);

    var rawBadges = Array.isArray(row && row.statusBadges) ? row.statusBadges.map(String) : [];

    var filtered = rawBadges.filter(function (badge) {

      var normalized = badge.toLowerCase().replace(/[^a-z0-9]/g, '');

      return hasLiveProof || (normalized !== 'usingnow' && normalized !== 'mcplive' && normalized !== 'liveverified');

    });

    if (!hasLiveProof && (roles.indexOf('runtime-code') >= 0 || roles.indexOf('using-now') >= 0) && !filtered.some(function (badge) { return badge.toLowerCase().indexOf('runtime') >= 0; })) {

      return ['RUNTIME CODE'].concat(filtered);

    }

    return filtered;

  }

  function providerTruthHtml(areaKey) {

    var truthArea = readProviderTruthArea(areaKey);

    var rows = truthArea && Array.isArray(truthArea.rows)

      ? truthArea.rows.filter(function (row) { return row && typeof row === 'object'; }).slice(0, 4)

      : [];

    if (!truthArea || !rows.length) return '';

    var rowHtml = rows.map(function (row) {

      var providerLabel = row.providerLabel || row.provider || 'Provider';

      var confidence = row.confidence || 'none';

      var score = typeof row.score === 'number' ? Math.round(row.score) : null;

      var meta = ['Confidence ' + confidence];

      if (score !== null) meta.push('Score ' + score);

      var statusBadges = safeProviderTruthBadges(row);

      var badges = statusBadges.slice(0, 4).map(function (badge) {

        return '<span class="provider-truth-badge' + providerTruthBadgeClass(badge) + '">' + esc(badge) + '</span>';

      }).join('');

      var actions = Array.isArray(row.recommendedActions)

        ? row.recommendedActions.filter(function (action) { return action && typeof action === 'object'; })

        : [];

      var primaryAction = actions.find(function (action) { return action.primary; }) || actions[0];

      var actionHtml = primaryAction

        ? '<span class="provider-truth-row__action">' + esc(primaryAction.label) + '</span>'

        : '';

      return '<li class="provider-truth-row">' +

        '<div class="provider-truth-row__top provider-truth-row__main"><strong>' + esc(providerLabel) + '</strong><span class="provider-truth-row__meta">' + esc(meta.join(' | ')) + '</span></div>' +

        '<div class="provider-truth-badges provider-truth-row__badges">' + badges + '</div>' +

        actionHtml +

        '</li>';

    }).join('');

    var conflicts = Array.isArray(truthArea.conflicts)

      ? truthArea.conflicts.filter(function (conflict) { return conflict && typeof conflict === 'object'; })

      : [];

    var conflict = conflicts[0];

    var conflictHtml = conflict

      ? '<div class="provider-truth-alert"><strong>' + esc(conflict.title || 'Provider conflict') + '</strong>' + (conflict.detail ? '<span>' + esc(conflict.detail) + '</span>' : '') + '</div>'

      : '';

    var action = truthArea.recommendedAction && typeof truthArea.recommendedAction === 'object' ? truthArea.recommendedAction : null;

    var actionHtml = action && action.kind !== 'none'

      ? '<div class="provider-truth-next-action"><strong>' + esc(action.label) + '</strong>' + (action.reason ? '<span>' + esc(action.reason) + '</span>' : '') + '</div>'

      : '';

    return '<section class="provider-truth" aria-label="Provider truth">' +

      '<div class="provider-truth__head"><strong>Provider truth</strong><span>' + esc(rows.length === 1 ? '1 provider' : rows.length + ' providers') + '</span></div>' +

      '<ul class="provider-truth__rows">' + rowHtml + '</ul>' +

      conflictHtml +

      actionHtml +

      '</section>';

  }



  function itemLines(items, fallback, includeEvidence) {

    if (!items || !items.length) return fallback;

    return items.map(function (item) {

      var evidence = includeEvidence && item.evidence && item.evidence.length

        ? ' (' + item.evidence.slice(0, 3).join('; ') + ')'

        : '';

      return '- ' + item.label + evidence + (item.promptHint && !includeEvidence ? ': ' + item.promptHint : '');

    }).join('\\n');

  }



  function stackPromptFromMission(mission, providerLabel) {

    if (!mission || !(mission.checks && mission.checks.length)) return '';

    var subject = mission.promptSubject || providerLabel || mission.providerLabel || 'this stack';

    var passed = [];

    var missing = [];

    var manual = [];

    mission.checks.forEach(function (check) {

      var item = { label: check.label, promptHint: check.promptHint, evidence: check.evidence || [] };

      if (check.evidenceClass === 'repo-verified' || check.status === 'passed') passed.push(item);

      else if (check.evidenceClass === 'manual-dashboard') manual.push(item);

      else if (check.evidenceClass === 'mcp-verifier') manual.push(item);

      else if (check.evidenceClass === 'missing-repo-fix' || check.status === 'missing' || check.status === 'failed') missing.push(item);

    });

    var total = passed.length + missing.length;

    return [

      'Wire ' + subject + ' for this app safely.',

      '',

      'Current ' + subject + ' readiness: ' + passed.length + '/' + Math.max(total, 1) + ' repo checks passed (' + (mission.readinessPercent || 0) + '%).',

      '',

      'Repo evidence already found:',

      itemLines(passed, '- No ' + subject + ' checks passed yet.', true),

      '',

      'Missing ' + subject + ' checks:',

      itemLines(missing, '- No missing ' + subject + ' checks were found by VibeRaven.', false),

      '',

      'Manual checks that repo evidence cannot prove:',

      itemLines(manual, '- No manual dashboard checks were listed.', false),

      '',

      'First inspect the existing package.json files, env examples, framework routes, provider helpers, and server/client boundaries before editing.',

      '',

      'Implement:',

      '1. Close only the missing ' + subject + ' checks listed above.',

      '2. Follow the existing file structure and naming patterns.',

      '3. Keep provider secrets in server-only code and documented env templates.',

      '4. Keep external dashboard work explicit instead of claiming it from repo evidence.',

      '',

      'Constraints:',

      '- Do not rewrite unrelated auth, payments, UI, billing, deployment, or analytics code.',

      '- Do not expose secret keys to browser code, public env variables, or client-executed files.',

      '- Do not claim external provider dashboard setup is complete from repo evidence alone.',

      '',

      'Verification:',

      '- Run the relevant TypeScript/build/test command for this repo.',

      '- Confirm VibeRaven can rescan and move the missing checks to passed where repo evidence exists.',

      '- Summarize what changed and what still requires manual provider dashboard verification.'

    ].join('\\n');

  }



  function choiceTilesHtml(areaKey, currentProvider, missions, evidenceMissions) {

    var options = providerOptions[areaKey];

    if (!options || !options.length) return '';

    var projectProvider = projectProviderFor(areaKey, missions);

    var tiles = options.map(function (opt) {

      var p = opt.provider || opt.label;

      var active = sameProvider(p, currentProvider);

      var inProject = sameProvider(p, projectProvider);

      var desc = opt.description || benefitText(p);

      var providerOption = normKey(p) || normalizeProviderToken(p);

      var usingNow = providerTruthProviderIsUsingNow(areaKey, p);

      var status = usingNow ? 'Using now' : inProject ? 'Repo evidence' : active ? 'Added to setup' : 'Use this path';

      return '<button type="button" class="studio-choice-tile' + (active ? ' studio-choice-tile--selected' : '') + ((usingNow || inProject) ? ' studio-choice-tile--in-project' : '') +

        '" data-provider-option="' + attrEsc(providerOption) + '" data-provider-label="' + attrEsc(p) + '" data-area-key="' + attrEsc(areaKey) + '" aria-pressed="' + (active ? 'true' : 'false') + '">' +

        '<span class="studio-choice-tile__icon provider-logo' + logoClass(p) + '" aria-hidden="true">' + logoHtml(p, opt.label) + '</span>' +

        '<span class="studio-choice-tile__name">' + esc(opt.label) + '</span>' +

        '<span class="studio-choice-tile__desc">' + esc(desc) + '</span>' +

        '<span class="studio-choice-tile__status">' + status + '</span>' +

        '</button>';

    }).join('');

    var hintLabel = CHOICE_HINTS[areaKey] || ('Choose ' + (LABELS[areaKey] || areaKey).toLowerCase());

    return '<div class="studio-setup-panel__hint"><span>' + esc(hintLabel) + '</span>' + evidenceBadgeHtml(evidenceMissions || missions) + '</div>' +

      '<div class="studio-choice-list" role="group" aria-label="' + attrEsc(hintLabel) + '">' + tiles + '</div>';

  }



  function buildPrompt(areaKey, missions, providerLabel, automation) {

    if (automation) {

      if (automation.automationLevel === 'manual-only' && automation.verificationPrompt) return automation.verificationPrompt;

      if (automation.repoPrompt) return automation.repoPrompt;

      if (automation.promptRoutes && automation.promptRoutes['repo-fix'] && automation.promptRoutes['repo-fix'].body) {

        return automation.promptRoutes['repo-fix'].body;

      }

    }

    var areaGaps = missions[0] ? gaps.filter(function (g) { return g.primaryMapCategory === areaKey; }) : [];

    if (areaGaps[0] && areaGaps[0].copyPrompt) return areaGaps[0].copyPrompt;

    var missionPrompt = stackPromptFromMission(missions[0], providerLabel);

    if (missionPrompt) return missionPrompt;

    var missing = (missions[0] && missions[0].checks || []).filter(function (c) {

      return c.evidenceClass === 'missing-repo-fix' || c.status === 'missing' || c.status === 'failed';

    });

    if (missing[0] && missing[0].promptHint) return missing[0].promptHint;

    return setupPromptForProvider(areaKey, providerLabel);

  }



  function setupPromptForProvider(areaKey, providerLabel) {

    var areaLabel = LABELS[areaKey] || areaKey;

    var provider = providerLabel || areaLabel;

    return [

      'Set up ' + provider + ' for the ' + areaLabel + ' production section safely.',

      '',

      'Inspect first:',

      '- Review package.json files, env examples, framework routes, provider helpers, server/client boundaries, and existing ' + areaLabel.toLowerCase() + ' patterns before editing.',

      '- Identify the current framework, folder structure, naming style, validation style, and test/build commands.',

      '- If VibeRaven SIFG leak context is present, treat its leak IDs and allowed files as the source of truth.',

      '',

      'Implement:',

      '- Make the smallest repo-only changes needed to wire the ' + provider + ' path.',

      '- Add the right package or SDK only if it is missing.',

      '- Document required environment variable names in safe examples or setup docs without reading or exposing real secrets.',

      '- Add server-side integration points, route handlers, webhooks, guards, or helpers only where this repo structure expects them.',

      '',

      'Provider constraints:',

      '- Do not call provider APIs, mutate external projects, or edit VibeRaven dashboard state.',

      '- Keep dashboard/provider setup as explicit manual steps.',

      '- Do not claim live provider configuration is complete from repo changes alone.',

      '- Keep secrets in server-only code and env examples. Use placeholder env names only.',

      '',

      'Verification:',

      '- Run the closest relevant build, test, lint, or typecheck command.',

      '- Confirm repo evidence exists for each implemented item.',

      '- List provider dashboard checks separately as manual or read-only MCP verification.',

      '- Rescan VibeRaven after editing so repo evidence can move to verified.'

    ].join('\\n');


  }

  function evidenceSourceLabel(check) {

    if (!check) return 'Unknown';

    if (check.evidenceSource === 'provider') return 'Provider live';

    if (check.evidenceSource === 'mcp' || check.evidenceClass === 'mcp-verifier') return 'MCP';

    if (check.evidenceSource === 'manual' || check.evidenceClass === 'manual-dashboard' || check.status === 'user-confirmed') return 'Manual';

    if (check.evidenceSource === 'repo' || check.evidenceClass === 'repo-verified' || check.evidenceClass === 'repo-file') return 'Repo files';

    return 'Unknown';

  }



  function contractItem(label, detail, source, tone) {

    return {

      label: label || 'Unknown',

      detail: detail || '',

      source: source || 'Unknown',

      tone: tone || 'neutral'

    };

  }



  function checkDetail(check) {

    if (!check) return '';

    if (check.evidence && check.evidence[0]) return check.evidence[0];

    if (check.promptHint) return check.promptHint;

    if (check.status === 'unknown') return 'Not checked';

    if (check.status === 'needs-connection') return 'Needs verification';

    return '';

  }

  function isGenericDatabaseEvidenceCheck(areaKey, check) {

    if (areaKey !== 'database' || !check || typeof check !== 'object') return false;

    var id = String(check.id || '');

    var label = String(check.label || '');

    var genericIds = {

      'query-usage-found': true,

      'schema-or-model-found': true,

      'index-or-performance-evidence': true

    };

    var genericLabelPattern = new RegExp('database query usage|schema, model, or migration|schema/model/migration|index or performance|index/performance', 'i');

    return Boolean(genericIds[id] || genericLabelPattern.test(label));

  }

  function databaseProviderNeedles() {

    var needles = ['Supabase', 'Neon', 'Turso', 'MongoDB', 'MongoDB Atlas', 'PlanetScale', 'Firebase'];

    var options = providerOptions.database;

    if (Array.isArray(options)) {

      options.forEach(function (option) {

        if (typeof option === 'string') needles.push(option);

        else if (option && typeof option === 'object') {

          if (option.name) needles.push(option.name);

          if (option.toolName) needles.push(option.toolName);

          if (option.provider) needles.push(option.provider);

        }

      });

    }

    return needles.filter(Boolean);

  }

  function genericEvidenceMentionsDatabaseProvider(item) {

    var text = String((item && item.label) || '') + ' ' + String((item && item.source) || '') + ' ' + String((item && item.detail) || '') + ' ' + String((item && item.promptHint) || '');

    if (item && Array.isArray(item.evidence)) text += ' ' + item.evidence.join(' ');

    var lower = text.toLowerCase();

    var normalized = normalizeProviderToken(text);

    return databaseProviderNeedles().some(function (needle) {

      var lowerNeedle = String(needle).toLowerCase();

      var normalizedNeedle = normalizeProviderToken(needle);

      return (lowerNeedle && lower.indexOf(lowerNeedle) >= 0) || (normalizedNeedle && normalized.indexOf(normalizedNeedle) >= 0);

    });

  }

  function genericDatabaseEvidenceForArea(areaKey, checks) {

    if (areaKey !== 'database') return [];

    var byKey = artifact.stackWiring && artifact.stackWiring.byKey && typeof artifact.stackWiring.byKey === 'object'

      ? artifact.stackWiring.byKey

      : {};

    var genericIds = {

      'query-usage-found': true,

      'schema-or-model-found': true,

      'index-or-performance-evidence': true

    };

    var genericLabelPattern = new RegExp('database query usage|schema,?\\\\s*model,?\\\\s*or\\\\s*migration|schema/model/migration|index\\\\s*or\\\\s*performance|index/performance', 'i');

    var seen = {};

    var items = [];

    function addGenericItem(item) {

      if (!item || typeof item !== 'object') return;

      var id = String(item.id || '');

      var label = String(item.label || '');

      if (!genericIds[id] && !genericLabelPattern.test(label) && !isGenericDatabaseEvidenceCheck(areaKey, item)) return;

      if (genericEvidenceMentionsDatabaseProvider(item)) return;

      var dedupeKey = id || label.toLowerCase();

      if (!dedupeKey || seen[dedupeKey]) return;

      seen[dedupeKey] = true;

      items.push({

        id: id,

        label: label,

        source: 'Generic repo',

        evidence: Array.isArray(item.evidence) ? item.evidence : []

      });

    }

    (Array.isArray(checks) ? checks : []).forEach(function (check) {

      if (isGenericDatabaseEvidenceCheck(areaKey, check)) addGenericItem(check);

    });

    Object.keys(byKey).forEach(function (key) {

      var row = byKey[key];

      if (!row || typeof row !== 'object' || row.area !== 'database' || !Array.isArray(row.items)) return;

      row.items.forEach(function (item) {

        if (!item || typeof item !== 'object' || item.status !== 'passed') return;

        addGenericItem(item);

      });

    });

    return items;

  }

  function contractRepoPercent(areaKey, mission, checks) {

    if (areaKey === 'database') {

      var repoChecks = (Array.isArray(checks) ? checks : []).filter(function (check) {

        if (isGenericDatabaseEvidenceCheck(areaKey, check)) return false;

        var source = evidenceSourceLabel(check);

        return source === 'Repo files' || check.evidenceClass === 'missing-repo-fix' || check.status === 'missing' || check.status === 'failed';

      });

      if (!repoChecks.length) return 0;

      var passed = repoChecks.filter(function (check) {

        return evidenceSourceLabel(check) === 'Repo files' && (check.status === 'passed' || check.status === 'user-confirmed');

      }).length;

      return Math.max(0, Math.min(100, Math.round((passed / repoChecks.length) * 100)));

    }

    return typeof (mission && mission.repoReadinessPercent) === 'number'

      ? Math.max(0, Math.min(100, Math.round(mission.repoReadinessPercent)))

      : typeof (mission && mission.readinessPercent) === 'number'

        ? Math.max(0, Math.min(100, Math.round(mission.readinessPercent)))

        : 0;

  }



  function buildCliSidebarContract(areaKey, label, mission, categoryGaps, providerLabel, automation) {

    var connected = [];

    var missing = [];

    var manual = [];

    var checks = mission && Array.isArray(mission.checks) ? mission.checks : [];

    var mcpProvider = (automation && automation.mcpProvider) || '';

    checks.forEach(function (check) {

      if (isGenericDatabaseEvidenceCheck(areaKey, check)) return;

      var source = evidenceSourceLabel(check);

      var item = contractItem(check.label, checkDetail(check), source, source === 'Repo files' ? 'repo' : source === 'MCP' ? 'mcp' : source === 'Manual' ? 'manual' : 'neutral');

      if ((check.status === 'passed' || check.status === 'user-confirmed') && source !== 'Unknown') {

        connected.push(item);

        return;

      }

      if (check.evidenceClass === 'missing-repo-fix' || check.status === 'missing' || check.status === 'failed') {

        missing.push(contractItem(check.label, checkDetail(check), 'Repo files', 'missing'));

        return;

      }

      if (source === 'Manual' || source === 'MCP' || check.status === 'needs-connection' || check.status === 'unknown') {

        manual.push(contractItem(check.label, checkDetail(check) || 'Not checked', source, 'manual'));

      }

    });

    (Array.isArray(categoryGaps) ? categoryGaps : []).slice(0, 4).forEach(function (gap) {

      missing.push(contractItem(gap.title || 'Product gap needs repo review', gap.detail || 'Agent can inspect and adjust repo implementation.', 'Repo files', 'missing'));

    });

    if (!checks.length) {

      manual.push(contractItem('Provider live proof', 'Not checked', 'Unknown', 'manual'));

    }

    if (!manual.length) {

      manual.push(contractItem('Provider live proof', 'Not checked', 'Unknown', 'manual'));

    }

    return {

      areaKey: areaKey,

      areaLabel: label || LABELS[areaKey] || areaKey,

      providerKey: (mission && (mission.provider || mission.providerLabel)) || providerLabel || '',

      providerLabel: providerLabel || 'Selected provider',

      connected: connected,

      missing: missing,

      manual: manual,

      genericEvidence: genericDatabaseEvidenceForArea(areaKey, checks),

      repoPercent: contractRepoPercent(areaKey, mission, checks),

      providerPercent: typeof (mission && mission.providerReadinessPercent) === 'number'
        ? Math.max(0, Math.min(100, Math.round(mission.providerReadinessPercent)))
        : 0,

      hasMcpAccess: Boolean(mcpProvider) || checks.some(function (check) {
        return check.evidenceSource === 'mcp' || check.evidenceClass === 'mcp-verifier' || check.verificationStatus === 'needs_mcp';
      })

    };

  }



  function contractLines(items) {

    return (items && items.length ? items : [{ label: 'None', detail: 'No artifact-backed item.', source: 'Unknown' }]).map(function (item) {

      return '- [' + (item.source || 'Unknown') + '] ' + item.label + (item.detail ? ': ' + item.detail : '');

    }).join('\\n');

  }



  function focusedContractPrompt(contract) {

    return [

      'VibeRaven selected-node production checklist',

      '',

      'Node: ' + contract.areaLabel,

      'Selected provider context: ' + contract.providerLabel,

      '',

      'Verified evidence:',

      contractLines(contract.connected),

      '',

      'Agent-code actions:',

      contractLines(contract.missing),

      '',

      'Human-provider actions:',

      contractLines(contract.manual),

      '',

      'Rules:',

      '- Selected provider is context only and does not mean connected.',

      '- Repo evidence, Provider live/MCP proof, and Manual confirmation are separate artifact categories.',

      '- Manual confirmation is human confirmation only; it is not connected or live proof.',

      '- Do not represent human-provider actions as completed code fixes.'

    ].join('\\n');

  }



  function sidebarStatusBadge(contract) {

    if ((contract.connected || []).some(function (item) { return item.source === 'Repo files'; })) return 'Repo evidence found';

    if ((contract.missing || []).length) return 'Missing repo fixes';

    if ((contract.manual || []).length) return 'Manual check';

    return 'Selected only';

  }



  function sidebarReadinessSentence(contract) {

    var hasRepo = (contract.connected || []).some(function (item) { return item.source === 'Repo files'; });

    var hasLive = (contract.connected || []).some(function (item) { return item.source === 'Provider live' || item.source === 'MCP'; });

    var hasManual = (contract.connected || []).some(function (item) { return item.source === 'Manual'; }) ||
      (contract.manual || []).some(function (item) { return item.source === 'Manual'; });

    if (hasRepo && !hasLive) return 'Repo found. Live not checked.';

    if (hasLive) return 'Live proof exists in the scan artifact.';

    if (hasManual) return 'Manual confirmation exists. Live proof is still not verified.';

    if ((contract.missing || []).length) return 'Repo gaps found. Live not checked.';

    return 'No verified evidence yet.';

  }



  function contractMetricHtml(label, percent, value, isLive) {

    var safePercent = Math.max(0, Math.min(100, Math.round(percent || 0)));

    return '<div class="studio-sidebar-contract__compact-metric' + (isLive ? ' studio-sidebar-contract__compact-metric--live' : '') + '">' +

      '<span>' + esc(label) + '</span>' +

      '<strong>' + esc(value || (safePercent + '%')) + '</strong>' +

      '<i class="studio-sidebar-contract__compact-meter" aria-hidden="true"><b style="width:' + safePercent + '%"></b></i>' +

      '</div>';

  }



  function contractReadinessHtml(contract) {

    var providerKey = contract.providerKey || contract.providerLabel || contract.areaLabel;

    var providerStatus = contract.providerPercent > 0 ? contract.providerPercent + '%' : 'Not checked';

    return '<section class="studio-sidebar-contract__readiness" aria-label="' + attrEsc(contract.providerLabel + ' readiness') + '">' +

      '<div class="studio-sidebar-contract__head">' +

      '<span class="studio-sidebar-contract__logo provider-logo' + logoClass(providerKey) + '" title="' + attrEsc(contract.providerLabel) + '" aria-hidden="true">' + logoHtml(providerKey, contract.providerLabel) + '</span>' +

      '<div class="studio-sidebar-contract__head-text"><strong>' + esc(contract.providerLabel) + '</strong><span>' + esc(contract.areaLabel) + '</span></div>' +

      '<span class="studio-sidebar-contract__status">' + esc(sidebarStatusBadge(contract)) + '</span>' +

      '</div>' +

      '<div class="studio-sidebar-contract__compact-metrics">' +

      contractMetricHtml('Repo files', contract.repoPercent, contract.repoPercent + '%', false) +

      contractMetricHtml('Provider live', contract.providerPercent, providerStatus, true) +

      '</div>' +

      '<p class="studio-sidebar-contract__summary">' + esc(sidebarReadinessSentence(contract)) + '</p>' +

      '</section>';

  }



  function contractRepoSignalsHtml(contract) {

    var repoItems = (contract.connected || []).filter(function (item) { return item.source === 'Repo files'; });

    if (!repoItems.length) return '';

    var rows = repoItems.slice(0, 6).map(function (item) {

      return '<li><strong>' + esc(item.label || 'Repo evidence') + '</strong><span>' + esc(item.source || 'Repo files') + '</span></li>';

    }).join('');

    return '<section class="studio-sidebar-contract__repo-signals">' +

      '<h4>' + repoItems.length + ' repo signal' + (repoItems.length === 1 ? '' : 's') + ' in the codebase.</h4>' +

      '<ul class="studio-sidebar-contract__signal-list">' + rows + '</ul>' +

      '</section>';

  }

  function contractGenericEvidenceHtml(contract) {

    var items = Array.isArray(contract.genericEvidence) ? contract.genericEvidence : [];

    if (!items.length) return '';

    var rows = items.slice(0, 4).map(function (item) {

      return '<li>' + esc(item.label || '') + '</li>';

    }).join('');

    return '<section class="studio-sidebar-contract__generic-evidence">' +

      '<h4>Generic database evidence</h4>' +

      '<p>These checks prove database structure or usage, not a specific provider.</p>' +

      '<ul>' + rows + '</ul>' +

      '</section>';

  }



  function contractAttentionItems(contract) {

    var items = [];

    (contract.missing || []).slice(0, 3).forEach(function (item) {

      items.push({

        label: item.label,

        detail: item.detail || 'Repo/config check needs attention.',

        source: 'Agent-code',

        next: 'Ask the agent to inspect related files and patch only repo code/config.'

      });

    });

    (contract.manual || []).slice(0, 3).forEach(function (item) {

      items.push({

        label: item.label,

        detail: item.detail || 'MCP/API/dashboard required.',

        source: item.source === 'MCP' ? 'MCP' : 'Manual',

        next: item.source === 'MCP' ? 'Use read-only MCP/API verification.' : 'Ask the user to confirm the provider dashboard.'

      });

    });

    return items;

  }



  function contractAttentionHtml(contract) {

    var items = contractAttentionItems(contract);

    if (!items.length) return '';

    function attentionRow(item) {

      return '<li class="studio-sidebar-contract__attention-item">' +

        '<div class="studio-sidebar-contract__attention-top"><strong>' + esc(item.label || 'Attention') + '</strong><em>' + esc(item.source || 'Verify') + '</em></div>' +

        (item.detail ? '<span>' + esc(item.detail) + '</span>' : '') +

        (item.next ? '<b>' + esc(item.next) + '</b>' : '') +

        '</li>';

    }

    var first = attentionRow(items[0]);

    var more = items.length > 1

      ? '<li class="studio-sidebar-contract__attention-more"><details class="studio-sidebar-contract__attention-details"><summary>+' + (items.length - 1) + ' more details</summary><ul class="studio-sidebar-contract__attention-detail-list">' +

        items.slice(1).map(function (item) {

          return '<li><strong>' + esc(item.label || 'Attention') + '</strong>' +

            (item.detail ? '<span>' + esc(item.detail) + '</span>' : '') +

            (item.next ? '<b>' + esc(item.next) + '</b>' : '') +

            '</li>';

        }).join('') +

        '</ul></details></li>'

      : '';

    return '<section class="studio-sidebar-contract__attention"><h4>Attention</h4><ul class="studio-sidebar-contract__attention-list">' + first + more + '</ul></section>';

  }



  function contractNextActionHtml(contract, prompt) {

    var buttonText = (contract.missing || []).length ? 'Copy focused agent prompt' : (contract.manual || []).length ? 'Copy live check prompt' : 'Copy verification prompt';

    var note = (contract.missing || []).length ? 'Inspect repo wiring, patch scoped gaps, then rescan.' : (contract.manual || []).length ? 'Confirm in dashboard or connect MCP.' : 'Inspect repo wiring, then verify live setup.';

    var accessClass = contract.hasMcpAccess ? ' studio-sidebar-contract__access-state--confirmed' : ' studio-sidebar-contract__access-state--needs-connection';

    var accessLabel = contract.hasMcpAccess ? 'Available' : 'Connect';

    return '<div class="studio-sidebar-contract__next-action">' +

      '<strong>Next best action</strong>' +

      '<p>' + esc(note) + '</p>' +

      '<div class="studio-sidebar-contract__access-state' + accessClass + '"><span>MCP/API access</span><b>' + esc(accessLabel) + '</b></div>' +

      '<div class="studio-sidebar-contract__actions"><button type="button" class="studio-action-button studio-action-button--primary" data-copy-prompt="' + attrEsc(prompt) + '">' + esc(buttonText) + '</button></div>' +

      '</div>';

  }



  function selectedNodeContractHtml(contract) {

    var prompt = focusedContractPrompt(contract);

    return '<section class="studio-sidebar-contract" aria-label="Selected node production checklist">' +

      contractReadinessHtml(contract) +

      contractRepoSignalsHtml(contract) +

      contractGenericEvidenceHtml(contract) +

      contractAttentionHtml(contract) +

      contractNextActionHtml(contract, prompt) +

      '</section>';

  }



  function setupActionsHtml(areaKey, missions, providerLabel, automation) {

    var prompt = buildPrompt(areaKey, missions, providerLabel, automation);

    var hasFixes = (missions[0] && missions[0].checks || []).some(function (c) {

      return c.evidenceClass === 'missing-repo-fix' || c.status === 'missing' || c.status === 'failed';

    });

    var isManualOnly = automation && automation.automationLevel === 'manual-only';

    var mcpCheck = (missions[0] && missions[0].checks || []).find(function (c) {

      return c.evidenceClass === 'mcp-verifier';

    });

    var mcpProvider = (automation && automation.mcpProvider) ||

      (mcpCheck && (mcpCheck.providerKey || mcpCheck.provider || normKey(providerLabel)));

    var supportsMcp = Boolean(mcpProvider);

    var providerKey = (missions[0] && (missions[0].provider || missions[0].providerLabel)) || providerLabel || LABELS[areaKey] || areaKey;

    var title = esc(providerLabel || LABELS[areaKey] || areaKey) + (isManualOnly ? ' manual check' : hasFixes ? ' fix prompt' : ' setup');

    var meta = supportsMcp ? 'MCP verification available' : 'Prompt only';

    var copy = isManualOnly

      ? 'Repo fixes are already clear. Use the manual checklist for provider dashboard work, then rescan.'

      : hasFixes

        ? 'One prompt for the missing repo fixes above. Manual dashboard checks stay separate.'

        : supportsMcp

          ? 'Use this setup prompt when starting with this provider. The MCP helper is optional.'

          : 'Use this setup prompt when starting with this provider. No trusted MCP helper is available yet.';

    var label = isManualOnly ? 'Copy Checklist' : hasFixes ? 'Copy Fix Prompt' : 'Copy Setup Prompt';

    return '<section class="studio-setup-actions" aria-label="Setup actions">' +

      '<div class="studio-setup-actions__head">' +

      '<span class="studio-setup-actions__logo provider-logo' + logoClass(providerKey) + '" title="' + attrEsc(providerLabel || providerKey) + '" aria-hidden="true">' + logoHtml(providerKey, providerLabel) + '</span>' +

      '<div class="studio-setup-actions__title"><strong>' + title + '</strong><span>' + meta + '</span></div>' +

      '</div>' +

      '<p class="studio-setup-actions__copy">' + esc(copy) + '</p>' +

      '<div class="studio-setup-actions__buttons">' +

      '<button type="button" class="studio-action-button studio-action-button--primary" data-copy-prompt="' + attrEsc(prompt) + '">' +

      label + '</button>' +

      '</div>' +

      (supportsMcp

        ? '<div class="studio-setup-actions__mcp-row"><p class="studio-setup-actions__auth-note"><strong>MCP verifier not configured</strong><br />Optional MCP verification stays read-only and must use credentials already configured by the IDE. VibeRaven does not read real .env files or store provider API keys.</p><button type="button" class="studio-action-button" data-copy-prompt="' + attrEsc('Use read-only ' + mcpProvider + ' MCP verification for ' + (providerLabel || LABELS[areaKey] || areaKey) + '. Report evidence only; do not mutate provider settings or claim dashboard setup from repo edits.') + '">MCP Verify</button></div>'

        : '') +

      '</section>';

  }



  function addedSetupPathHtml(areaKey, currentProvider, providerLabel, missions) {

    var projectProvider = projectProviderFor(areaKey, missions);

    if (!currentProvider || sameProvider(currentProvider, projectProvider)) return '';

    return '<section class="studio-added-path" aria-label="Added setup path">' +

      '<div class="studio-added-path__title">Added setup path</div>' +

      '<div class="studio-added-path__pill">' +

      '<span class="studio-added-path__icon provider-logo' + logoClass(currentProvider) + '" aria-hidden="true">' + logoHtml(currentProvider, providerLabel) + '</span>' +

      '<strong>' + esc(providerLabel) + '</strong>' +

      '</div>' +

      '</section>';

  }



  function setupReadinessHtml(areaKey, currentProvider, providerLabel, missions, automation) {

    if (missions[0]) return '';

    var provider = providerLabel || currentProvider || (LABELS[areaKey] || areaKey);

    var repoItems = [

      { label: provider + ' repo wiring', detail: 'Not checked' },

      { label: provider + ' env names', detail: 'Unknown' },

      { label: provider + ' server route', detail: 'Unknown' }

    ];

    var manualItems = [

      { label: 'Production account', detail: 'Not checked' },

      { label: 'Webhook or credentials', detail: 'Not checked' }

    ];

    var external = automation && automation.mcpProvider

      ? groupHtml('Provider live check', [{ label: provider + ' read-only MCP check available', detail: 'Use read-only MCP verification when already configured by the IDE.' }], 'external')

      : '';

    return '<section class="studio-verification studio-provider-readiness" aria-label="' + attrEsc(provider + ' setup readiness') + '">' +

      '<h3 class="studio-verification__title">' + esc(provider) + '</h3>' +

      readinessMetersHtml(0, 0, 'Not checked', provider) +


      repoEvidenceCardHtml(repoItems.map(function (item) {

        return { label: item.label, detail: item.detail, tone: 'missing' };

      }), repoItems.length) +

      external +

      groupHtml('Provider live check', manualItems, 'manual') +

      '</section>';

  }



  function readinessMetersHtml(repoPercent, providerPercent, providerStatus, providerLabel) {

    var repo = Math.max(0, Math.min(100, Math.round(repoPercent || 0)));

    var provider = Math.max(0, Math.min(100, Math.round(providerPercent || 0)));
    var providerValue = providerStatus || (provider + '%');

    return '<div class="verification-card studio-mission-card studio-mission-card--provider" aria-label="Repo and live provider readiness">' +

      '<span class="studio-mission-card__title">' + esc(providerLabel || 'Provider') + '</span>' +

      '<div class="verification-meter studio-mission-card__meters">' +

      '<b class="studio-mission-card__meter-row studio-mission-card__meter-row--repo"><span class="studio-mission-card__meter-label">Repo files</span><span class="verification-meter__bar studio-mission-card__meter" aria-hidden="true"><span class="verification-meter__fill studio-mission-card__meter-fill" style="width:' + repo + '%"></span></span><span class="studio-mission-card__meter-value">' + repo + '%</span></b>' +

      '<b class="studio-mission-card__meter-row studio-mission-card__meter-row--provider"><span class="studio-mission-card__meter-label">Provider live</span><span class="verification-meter__bar studio-mission-card__meter" aria-hidden="true"><span class="verification-meter__fill studio-mission-card__meter-fill" style="width:' + provider + '%"></span></span><span class="studio-mission-card__meter-value">' + esc(providerValue) + '</span></b>' +

      '</div>' +

    '</div>';

  }



  function checkToItem(check) {

    var ev = (check.evidence && check.evidence[0]) ? check.evidence[0] : (check.promptHint || '');

    return { label: check.label, detail: ev };

  }

  function checkGroupKey(check) {

    if (check.evidenceClass === 'manual-dashboard') return 'manual-dashboard';

    if (check.evidenceSource === 'provider' || check.evidenceSource === 'mcp' || check.evidenceClass === 'mcp-verifier' || check.status === 'needs-connection' || check.status === 'unknown') return 'mcp-verifier';

    if (check.evidenceClass === 'repo-verified' || check.status === 'passed') return 'repo-verified';

    return 'missing-repo-fix';

  }

  function providerChecksForMission(mission) {

    return (mission.checks || []).filter(function (check) {

      return check.evidenceSource === 'provider' || check.evidenceSource === 'mcp' || check.evidenceClass === 'mcp-verifier';

    });

  }

  function providerStatusValue(mission, providerPercent) {

    var checks = providerChecksForMission(mission);

    if (!checks.length) return 'No live checks';

    var needsMcp = checks.some(function (check) {

      return check.status === 'needs-connection' || check.verificationStatus === 'needs_mcp';

    });

    if (needsMcp) return 'Needs MCP';

    return providerPercent > 0 ? providerPercent + '%' : 'Not checked';

  }

  function diffHtml(mission) {

    var layer = artifact && artifact.missionGraph && artifact.missionGraph.verificationLayer;

    var diffs = layer && Array.isArray(layer.diffs) ? layer.diffs : [];

    var provider = normalizeProviderToken(mission.provider || '');

    var area = mission.area || '';

    var matches = diffs.filter(function (diff) {

      return normalizeProviderToken(diff.provider || '') === provider && (!area || diff.area === area);

    });

    if (!matches.length) return '';

    var rows = matches.slice(0, 4).map(function (diff) {

      return '<div class="studio-mismatch-card__row">' +

        '<span class="studio-mismatch-card__title">' + esc(diff.title || 'Provider mismatch') + '</span>' +

        '<div class="studio-mismatch-card__comparison">' +

        '<span class="studio-mismatch-card__side studio-mismatch-card__side--repo"><b>Repo</b><em>' + esc(diff.repoExpectation || 'Expected setup evidence in repository') + '</em></span>' +

        '<span class="studio-mismatch-card__side studio-mismatch-card__side--live"><b>Live</b><em>' + esc(diff.providerActual || 'Not verified') + '</em></span>' +

        '</div></div>';

    }).join('');

    return '<div class="studio-mismatch-card">' +

      '<div class="studio-mismatch-card__head"><strong>Mismatch</strong><span class="studio-mismatch-card__count">' + matches.length + '</span></div>' +

      '<p class="studio-mismatch-card__note">Repo evidence is present, but the live provider still needs MCP or dashboard confirmation.</p>' +

      '<div class="studio-mismatch-card__list">' + rows + '</div></div>';

  }



  function groupHtml(label, items, tone) {

    if (!items.length) return '';

    var slice = items.slice(0, MAX_GROUP_ITEMS);

    var rows = slice.map(function (item) {

      var title = item.detail ? ' title="' + attrEsc(item.detail) + '"' : '';

      return '<li class="studio-verification__item' + (tone === 'manual' ? ' studio-verification__item--manual' : '') + '"' + title + '><span class="studio-verification__item-label">' + esc(item.label) + '</span></li>';

    }).join('');

    var more = items.length > MAX_GROUP_ITEMS

      ? '<li class="studio-verification__item studio-verification__item--more">+' + (items.length - MAX_GROUP_ITEMS) + ' more</li>'

      : '';

    return '<div class="studio-verification__group studio-verification__group--' + tone + '">' +

      '<div class="studio-verification__group-title"><strong>' + esc(label) + '</strong>' +

      '<span class="studio-verification__count">' + items.length + '</span></div>' +

      '<ul class="studio-verification__list">' + rows + more + '</ul></div>';

  }

  function repoEvidenceCardHtml(repoItems, missingCount) {

    if (!repoItems.length) return '';

    var rows = repoItems.slice(0, 7).map(function (item) {

      var tone = item.tone || 'verified';
      var statusLabel = tone === 'missing' ? 'Fix needed' : 'Verified';
      var title = item.detail ? ' title="' + attrEsc(item.detail) + '"' : '';

      return '<li class="studio-mission-card__check studio-mission-card__check--' + esc(tone) + '"' + title + '>' +

        '<b class="studio-mission-card__check-label">' + esc(item.label) + '</b>' +

        '<em class="studio-mission-card__check-status">' + esc(statusLabel) + '</em>' +

      '</li>';

    }).join('');

    return '<div class="repo-evidence-card studio-mission-card studio-mission-card--repo">' +

      '<span class="studio-mission-card__title">' +

      (missingCount > 0

        ? missingCount + ' repo fix' + (missingCount === 1 ? '' : 'es') + ' in the codebase.'

        : repoItems.length + ' repo check' + (repoItems.length === 1 ? '' : 's') + ' verified in the codebase.') +

      '</span>' +

      '<ul class="studio-mission-card__check-list">' + rows + '</ul>' +

    '</div>';

  }



  function missionBlockHtml(missions, providerLabel) {

    var mission = missions[0];

    if (!mission || !(mission.checks && mission.checks.length)) return '';

    var groups = {

      'repo-verified': [],

      'missing-repo-fix': [],

      'mcp-verifier': [],

      'manual-dashboard': []

    };

    mission.checks.forEach(function (check) {

      var bucket = checkGroupKey(check);

      groups[bucket].push(checkToItem(check));

    });

    var actionable = groups['repo-verified'].length + groups['missing-repo-fix'].length;
    var providerChecks = providerChecksForMission(mission);
    var providerPercent = typeof mission.providerReadinessPercent === 'number'
      ? Math.max(0, Math.min(100, Math.round(mission.providerReadinessPercent)))
      : 0;
    var providerValue = providerStatusValue(mission, providerPercent);
    var repoPercent = typeof mission.repoReadinessPercent === 'number'
      ? Math.max(0, Math.min(100, Math.round(mission.repoReadinessPercent)))
      : (mission.readinessPercent || 0);
    var repoItems = groups['missing-repo-fix'].map(function (item) {

      return { label: item.label, detail: item.detail, tone: 'missing' };

    }).concat(groups['repo-verified'].map(function (item) {

      return { label: item.label, detail: item.detail, tone: 'verified' };

    }));

    var body =

      repoEvidenceCardHtml(repoItems, groups['missing-repo-fix'].length) +

      groupHtml('Provider live check', groups['mcp-verifier'], 'external') +

      groupHtml('Manual dashboard check', groups['manual-dashboard'], 'manual') +

      diffHtml(mission);

    if (!body) return '';

    return '<section class="studio-verification studio-wiring studio-mission-graph" aria-label="Mission evidence">' +

      readinessMetersHtml(repoPercent, providerPercent, providerValue, providerLabel || mission.providerLabel || 'Detected evidence') +

      body + '</section>';

  }



  function render(areaKey) {

    var area = areas.find(function (a) { return a.key === areaKey; });

    document.querySelectorAll('.studio-node').forEach(function (n) {

      var selected = n.getAttribute('data-area-key') === areaKey;

      n.classList.toggle('studio-node--selected', selected);

      n.setAttribute('aria-pressed', selected ? 'true' : 'false');

    });

    var label = (area && area.label) || LABELS[areaKey] || areaKey;

    var missions = (area && area.providerMissions) || [];

    var selectedBeforeRender = selectedProviders[areaKey] || '';

    var defaultMission = preferredMission(missions, selectedBeforeRender);

    var current = selectedProviders[areaKey] ||

      (defaultMission && (defaultMission.provider || defaultMission.providerLabel)) || '';

    var mission = missionForProvider(missions, current) || (!selectedBeforeRender ? defaultMission : null);

    var panelMissions = mission ? [mission] : [];

    var providerLabel = providerLabelFor(areaKey, current, mission, label);

    var automation = automationFor(areaKey, mission, current);

    var categoryGaps = gaps.filter(function (gap) { return gap.primaryMapCategory === areaKey; });

    var contract = buildCliSidebarContract(areaKey, label, mission, categoryGaps, providerLabel, automation);



    panel.innerHTML =

      '<div class="studio-setup-panel__inner">' +

        '<div class="studio-setup-panel__head">' +

          '<div class="studio-setup-panel__title">' + panelTitle(areaKey, label) + '</div>' +

        '</div>' +

        choiceTilesHtml(areaKey, current, missions, panelMissions) +

        addedSetupPathHtml(areaKey, current, providerLabel, missions) +

        providerTruthHtml(areaKey) +

        setupActionsHtml(areaKey, panelMissions, providerLabel, automation) +

         setupReadinessHtml(areaKey, current, providerLabel, panelMissions, automation) +

         selectedNodeContractHtml(contract) +

       '</div>';



    panel.querySelectorAll('[data-provider-option]').forEach(function (tile) {

      tile.addEventListener('click', function () {

        var providerOption = tile.getAttribute('data-provider-option') || '';

        if (!providerOption) return;

        selectedProviders[areaKey] = providerOption;

        render(areaKey);

      });

    });



    panel.querySelectorAll('[data-copy-prompt]').forEach(function (btn) {

      btn.addEventListener('click', function () {

        var text = btn.getAttribute('data-copy-prompt') || '';

        navigator.clipboard.writeText(text).then(function () {

          var label = btn.textContent;

          btn.textContent = 'Copied';

          setTimeout(function () { btn.textContent = label; }, 1200);

        });

      });

    });

  }



  document.querySelectorAll('.studio-node').forEach(function (n) {

    n.addEventListener('click', function () { render(n.getAttribute('data-area-key')); });

  });



  document.addEventListener(

    'error',

    function (ev) {

      var img = ev.target;

      if (!img || !img.classList || !img.classList.contains('provider-logo__img')) return;

      var key = img.getAttribute('data-provider-logo-key');

      if (!key || !logoPayload.logos[key]) return;

      var wrap = document.createElement('span');

      wrap.innerHTML = logoPayload.logos[key];

      var svg = wrap.firstElementChild;

      if (svg) img.replaceWith(svg);

    },

    true

  );



  render(defaultAreaKey);

})();

`;
