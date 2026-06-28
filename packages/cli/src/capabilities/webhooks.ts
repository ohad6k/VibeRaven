import type { CapabilityPack } from './types';
import { gapText } from './classify';

export const webhooksPack: CapabilityPack = {
  key: 'webhooks',
  classify(gap) {
    const text = gapText(gap);
    return /webhook|signature|idempotency|retry|replay|dead-letter/.test(text);
  },
  riskTags(gap) {
    const text = gapText(gap);
    return [
      text.includes('signature') ? 'signature' : '',
      text.includes('idempotency') ? 'idempotency' : '',
      text.includes('retry') || text.includes('dead-letter') ? 'retry-semantics' : '',
    ].filter(Boolean);
  },
};
