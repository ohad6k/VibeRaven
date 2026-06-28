import type { CapabilityPack } from './types';
import { gapText } from './classify';

export const scalingPack: CapabilityPack = {
  key: 'scaling',
  classify(gap) {
    const text = gapText(gap);
    return /serverless|vercel|pooler|rate limit|rate-limit|cache|queue|cron|worker|runtime|connection/.test(text);
  },
  riskTags(gap) {
    const text = gapText(gap);
    return [
      text.includes('serverless') || text.includes('vercel') ? 'serverless' : '',
      text.includes('pooler') || text.includes('connection') ? 'db-connection' : '',
      text.includes('rate limit') || text.includes('rate-limit') ? 'rate-limit' : '',
    ].filter(Boolean);
  },
};
