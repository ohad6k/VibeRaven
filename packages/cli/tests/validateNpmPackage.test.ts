import { describe, expect, it } from 'vitest';
import {
  levenshteinDistance,
  validateNpmPackage,
  validateNpmPackages,
} from '../src/npm/validateNpmPackage';
import { PUBLIC_AGENT_MODE_COMMAND } from '../src/contracts/commands';

const NOW = Date.parse('2026-06-10T00:00:00.000Z');

function mockFetch(response: { status: number; body?: unknown }): typeof fetch {
  return (async () =>
    ({
      status: response.status,
      ok: response.status >= 200 && response.status < 300,
      json: async () => response.body,
    }) as Response) as typeof fetch;
}

describe('levenshteinDistance', () => {
  it('returns zero for identical strings', () => {
    expect(levenshteinDistance('react', 'react')).toBe(0);
  });

  it('returns edit distance for typos', () => {
    expect(levenshteinDistance('react', 'raect')).toBe(2);
  });
});

describe('validateNpmPackage', () => {
  it('returns not_found for npm registry 404', async () => {
    const result = await validateNpmPackage('definitely-missing-package-xyz', {
      fetch: mockFetch({ status: 404 }),
      now: NOW,
    });

    expect(result.verdict).toBe('not_found');
    expect(result.reasons[0]).toContain('not found');
    expect(result.followUpCommand).toBe(PUBLIC_AGENT_MODE_COMMAND);
    expect(result.registryUrl).toBe(
      'https://registry.npmjs.org/definitely-missing-package-xyz'
    );
  });

  it('returns ok for established packages with normal metadata', async () => {
    const result = await validateNpmPackage('lodash', {
      fetch: mockFetch({
        status: 200,
        body: {
          description: 'Lodash modular utilities.',
          maintainers: [{ name: 'jdalton' }],
          time: { created: '2012-04-18T00:00:00.000Z' },
          versions: { '1.0.0': {}, '4.17.21': {} },
        },
      }),
      now: NOW,
    });

    expect(result.verdict).toBe('ok');
    expect(result.reasons[0]).toContain('no v1 suspicious signals');
  });

  it('flags suspicious typosquats of popular packages published recently', async () => {
    const result = await validateNpmPackage('raect', {
      fetch: mockFetch({
        status: 200,
        body: {
          description: 'React utilities',
          maintainers: [{ name: 'someone' }],
          time: { created: '2026-06-01T00:00:00.000Z' },
          versions: { '1.0.0': {} },
        },
      }),
      now: NOW,
    });

    expect(result.verdict).toBe('suspicious');
    expect(result.reasons.join(' ')).toContain('popular package "react"');
  });

  it('flags suspicious packages with empty metadata and low publish count', async () => {
    const result = await validateNpmPackage('empty-meta-pkg', {
      fetch: mockFetch({
        status: 200,
        body: {
          description: '',
          maintainers: [],
          time: { created: '2020-01-01T00:00:00.000Z' },
          versions: { '1.0.0': {} },
        },
      }),
      now: NOW,
    });

    expect(result.verdict).toBe('suspicious');
    expect(result.reasons.join(' ')).toContain('empty description');
  });

  it('validates multiple packages without network', async () => {
    const fetchFn = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/good-pkg')) {
        return {
          status: 200,
          ok: true,
          json: async () => ({
            description: 'Good package',
            maintainers: [{ name: 'owner' }],
            time: { created: '2015-01-01T00:00:00.000Z' },
            versions: { '1.0.0': {}, '2.0.0': {} },
          }),
        } as Response;
      }
      return { status: 404, ok: false, json: async () => ({}) } as Response;
    }) as typeof fetch;

    const results = await validateNpmPackages(['good-pkg', 'missing-pkg'], {
      fetch: fetchFn,
      now: NOW,
    });

    expect(results.map((result) => result.verdict)).toEqual(['ok', 'not_found']);
  });
});
