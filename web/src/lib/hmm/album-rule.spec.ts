import { applyAlbumRule, resetAlbumRule, sharedMessage } from '$lib/hmm/album-rule';
import * as hubApi from '$lib/hmm/hub-api';

describe('album rule', () => {
  beforeEach(() => resetAlbumRule());

  it('tells the member which album was just shared', () => {
    expect(sharedMessage([])).toBeUndefined();
    expect(sharedMessage([{ albumId: 'a', albumName: 'Reunion 2026', added: 230 }])).toBe(
      'Your album “Reunion 2026” is now shared with the whole squadron.',
    );
    expect(
      sharedMessage([
        { albumId: 'a', albumName: 'A', added: 1 },
        { albumId: 'b', albumName: 'B', added: 1 },
      ]),
    ).toBe('Your 2 albums are now shared with the whole squadron.');
  });

  it('asks the hub at most once a minute and ignores failures', async () => {
    const publish = vi.spyOn(hubApi, 'publishMyAlbums').mockResolvedValue({
      shared: [{ albumId: 'a', albumName: 'Reunion 2026', added: 5 }],
    });
    const notify = vi.fn();
    await applyAlbumRule(notify, 1_000_000);
    await applyAlbumRule(notify, 1_030_000);
    expect(publish).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledWith('Your album “Reunion 2026” is now shared with the whole squadron.');

    publish.mockRejectedValue(new hubApi.HubError(409, 'email is on'));
    await expect(applyAlbumRule(notify, 1_100_000)).resolves.toBeUndefined();
    expect(publish).toHaveBeenCalledTimes(2);
  });
});
