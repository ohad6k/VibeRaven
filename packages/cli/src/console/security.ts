import { randomBytes, timingSafeEqual } from 'node:crypto';

export function createConsoleSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function isAllowedConsoleOrigin(origin: string | undefined, port: number): boolean {
  if (!origin) return true;
  return origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`;
}

export function requireConsoleToken(authorizationHeader: string | undefined, expectedToken: string): boolean {
  const prefix = 'Bearer ';
  if (!authorizationHeader?.startsWith(prefix)) return false;
  const received = Buffer.from(authorizationHeader.slice(prefix.length));
  const expected = Buffer.from(expectedToken);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
