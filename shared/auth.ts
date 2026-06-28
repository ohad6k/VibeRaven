export type DeviceStartResponse = {
  deviceCode: string;
  verificationUrl: string;
  pollIntervalSeconds: number;
  expiresAt: string;
};

export type DevicePollResponse =
  | { status: 'pending' }
  | {
      status: 'approved';
      accessToken: string;
      account: {
        email: string;
        plan: 'free' | 'pro';
        trialEndsAt: string | null;
      };
    };
