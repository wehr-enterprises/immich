import { getActiveAnnouncements, type Announcement } from '$lib/hmm/hub-api';

/** The banners currently active for this viewer. Refreshed by <HmmBanners> and after admin edits. */
class AnnouncementsManager {
  items = $state<Announcement[]>([]);
  #pending: Promise<void> | undefined;

  refresh(): Promise<void> {
    this.#pending ??= getActiveAnnouncements()
      .then((items) => {
        this.items = items;
      })
      .catch((error: unknown) => {
        // No hub (e.g. stock deployment) or a hiccup: keep showing what we had.
        console.debug('[hmm] announcements unavailable', error);
      })
      .finally(() => {
        this.#pending = undefined;
      });
    return this.#pending;
  }
}

export const announcementsManager = new AnnouncementsManager();
