import type { ChainMetadata } from '@hyperlane-xyz/sdk/metadata/chainMetadataTypes';
import type { ChainMap } from '@hyperlane-xyz/sdk/types';

import { logger } from '../../utils/logger';

// Path (served from /public) of the runtime-rendered gorbagana chain metadata.
// The container entrypoint writes this from deploy env, so one image serves any
// environment. Absent in upstream/dev — then we return {} and rely on the registry.
const INJECTED_METADATA_PATH = '/gorbagana-chains.json';

let cache: ChainMap<Partial<ChainMetadata>> | null = null;

export async function loadInjectedChainMetadata(): Promise<ChainMap<Partial<ChainMetadata>>> {
  if (cache) return cache;
  // Only fetched in the browser; SSR is data-disabled and has no origin to resolve.
  if (typeof window === 'undefined') return {};
  try {
    const res = await fetch(INJECTED_METADATA_PATH);
    if (!res.ok) return {};
    cache = (await res.json()) as ChainMap<Partial<ChainMetadata>>;
    return cache;
  } catch (error) {
    logger.debug('No injected chain metadata found', error);
    return {};
  }
}
