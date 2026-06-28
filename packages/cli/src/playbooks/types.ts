export interface PlaybookPasteTarget {
  file: string;
  keys: string[];
}

export interface PlaybookStep {
  id: string;
  title: string;
  instruction: string;
  openUrl?: string;
  copyValues?: string[];
  pasteTarget?: PlaybookPasteTarget;
  events?: string[];
}

export interface Playbook {
  id: string;
  provider: string;
  title: string;
  steps: PlaybookStep[];
}

export const PLAYBOOK_PROVIDERS = ['vercel', 'supabase', 'stripe', 'auth-supabase'] as const;

export type PlaybookProvider = (typeof PLAYBOOK_PROVIDERS)[number];
