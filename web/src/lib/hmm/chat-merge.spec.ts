import { countUnread, formatChatTime, mergeMessages } from '$lib/hmm/chat-merge';
import type { ChatMessage } from '$lib/hmm/hub-api';

const msg = (id: number, userId = 'u-other'): ChatMessage => ({
  id,
  userId,
  userName: userId,
  body: `message ${id}`,
  createdAt: '2026-09-26T12:00:00Z',
});

describe('mergeMessages', () => {
  it('appends new messages in order without duplicates', () => {
    const merged = mergeMessages([msg(1), msg(2)], [msg(2), msg(4), msg(3)]);
    expect(merged.map((m) => m.id)).toEqual([1, 2, 3, 4]);
  });

  it('drops messages an admin deleted', () => {
    expect(mergeMessages([msg(1), msg(2), msg(3)], [msg(4)], [2, 4]).map((m) => m.id)).toEqual([1, 3]);
  });

  it('keeps only the newest messages', () => {
    const many = Array.from({ length: 10 }, (_, i) => msg(i + 1));
    expect(mergeMessages(many, [msg(11)], [], 3).map((m) => m.id)).toEqual([9, 10, 11]);
  });
});

describe('countUnread', () => {
  it("counts other people's messages after the last one read", () => {
    const messages = [msg(1), msg(2, 'u-me'), msg(3), msg(4)];
    expect(countUnread(messages, 1, 'u-me')).toBe(2);
    expect(countUnread(messages, 4, 'u-me')).toBe(0);
    expect(countUnread(messages, 0, undefined)).toBe(4);
  });
});

describe('formatChatTime', () => {
  const now = new Date('2026-09-26T15:00:00');

  it('shows only the time for today', () => {
    expect(formatChatTime(new Date('2026-09-26T09:05:00').toISOString(), now)).not.toMatch(/Sep|Sat|Fri/);
  });

  it('adds the weekday this week and the date before that', () => {
    expect(formatChatTime(new Date('2026-09-24T09:05:00').toISOString(), now)).toMatch(/^\S+ /);
    expect(formatChatTime(new Date('2026-08-01T09:05:00').toISOString(), now)).toContain(',');
  });
});
