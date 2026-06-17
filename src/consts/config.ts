const isDevMode = process.env.NODE_ENV === 'development';
const version = process.env.NEXT_PUBLIC_VERSION ?? null;
const registryUrl = process.env.NEXT_PUBLIC_REGISTRY_URL || undefined;
const registryBranch = process.env.NEXT_PUBLIC_REGISTRY_BRANCH || 'main';
const explorerApiKeys = JSON.parse(process.env.EXPLORER_API_KEYS || '{}');

// GraphQL endpoint resolution:
// - Browser: a same-origin proxy route (/api/graphql) so Hasura and its admin
//   secret stay off the public internet (no second host, no CORS).
// - Server (SSR / API route / getServerSideProps): the in-cluster Hasura URL
//   from HASURA_GRAPHQL_URL. Not NEXT_PUBLIC, so it is never shipped to the browser.
const serverApiUrl = process.env.HASURA_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';
const browserApiUrl = '/api/graphql';

interface Config {
  debug: boolean;
  version: string | null;
  apiUrl: string;
  serverApiUrl: string;
  explorerApiKeys: Record<string, string>;
  githubProxy?: string;
  registryUrl: string | undefined; // Optional URL to use a custom registry instead of the published canonical version
  registryBranch?: string | undefined; // Optional customization of the registry branch instead of main
}

export const config: Config = Object.freeze({
  debug: isDevMode,
  version,
  // `typeof window` is statically known per bundle: the server bundle resolves to
  // the in-cluster URL, the browser bundle to the relative proxy path.
  apiUrl: typeof window === 'undefined' ? serverApiUrl : browserApiUrl,
  serverApiUrl,
  explorerApiKeys,
  githubProxy: 'https://proxy.hyperlane.xyz',
  registryBranch,
  registryUrl,
});

// Based on https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/main/typescript/infra/config/environments/mainnet3/agent.ts
// Based on https://github.com/hyperlane-xyz/hyperlane-monorepo/blob/main/typescript/infra/config/environments/testnet4/agent.ts
export const unscrapedChainsInDb = ['proteustestnet'];

export const debugIgnoredChains = ['treasure', 'treasuretopaz'];
