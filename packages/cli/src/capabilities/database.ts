import type { CapabilityPack } from './types';
import { gapText } from './classify';

export const databasePack: CapabilityPack = {
  key: 'database',
  classify(gap) {
    const text = gapText(gap);
    return /database|supabase|rls|migration|postgres|pooler|query/.test(text);
  },
  riskTags(gap) {
    const text = gapText(gap);
    return [
      text.includes('rls') ? 'rls' : '',
      text.includes('migration') ? 'migration' : '',
      text.includes('pooler') || text.includes('5432') || text.includes('6543') ? 'connection-pooling' : '',
    ].filter(Boolean);
  },
};
