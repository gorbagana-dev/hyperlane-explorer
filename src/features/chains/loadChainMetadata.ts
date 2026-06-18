import type { IRegistry } from '@hyperlane-xyz/registry';
import {
  ChainMetadataSchema,
  mergeChainMetadataMap,
  type ChainMetadata,
} from '@hyperlane-xyz/sdk/metadata/chainMetadataTypes';
import type { ChainMap } from '@hyperlane-xyz/sdk/types';
import { objFilter, objMap, promiseObjAll } from '@hyperlane-xyz/utils';

import { links } from '../../consts/links';
import { logger } from '../../utils/logger';
import { loadInjectedChainMetadata } from './injectedChainMetadata';

export async function loadChainMetadata(
  registry: IRegistry,
  overrideChainMetadata: ChainMap<Partial<ChainMetadata> | undefined>,
) {
  for (const chainName of Object.keys(overrideChainMetadata)) {
    if (chainName !== chainName.toLowerCase()) {
      throw new Error(`Override chain names must be lowercase: ${chainName}`);
    }
  }

  logger.debug('Loading chain metadata from registry');

  const registryChainMetadata = await registry.getMetadata();
  const metadataWithLogos = await promiseObjAll(
    objMap(
      registryChainMetadata,
      async (chainName, metadata): Promise<ChainMetadata> => ({
        ...metadata,
        logoURI: `${links.imgPath}/chains/${chainName}/logo.svg`,
      }),
    ),
  );

  // Self-hosted gorbagana chains (gorchain + solana) shipped in /public so the
  // UI resolves them without the public Hyperlane registry. User overrides
  // (added via the UI) still win over these.
  const injectedMetadata = await loadInjectedChainMetadata();

  // A self-hosted chain can reuse a public domainId under a different name (e.g.
  // injected 'solana' and registry 'solanadevnet' both at domainId 1399811151).
  // The SDK chain-metadata resolver rejects two chains sharing a domainId but not
  // a name, so drop the colliding registry entries — the injected chain is
  // authoritative for its domainId.
  const injectedDomainIds = new Set(
    Object.values(injectedMetadata)
      .map((metadata) => metadata.domainId)
      .filter((domainId): domainId is number => domainId != null),
  );
  const dedupedRegistryMetadata = objFilter(
    metadataWithLogos,
    (chainName, metadata): metadata is ChainMetadata =>
      !(injectedDomainIds.has(metadata.domainId) && !(chainName in injectedMetadata)),
  );

  const withInjected = mergeChainMetadataMap(dedupedRegistryMetadata, injectedMetadata);
  const mergedMetadata = mergeChainMetadataMap(withInjected, overrideChainMetadata);

  return objFilter(
    objMap(mergedMetadata, (chain, metadata) => {
      const parsedMetadata = ChainMetadataSchema.safeParse(metadata);
      if (parsedMetadata.success) return parsedMetadata.data;

      const fallbackMetadata = metadataWithLogos[chain];
      const parsedFallbackMetadata = ChainMetadataSchema.safeParse(fallbackMetadata);
      logger.error(
        `Failed to parse metadata for ${chain}, ${
          parsedFallbackMetadata.success ? 'falling back to registry metadata' : 'skipping'
        }`,
      );
      return parsedFallbackMetadata.success ? parsedFallbackMetadata.data : undefined;
    }),
    (_chain, metadata): metadata is ChainMetadata => Boolean(metadata),
  );
}
