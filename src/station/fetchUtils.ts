/**
 * True when the failure is a low-level network/transport error (no HTTP response),
 * e.g. ECONNREFUSED to localhost, DNS failure, or offline.
 */
export function isNetworkFetchFailure(error: unknown): boolean {
  if (error == null) {
    return false;
  }

  if (error instanceof TypeError) {
    const m = error.message;
    if (m === 'fetch failed' || m.toLowerCase().includes('fetch failed') || m.includes('Failed to fetch')) {
      return true;
    }
  }

  if (error instanceof AggregateError) {
    return error.errors.some((e) => isNetworkFetchFailure(e));
  }

  if (error instanceof Error && 'cause' in error && (error as Error & { cause?: unknown }).cause != null) {
    return isNetworkFetchFailure((error as Error & { cause?: unknown }).cause);
  }

  const e = error as NodeJS.ErrnoException;
  if (typeof e.code === 'string') {
    if (
      ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ENETUNREACH', 'EHOSTUNREACH'].includes(
        e.code
      )
    ) {
      return true;
    }
  }

  return false;
}
