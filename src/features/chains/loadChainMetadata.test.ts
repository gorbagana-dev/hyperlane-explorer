import type { IRegistry } from '@hyperlane-xyz/registry';
import { chainMetadata as registryChainMetadata } from '@hyperlane-xyz/registry';

const loadInjectedMock = jest.fn();

jest.mock('./injectedChainMetadata', () => ({
  loadInjectedChainMetadata: (...args: unknown[]) => loadInjectedMock(...args),
}));

import { loadChainMetadata } from './loadChainMetadata';

function mockRegistry(metadata: Record<string, unknown>): IRegistry {
  return { getMetadata: async () => metadata } as unknown as IRegistry;
}

beforeEach(() => {
  loadInjectedMock.mockReset();
});

describe('loadChainMetadata', () => {
  const { solanadevnet, ethereum } = registryChainMetadata;

  it('drops a registry chain that collides on domainId with an injected chain', async () => {
    // The injected 'solana' reuses solanadevnet's domainId (1399811151) under a
    // different name — the SDK resolver would reject the same-domainId/different-name pair.
    loadInjectedMock.mockResolvedValue({ solana: { ...solanadevnet, name: 'solana' } });

    const result = await loadChainMetadata(mockRegistry({ solanadevnet, ethereum }), {});

    expect(result.solana).toBeDefined();
    expect(result.solana?.domainId).toBe(1399811151);
    expect(result.solanadevnet).toBeUndefined();
    expect(result.ethereum).toBeDefined();

    // No two surviving chains share a domainId (what the SDK resolver asserts).
    const domainIds = Object.values(result).map((c) => c.domainId);
    expect(new Set(domainIds).size).toBe(domainIds.length);
  });

  it('keeps registry chains when there is no injected collision', async () => {
    loadInjectedMock.mockResolvedValue({});

    const result = await loadChainMetadata(mockRegistry({ solanadevnet, ethereum }), {});

    expect(result.solanadevnet).toBeDefined();
    expect(result.ethereum).toBeDefined();
  });
});
