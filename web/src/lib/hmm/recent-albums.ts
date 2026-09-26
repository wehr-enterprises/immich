import type { AlbumResponseDto } from '@immich/sdk';

const time = (value: string | undefined) => (value ? new Date(value).getTime() : 0);

/** Albums that most recently got new photos first (falling back to when the album itself changed). */
export const mostRecentlyAdded = (albums: AlbumResponseDto[], limit: number) =>
  albums
    .filter((album) => album.assetCount > 0)
    .sort(
      (a, b) =>
        time(b.lastModifiedAssetTimestamp ?? b.updatedAt) - time(a.lastModifiedAssetTimestamp ?? a.updatedAt) ||
        a.albumName.localeCompare(b.albumName),
    )
    .slice(0, limit);
