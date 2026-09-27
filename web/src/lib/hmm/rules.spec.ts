import { NotificationLevel, NotificationType, type NotificationDto } from '@immich/sdk';
import { isAlbumNotice, withoutAlbumNotices } from '$lib/hmm/rules';

const notice = (id: string, type: NotificationType): NotificationDto => ({
  id,
  type,
  level: NotificationLevel.Info,
  title: id,
  createdAt: '2026-09-27T10:00:00Z',
});

describe('album notices', () => {
  it('recognises album invitations and updates only', () => {
    expect(isAlbumNotice({ type: NotificationType.AlbumInvite })).toBe(true);
    expect(isAlbumNotice({ type: NotificationType.AlbumUpdate })).toBe(true);
    expect(isAlbumNotice({ type: NotificationType.BackupFailed })).toBe(false);
    expect(isAlbumNotice({ type: NotificationType.SystemMessage })).toBe(false);
  });

  it('hides album notices and deletes them in Immich', () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    const kept = withoutAlbumNotices(
      [
        notice('invite', NotificationType.AlbumInvite),
        notice('system', NotificationType.SystemMessage),
        notice('update', NotificationType.AlbumUpdate),
      ],
      remove,
    );
    expect(kept.map((n) => n.id)).toEqual(['system']);
    expect(remove).toHaveBeenCalledWith(['invite', 'update']);
  });

  it('does not call Immich when there is nothing to delete, and survives failures', async () => {
    const remove = vi.fn().mockRejectedValue(new Error('offline'));
    expect(withoutAlbumNotices([notice('system', NotificationType.SystemMessage)], remove)).toHaveLength(1);
    expect(remove).not.toHaveBeenCalled();
    expect(withoutAlbumNotices([notice('invite', NotificationType.AlbumInvite)], remove)).toEqual([]);
    await Promise.resolve();
  });
});
