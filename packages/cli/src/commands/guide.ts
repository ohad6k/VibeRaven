import pc from 'picocolors';
import { loadPlaybook, listPlaybookProviders } from '../playbooks/loadPlaybook';
import type { PlaybookStep } from '../playbooks/types';

export interface GuideCommandOptions {
  provider: string;
  step?: number;
  json?: boolean;
}

function formatPasteTarget(step: PlaybookStep): string | undefined {
  if (!step.pasteTarget) {
    return undefined;
  }
  return `${step.pasteTarget.file} → ${step.pasteTarget.keys.join(', ')}`;
}

export async function runGuideCommand(options: GuideCommandOptions): Promise<number> {
  let playbook;
  try {
    playbook = await loadPlaybook(options.provider);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(`Available providers: ${listPlaybookProviders().join(', ')}`);
    return 1;
  }

  const total = playbook.steps.length;
  const stepIndex = Math.min(Math.max((options.step ?? 1) - 1, 0), total - 1);
  const step = playbook.steps[stepIndex];

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          provider: playbook.provider,
          step: stepIndex + 1,
          total,
          id: step.id,
          title: step.title,
          instruction: step.instruction,
          openUrl: step.openUrl ?? null,
          copyValues: step.copyValues ?? [],
          pasteTarget: step.pasteTarget ?? null,
          events: step.events ?? []
        },
        null,
        2
      )
    );
    return 0;
  }

  console.log('');
  console.log(pc.bold(`Step ${stepIndex + 1}/${total} — ${step.title}`));
  console.log(pc.dim('─'.repeat(Math.max(24, step.title.length + 8))));
  console.log(step.instruction);
  if (step.events?.length) {
    console.log('');
    console.log(pc.bold('Events:'));
    for (const event of step.events) {
      console.log(`  • ${event}`);
    }
  }
  const paste = formatPasteTarget(step);
  if (paste) {
    console.log('');
    console.log(pc.bold('Paste target:'), paste);
  }
  if (step.openUrl) {
    console.log('');
    console.log(pc.bold('Open:'), `viberaven open ${playbook.provider}`);
    console.log(pc.dim(step.openUrl));
  }
  console.log('');
  return 0;
}
