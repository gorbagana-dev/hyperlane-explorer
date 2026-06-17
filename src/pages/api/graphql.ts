import type { NextApiRequest, NextApiResponse } from 'next';

import { config } from '../../consts/config';
import { logger } from '../../utils/logger';

// Same-origin GraphQL proxy. The browser posts here; we forward to the
// in-cluster Hasura (config.serverApiUrl). Keeps Hasura and its admin secret
// off the public internet — only this read-only proxy is reachable.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ errors: [{ message: 'Method not allowed' }] });
  }

  try {
    const upstream = await fetch(config.serverApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.send(body);
  } catch (error) {
    logger.error('GraphQL proxy request failed', error);
    return res.status(502).json({ errors: [{ message: 'Upstream GraphQL request failed' }] });
  }
}
