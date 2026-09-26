import { countUnread, mergeMessages } from '$lib/hmm/chat-merge';
import {
  deleteChatMessage,
  getChat,
  HubError,
  muteChatMember,
  postChatMessage,
  type ChatMember,
  type ChatMessage,
} from '$lib/hmm/hub-api';
import { authManager } from '$lib/managers/auth-manager.svelte';

const OPEN_POLL_MS = 4000;
const CLOSED_POLL_MS = 30_000;
const ERROR_POLL_MS = 30_000;
const LAST_READ_KEY = 'hmm-chat-last-read';

const readLastRead = () => {
  try {
    return Number(localStorage.getItem(LAST_READ_KEY)) || 0;
  } catch {
    return 0;
  }
};

/**
 * The squadron chat, kept up to date by polling the hub: every few seconds while the panel is
 * open, every 30 s while it is closed (which also keeps this member on the "online" list), and not
 * at all while the browser tab is hidden.
 */
class ChatManager {
  messages = $state<ChatMessage[]>([]);
  online = $state<ChatMember[]>([]);
  muted = $state(false);
  isOpen = $state(false);
  lastReadId = $state(readLastRead());
  available = $state(false);
  unread = $derived(
    countUnread(this.messages, this.lastReadId, authManager.authenticated ? authManager.user.id : undefined),
  );

  #since: string | undefined;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #running = false;
  #inFlight: Promise<void> | undefined;

  start() {
    if (this.#running) {
      return;
    }
    this.#running = true;
    document.addEventListener('visibilitychange', this.#onVisibility);
    void this.poll();
  }

  stop() {
    this.#running = false;
    clearTimeout(this.#timer);
    document.removeEventListener('visibilitychange', this.#onVisibility);
    this.messages = [];
    this.online = [];
    this.muted = false;
    this.isOpen = false;
    this.available = false;
    this.#since = undefined;
  }

  setOpen(open: boolean) {
    this.isOpen = open;
    if (open) {
      this.markRead();
      void this.poll();
    }
  }

  markRead() {
    const last = this.messages.at(-1)?.id ?? 0;
    if (last > this.lastReadId) {
      this.lastReadId = last;
      try {
        localStorage.setItem(LAST_READ_KEY, String(last));
      } catch {
        // storage unavailable: the unread count resets on reload
      }
    }
  }

  poll(): Promise<void> {
    this.#inFlight ??= this.#poll().finally(() => {
      this.#inFlight = undefined;
    });
    return this.#inFlight;
  }

  async send(body: string) {
    const message = await postChatMessage(body);
    this.messages = mergeMessages(this.messages, [message]);
    this.markRead();
  }

  async remove(message: ChatMessage) {
    await deleteChatMessage(message.id);
    this.messages = mergeMessages(this.messages, [], [message.id]);
  }

  async mute(message: ChatMessage) {
    await muteChatMember(message.userId, message.userName);
  }

  #onVisibility = () => {
    if (document.visibilityState === 'visible') {
      void this.poll();
    }
  };

  async #poll() {
    clearTimeout(this.#timer);
    if (!this.#running) {
      return;
    }
    let failed = false;
    try {
      if (document.visibilityState === 'hidden') {
        return; // resumes from the visibilitychange listener
      }
      const after = this.messages.at(-1)?.id;
      const state = await getChat({ after, since: this.#since });
      this.messages = mergeMessages(this.messages, state.messages, state.deleted);
      this.online = state.online;
      this.muted = state.muted;
      this.#since = state.now;
      this.available = true;
      if (this.isOpen) {
        this.markRead();
      }
    } catch (error) {
      if (error instanceof HubError && error.status === 401) {
        this.stop(); // signed out
        return;
      }
      // No hub (stock deployment) or a hiccup: try again later.
      console.debug('[hmm] chat unavailable', error);
      failed = true;
    }
    if (this.#running && document.visibilityState !== 'hidden') {
      // Decided now, not before the request: the panel may have been opened meanwhile.
      const delay = failed ? ERROR_POLL_MS : this.isOpen ? OPEN_POLL_MS : CLOSED_POLL_MS;
      this.#timer = setTimeout(() => void this.poll(), delay);
    }
  }
}

export const chatManager = new ChatManager();
