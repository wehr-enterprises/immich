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
