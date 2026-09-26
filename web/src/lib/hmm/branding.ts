import { logoManager, type LogoSet } from '@immich/ui';
import crest from '$lib/hmm/assets/crest.png';
import wordmarkDark from '$lib/hmm/assets/wordmark-dark.png';
import wordmarkLight from '$lib/hmm/assets/wordmark-light.png';

export const SITE_NAME = 'White Knights';
export const SQUADRON = 'HMM-165';
export const WORDPRESS_SITE = 'https://www.165whiteknights.com';
/** Immich is AGPL-3.0: members must be able to get the source of the modified web UI they use. */
export const SOURCE_URL = 'https://github.com/wehr-enterprises/immich/tree/hmm165';

/** Pages added by the White Knights fork. The hub's API is under /hub/api (a separate service). */
export const HmmRoute = {
  home: () => '/hub/home',
  adminAnnouncements: () => '/hub/admin/announcements',
};

export const hmmLogos: LogoSet = {
  stacked: { light: wordmarkLight, dark: wordmarkDark },
  unstacked: { light: wordmarkLight, dark: wordmarkDark },
  stacked_futo: { light: wordmarkLight, dark: wordmarkDark },
  icon: crest,
};

/** Swap Immich's logos for the squadron's everywhere @immich/ui's <Logo> is used. */
export const installBranding = () => {
  logoManager.setLogo(hmmLogos);
};

export const pageTitle = (title: string | undefined) => `${title || SQUADRON} - ${SITE_NAME}`;

export { default as hmmCrest } from '$lib/hmm/assets/crest.png';
