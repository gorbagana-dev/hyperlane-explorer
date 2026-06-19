import type { WarpRouteConfigs } from '@hyperlane-xyz/sdk/warp/read';

import { logger } from '../../utils/logger';

// The warp-route sibling of injectedChainMetadata: a runtime-rendered file (served
// from /public) carrying the self-hosted gorbagana warp routes. The container
// entrypoint writes it from the deployer's warpRoutes.yaml so one image serves any
// environment. Without it the explorer only knows registry routes, so it can't
// resolve warp transfers on our chains (blank "Warped Token" column + no warp
// transfer/security/overview cards). Absent in upstream/dev — then we return {}
// and rely solely on the registry.
const INJECTED_WARP_ROUTES_PATH = '/gorbagana-warp-routes.json';

let cache: WarpRouteConfigs | null = null;

export async function loadInjectedWarpRoutes(): Promise<WarpRouteConfigs> {
  if (cache) return cache;
  // Only fetched in the browser; SSR is data-disabled and has no origin to resolve.
  if (typeof window === 'undefined') return {};
  try {
    const res = await fetch(INJECTED_WARP_ROUTES_PATH);
    if (!res.ok) return {};
    cache = (await res.json()) as WarpRouteConfigs;
    return cache;
  } catch (error) {
    logger.debug('No injected warp routes found', error);
    return {};
  }
}

// Self-hosted routes are authoritative for their own warp route ids, so injected
// configs win over registry configs on collision.
export function mergeInjectedWarpRoutes(
  registryConfigs: WarpRouteConfigs,
  injectedConfigs: WarpRouteConfigs,
): WarpRouteConfigs {
  return { ...registryConfigs, ...injectedConfigs };
}
