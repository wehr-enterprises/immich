import { publishMyAlbums, type PublishedAlbum } from '$lib/hmm/hub-api';

/**
 * Site rule: every album is shared with every member (signed-in accounts only; never public
 * links). Only an album's owner may share it, so the web UI asks the hub, which uses the member's
 * own login, e.g. right after they created an album. The hub itself limits this to once a minute.
 */
const MIN_INTERVAL_MS = 60_000;
let lastCheck = 0;

export const sharedMessage = (albums: PublishedAlbum[]): string | undefined => {
  if (albums.length === 0) {
    return undefined;
  }
  return albums.length === 1
    ? `Your album “${albums[0].albumName}” is now shared with the whole squadron.`
    : `Your ${albums.length} albums are now shared with the whole squadron.`;
};

export const applyAlbumRule = async (notify: (message: string) => void, now = Date.now()) => {
  if (now - lastCheck < MIN_INTERVAL_MS) {
    return;
  }
  lastCheck = now;
  try {
    const { shared } = await publishMyAlbums();
    const message = sharedMessage(shared);
    if (message) {
      notify(message);
    }
  } catch (error) {
    // No hub, or Immich email is on (nothing is shared then): try again later.
    console.debug('[hmm] album sharing rule not applied', error);
  }
};

/** For tests. */
export const resetAlbumRule = () => {
  lastCheck = 0;
};
