import type { WarpRouteConfigs } from '@hyperlane-xyz/sdk/warp/read';

import { mergeInjectedWarpRoutes } from './injectedWarpRoutes';

const route = (id: string): WarpRouteConfigs[string] =>
  ({ tokens: [{ chainName: id }], options: {} }) as unknown as WarpRouteConfigs[string];

describe('mergeInjectedWarpRoutes', () => {
  it('adds injected routes alongside registry routes', () => {
    const registry: WarpRouteConfigs = { 'USDT/eni': route('eni') };
    const injected: WarpRouteConfigs = { 'USDC/gorchain-solana': route('gorchain') };

    const result = mergeInjectedWarpRoutes(registry, injected);

    expect(Object.keys(result).sort()).toEqual(['USDC/gorchain-solana', 'USDT/eni']);
  });

  it('lets injected routes win over registry routes sharing an id', () => {
    const registry: WarpRouteConfigs = { shared: route('registry') };
    const injected: WarpRouteConfigs = { shared: route('injected') };

    const result = mergeInjectedWarpRoutes(registry, injected);

    expect(result.shared.tokens[0].chainName).toBe('injected');
  });

  it('returns the registry routes unchanged when nothing is injected', () => {
    const registry: WarpRouteConfigs = { 'USDT/eni': route('eni') };

    const result = mergeInjectedWarpRoutes(registry, {});

    expect(result).toEqual(registry);
  });
});
