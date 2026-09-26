import { mostRecentlyAdded } from '$lib/hmm/recent-albums';
import { albumFactory } from '@test-data/factories/album-factory';

describe('mostRecentlyAdded', () => {
  it('orders by the newest photo, falling back to the album update time', () => {
    const albums = [
      albumFactory.build({ albumName: 'Photos of 1968', assetCount: 3, updatedAt: '2026-01-01T00:00:00.000Z' }),
      albumFactory.build({
        albumName: 'Reunion 2025',
        assetCount: 9,
        updatedAt: '2025-01-01T00:00:00.000Z',
        lastModifiedAssetTimestamp: '2026-09-01T00:00:00.000Z',
      }),
      albumFactory.build({ albumName: 'Photos of 1975', assetCount: 2, updatedAt: '2026-05-01T00:00:00.000Z' }),
    ];

    expect(mostRecentlyAdded(albums, 10).map((album) => album.albumName)).toEqual([
      'Reunion 2025',
      'Photos of 1975',
      'Photos of 1968',
    ]);
  });

  it('skips empty albums and applies the limit', () => {
    const albums = [
      albumFactory.build({ albumName: 'Empty', assetCount: 0, updatedAt: '2026-09-01T00:00:00.000Z' }),
      ...albumFactory.buildList(5, { assetCount: 1 }),
    ];

    const result = mostRecentlyAdded(albums, 3);
    expect(result).toHaveLength(3);
    expect(result.map((album) => album.albumName)).not.toContain('Empty');
  });
});
