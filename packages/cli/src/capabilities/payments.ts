import type { CapabilityPack } from './types';
import { gapText } from './classify';

export const paymentsPack: CapabilityPack = {
  key: 'payments',
  classify(gap) {
    const text = gapText(gap);
    return /payment|stripe|checkout|billing|entitlement|subscription|refund|cancel/.test(text);
  },
  riskTags(gap) {
    const text = gapText(gap);
    return [
      text.includes('entitlement') ? 'entitlement-source' : '',
      text.includes('checkout') ? 'checkout-flow' : '',
      text.includes('refund') || text.includes('cancel') ? 'lifecycle-state' : '',
    ].filter(Boolean);
  },
};
