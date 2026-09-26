import { redirect } from '@sveltejs/kit';
import { HmmRoute } from '$lib/hmm/branding';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { Route } from '$lib/route';
import { getFormatter } from '$lib/utils/i18n';
import { init } from '$lib/utils/server';
import type { PageLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch }) => {
  try {
    await init(fetch);

    if (serverConfigManager.value.maintenanceMode) {
      redirect(307, Route.maintenanceMode());
    }

    await authManager.load();
    if (authManager.authenticated) {
      // HMM-165: members start on the White Knights home page
      redirect(307, HmmRoute.home());
    }

    if (serverConfigManager.value.isInitialized) {
      // HMM-165: visitors get the White Knights welcome page (it links to the login page)
      return { landing: true, meta: { title: 'Welcome', description: 'HMM-165 White Knights squadron photos' } };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (redirectError: any) {
    if (redirectError?.status === 307) {
      throw redirectError;
    }
  }

  const $t = await getFormatter();

  return {
    landing: false,
    meta: {
      title: $t('welcome') + ' 🎉',
      description: $t('immich_web_interface'),
    },
  };
}) satisfies PageLoad;
