import type { ChatMessage } from '$lib/hmm/hub-api';

export const KEEP_MESSAGES = 200;

/** Add newly polled messages (skipping ones we already have), drop deleted ones, keep the newest. */
export const mergeMessages = (
  current: ChatMessage[],
  incoming: ChatMessage[],
  deleted: number[] = [],
  keep = KEEP_MESSAGES,
): ChatMessage[] => {
  const gone = new Set(deleted);
  const byId = new Map<number, ChatMessage>();
  for (const message of [...current, ...incoming]) {
    if (!gone.has(message.id)) {
      byId.set(message.id, message);
    }
  }
  return [...byId.values()].sort((a, b) => a.id - b.id).slice(-keep);
};

/** Messages from other people that arrived after the last one this member saw. */
export const countUnread = (messages: ChatMessage[], lastReadId: number, myId: string | undefined) =>
  messages.filter((message) => message.id > lastReadId && message.userId !== myId).length;

/** "14:05" today, "Mon 14:05" this week, "Sep 3, 14:05" before that. */
export const formatChatTime = (iso: string, now = new Date()): string => {
  const date = new Date(iso);
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) {
    return time;
  }
  const days = (now.getTime() - date.getTime()) / 86_400_000;
  if (days < 6) {
    return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${time}`;
  }
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`;
};
