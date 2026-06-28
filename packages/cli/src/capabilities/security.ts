import type { CapabilityPack } from './types';
import { gapText } from './classify';

export const securityPack: CapabilityPack = {
  key: 'security',
  classify(gap) {
    const text = gapText(gap);
    return /secret|service role|token|api key|auth|authorization|browser-exposed|cors|csrf|session/.test(text);
  },
  riskTags(gap) {
    const text = gapText(gap);
    return [
      text.includes('secret') || text.includes('api key') || text.includes('service role') ? 'secret-boundary' : '',
      text.includes('auth') || text.includes('authorization') ? 'auth-boundary' : '',
      text.includes('browser') ? 'browser-exposure' : '',
    ].filter(Boolean);
  },
};
