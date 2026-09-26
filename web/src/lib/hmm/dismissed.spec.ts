import { dismissKey, loadDismissed, saveDismissed } from '$lib/hmm/dismissed';

describe('dismissed announcements', () => {
  beforeEach(() => localStorage.clear());

  it('remembers dismissals per version of a banner', () => {
    const v1 = { id: 7, updatedAt: '2026-09-26T10:00:00Z' };
    const v2 = { id: 7, updatedAt: '2026-09-26T11:00:00Z' };
    saveDismissed(new Set([dismissKey(v1)]));

    const loaded = loadDismissed();
    expect(loaded.has(dismissKey(v1))).toBe(true);
    expect(loaded.has(dismissKey(v2))).toBe(false); // edited by an admin: shows again
  });

  it('ignores corrupt storage', () => {
    localStorage.setItem('hmm-dismissed-announcements', '{nope');
    expect(loadDismissed().size).toBe(0);
    localStorage.setItem('hmm-dismissed-announcements', '{"a":1}');
    expect(loadDismissed().size).toBe(0);
  });

  it('keeps only the most recent keys', () => {
    saveDismissed(new Set(Array.from({ length: 250 }, (_, i) => `${i}@x`)));
    const loaded = loadDismissed();
    expect(loaded.size).toBe(200);
    expect(loaded.has('249@x')).toBe(true);
    expect(loaded.has('0@x')).toBe(false);
  });
});
