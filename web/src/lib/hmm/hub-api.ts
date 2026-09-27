import type { UserAvatarColor } from '@immich/sdk';

/**
 * Client for the White Knights hub (hmm165-hub), served on this same origin under /hub/api.
 * The browser sends Immich's session cookie automatically; the hub checks it with Immich.
 */

export const HUB_API = '/hub/api';

export class HubError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HubError';
  }
}

const detailOf = (body: unknown): string | undefined => {
  if (!body || typeof body !== 'object' || !('detail' in body)) {
    return undefined;
  }
  const { detail } = body as { detail: unknown };
  if (typeof detail === 'string') {
    return detail;
  }
  // FastAPI validation errors: [{ loc: [...], msg: '...' }]
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) => `${String(d.loc?.at(-1) ?? '')}: ${d.msg ?? ''}`.trim())
      .join('; ');
  }
  return undefined;
};

export const hubFetch = async <T>(path: string, init: RequestInit = {}, fetchFn: typeof fetch = fetch): Promise<T> => {
  const response = await fetchFn(HUB_API + path, {
    credentials: 'same-origin',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body && { 'Content-Type': 'application/json' }),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    throw new HubError(response.status, detailOf(body) ?? `The hub answered ${response.status}`);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
};

// Announcements (phase 2)

export type AnnouncementLevel = 'info' | 'warning' | 'urgent';
export type AnnouncementAudience = 'public' | 'members' | 'admins';

export interface Announcement {
  id: number;
  title: string;
  body: string;
  level: AnnouncementLevel;
  audience: AnnouncementAudience;
  dismissible: boolean;
  startsAt: string | null;
  endsAt: string | null;
  updatedAt: string;
}

export interface AdminAnnouncement extends Announcement {
  status: 'scheduled' | 'live' | 'ended';
  createdAt: string;
  createdBy: string;
  updatedBy: string;
}

export type AnnouncementInput = Pick<
  Announcement,
  'title' | 'body' | 'level' | 'audience' | 'dismissible' | 'startsAt' | 'endsAt'
>;

export const getActiveAnnouncements = (fetchFn?: typeof fetch) =>
  hubFetch<Announcement[]>('/announcements/active', {}, fetchFn);

export const getAllAnnouncements = () => hubFetch<AdminAnnouncement[]>('/announcements');

export const createAnnouncement = (input: AnnouncementInput) =>
  hubFetch<AdminAnnouncement>('/announcements', { method: 'POST', body: JSON.stringify(input) });

export const updateAnnouncement = (id: number, input: AnnouncementInput) =>
  hubFetch<AdminAnnouncement>(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(input) });

export const deleteAnnouncement = (id: number) => hubFetch<void>(`/announcements/${id}`, { method: 'DELETE' });

// Chat (phase 3)

export interface ChatMessage {
  id: number;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
}

/** What members see of each other: enough for Immich's <UserAvatar>, never the email address. */
export interface ChatMember {
  id: string;
  name: string;
  avatarColor: UserAvatarColor;
  profileImagePath: string;
  profileChangedAt: string;
}

export interface ChatState {
  messages: ChatMessage[];
  deleted: number[];
  online: ChatMember[];
  muted: boolean;
  now: string;
}

export const getChat = (params: { after?: number; since?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.after !== undefined) {
    query.set('after', String(params.after));
  }
  if (params.since) {
    query.set('since', params.since);
  }
  const qs = query.toString();
  return hubFetch<ChatState>(`/chat${qs ? `?${qs}` : ''}`);
};

export const postChatMessage = (body: string) =>
  hubFetch<ChatMessage>('/chat', { method: 'POST', body: JSON.stringify({ body }) });

export const deleteChatMessage = (id: number) => hubFetch<void>(`/chat/${id}`, { method: 'DELETE' });

export const muteChatMember = (userId: string, name: string, reason = '') =>
  hubFetch<unknown>(`/chat/mutes/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify({ userName: name, reason }),
  });

export interface ChatMute {
  userId: string;
  userName: string;
  mutedAt: string;
  mutedBy: string;
  reason: string;
}

export const getChatMutes = () => hubFetch<ChatMute[]>('/chat/mutes');

export const unmuteChatMember = (userId: string) =>
  hubFetch<void>(`/chat/mutes/${encodeURIComponent(userId)}`, { method: 'DELETE' });

// Message board (phase 4)

export interface BoardPost {
  id: number;
  parentId: number | null;
  /** Immich user id; null for authors from the old website who have no account. */
  userId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  /** Copied from the WordPress message board. */
  imported: boolean;
  /** A comment on a photo, mirrored from Immich: can't be edited; removing it removes the comment. */
  photoComment: boolean;
}

export interface BoardPhoto {
  assetId: string;
  albumId: string;
  albumName: string;
}

export interface BoardThread extends BoardPost {
  replies: BoardPost[];
  /** Set when the thread holds a photo's comments; the thread's own post then has no author/text. */
  photo: BoardPhoto | null;
}

export interface BoardPage {
  threads: BoardThread[];
  total: number;
}

export const getBoard = (offset = 0, limit = 20) => hubFetch<BoardPage>(`/board?offset=${offset}&limit=${limit}`);

export const createBoardPost = (body: string, parentId?: number) =>
  hubFetch<BoardPost>('/board', { method: 'POST', body: JSON.stringify({ body, parentId: parentId ?? null }) });

export const editBoardPost = (id: number, body: string) =>
  hubFetch<BoardPost>(`/board/${id}`, { method: 'PATCH', body: JSON.stringify({ body }) });

export const deleteBoardPost = (id: number) => hubFetch<void>(`/board/${id}`, { method: 'DELETE' });

// Site rule: every album is shared with every member

export interface PublishedAlbum {
  albumId: string;
  albumName: string;
  added: number;
}

export const publishMyAlbums = () =>
  hubFetch<{ shared: PublishedAlbum[]; skipped?: string }>('/albums/publish', { method: 'POST' });
