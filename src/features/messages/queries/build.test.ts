import { buildMessageSearchQuery } from './build';

describe('buildMessageSearchQuery default feed', () => {
  it('restricts the no-filter feed to the provided domain ids', () => {
    const { query } = buildMessageSearchQuery(
      '', // no search input
      null, // no origin filter
      null, // no destination filter
      null, // no start time
      null, // no end time
      100,
      true,
      [1198486095, 1399811151], // feed domain ids (gorbagana testnet chains)
    );
    expect(query).toContain('origin_domain_id: {_in: [1198486095,1399811151]}');
    expect(query).toContain('destination_domain_id: {_in: [1198486095,1399811151]}');
  });
});
