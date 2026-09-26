<script lang="ts">
  import { page } from '$app/state';
  import { announcementsManager } from '$lib/hmm/announcements-manager.svelte';
  import { HmmRoute } from '$lib/hmm/branding';
  import { dismissKey, loadDismissed, saveDismissed } from '$lib/hmm/dismissed';
  import HmmBanner from '$lib/hmm/HmmBanner.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { Icon } from '@immich/ui';
  import { mdiBullhornOutline, mdiChevronUp } from '@mdi/js';
  import { onMount } from 'svelte';

  const REFRESH_MS = 5 * 60 * 1000;
  const MINIMIZED_KEY = 'hmm-minimized-announcements';

  let dismissed = $state(loadDismissed());
  let minimized = $state(new Set<string>());

  const visible = $derived(announcementsManager.items.filter((a) => !dismissed.has(dismissKey(a))));
  // Minimizing hides the banners on screen now; a new or edited banner opens the strip again.
  const isMinimized = $derived(visible.length > 0 && visible.every((a) => minimized.has(dismissKey(a))));
  const hidden = $derived(
    assetViewerManager.isViewing ||
      page.url.pathname.startsWith('/maintenance') ||
      page.url.pathname.startsWith('/auth/onboarding') ||
      // the admin page lists every banner itself
      page.url.pathname.startsWith(HmmRoute.adminAnnouncements()),
  );

  const dismiss = (key: string) => {
    dismissed = new Set([...dismissed, key]);
    saveDismissed(dismissed);
  };

  const setMinimized = (value: boolean) => {
    minimized = new Set(value ? visible.map((a) => dismissKey(a)) : []);
    try {
      sessionStorage.setItem(MINIMIZED_KEY, JSON.stringify([...minimized]));
    } catch {
      // storage unavailable: minimizing lasts until the page is reloaded
    }
  };

  // Who is signed in decides which banners apply (public / members / admins).
  $effect(() => {
    void authManager.authenticated;
    void announcementsManager.refresh();
  });

  onMount(() => {
    try {
      minimized = new Set(JSON.parse(sessionStorage.getItem(MINIMIZED_KEY) ?? '[]') as string[]);
    } catch {
      minimized = new Set();
    }

    const timer = setInterval(() => void announcementsManager.refresh(), REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void announcementsManager.refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  });
</script>

{#if visible.length > 0 && !hidden}
  <section
    aria-label="Announcements"
    class="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-2 {authManager.authenticated
      ? 'top-[calc(var(--navbar-height)+0.5rem)] max-md:top-[calc(var(--navbar-height-md)+0.5rem)]'
      : 'top-3'}"
  >
    {#if isMinimized}
      <button
        type="button"
        class="pointer-events-auto flex items-center gap-2 rounded-full border bg-light px-4 py-1.5 text-sm font-medium shadow-lg hover:bg-subtle"
        onclick={() => setMinimized(false)}
      >
        <Icon icon={mdiBullhornOutline} size="1.1rem" class="text-primary" />
        {visible.length === 1 ? '1 announcement' : `${visible.length} announcements`}
      </button>
    {:else}
      <div class="pointer-events-auto flex w-full max-w-3xl flex-col items-stretch gap-2">
        {#each visible as announcement (dismissKey(announcement))}
          <HmmBanner {announcement} onDismiss={() => dismiss(dismissKey(announcement))} />
        {/each}
        <button
          type="button"
          class="mx-auto -mt-1 flex items-center gap-1 rounded-full bg-light/90 px-3 py-0.5 text-xs font-medium text-muted shadow-sm hover:text-dark"
          onclick={() => setMinimized(true)}
        >
          <Icon icon={mdiChevronUp} size="1rem" />
          Minimize
        </button>
      </div>
    {/if}
  </section>
{/if}
