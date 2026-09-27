import {
  deleteNotifications,
  getNotifications,
  updateNotification,
  updateNotifications,
  type NotificationDto,
} from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { withoutAlbumNotices } from '$lib/hmm/rules';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { handleError } from '$lib/utils/handle-error';

class NotificationStore {
  notifications = $state<NotificationDto[]>([]);

  constructor() {
    eventManager.on({
      AuthLogin: () => this.refresh(),
      AuthLogout: () => this.clear(),
    });
  }

  async refresh() {
    try {
      // HMM-165: no album invitation/update notices (every album is shared with everyone)
      this.notifications = withoutAlbumNotices(await getNotifications({ unread: true }), (ids) =>
        deleteNotifications({ notificationDeleteAllDto: { ids } }),
      );
    } catch (error) {
      const translate = get(t);
      handleError(error, translate('errors.failed_to_load_notifications'));
    }
  }

  markAsRead = async (id: string) => {
    this.notifications = this.notifications.filter((notification) => notification.id !== id);
    await updateNotification({ id, notificationUpdateDto: { readAt: new Date().toISOString() } });
  };

  markAllAsRead = async () => {
    const ids = this.notifications.map(({ id }) => id);
    this.notifications = [];
    await updateNotifications({ notificationUpdateAllDto: { ids, readAt: new Date().toISOString() } });
  };

  clear = () => {
    this.notifications = [];
  };
}

export const notificationManager = new NotificationStore();
