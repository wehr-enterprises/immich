import type { Announcement } from '$lib/hmm/hub-api';

/**
 * Banners a member has closed, remembered in this browser. The key includes updatedAt, so a
 * banner the admins edit shows up again.
 */
const STORAGE_KEY = 'hmm-dismissed-announcements';
const MAX_KEYS = 200;

export const dismissKey = (announcement: Pick<Announcement, 'id' | 'updatedAt'>) =>
  `${announcement.id}@${announcement.updatedAt}`;

export const loadDismissed = (storage: Storage | undefined = localStorage): Set<string> => {
  try {
    const value: unknown = JSON.parse(storage?.getItem(STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((key): key is string => typeof key === 'string') : []);
  } catch {
    return new Set();
  }
};

export const saveDismissed = (keys: Set<string>, storage: Storage | undefined = localStorage) => {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify([...keys].slice(-MAX_KEYS)));
  } catch {
    // private browsing or storage full: the banner just comes back next time
  }
};
