import { NotificationType, type NotificationDto } from '@immich/sdk';

/**
 * White Knights site rules for the web UI (see also hmm165-hub/src/hmm_hub/album_publish.py):
 *
 * - Albums are for signed-in members only: no shared links, so nothing is reachable anonymously.
 *   Caddy also refuses shared-link access and creation, which covers the phone apps and old links.
 * - Every album is shared with every member, so Immich's "shared album" notices would only be noise.
 */
export const SHARED_LINKS_ALLOWED = false;

const ALBUM_NOTICES = new Set<string>([NotificationType.AlbumInvite, NotificationType.AlbumUpdate]);

export const isAlbumNotice = (notification: Pick<NotificationDto, 'type'>) => ALBUM_NOTICES.has(notification.type);

/**
 * Drop album invitation/update notices from what the bell shows, and delete them in Immich (as the
 * signed-in member) so they don't pile up. The Immich phone apps don't show these notices.
 */
export const withoutAlbumNotices = (
  notifications: NotificationDto[],
  remove: (ids: string[]) => Promise<unknown>,
): NotificationDto[] => {
  const albumIds = notifications.filter((n) => isAlbumNotice(n)).map(({ id }) => id);
  if (albumIds.length > 0) {
    remove(albumIds).catch((error: unknown) => console.debug('[hmm] could not delete album notices', error));
  }
  return notifications.filter((n) => !isAlbumNotice(n));
};
