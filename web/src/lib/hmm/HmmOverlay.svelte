<script lang="ts">
  import { page } from '$app/state';
  import HmmBanners from '$lib/hmm/HmmBanners.svelte';
  import HmmChat from '$lib/hmm/HmmChat.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';

  // Everything the White Knights fork floats above Immich's pages. Mounted once, in the root layout.
  const path = $derived(page.url.pathname);
  // Not on sign-in/password pages (under /auth/), maintenance, or public shared-link pages.
  const chatAllowed = $derived(
    authManager.authenticated &&
      ['/auth/', '/maintenance', '/s/', '/share/'].every((prefix) => !path.startsWith(prefix)),
  );
</script>

<HmmBanners />

{#if chatAllowed}
  <!-- Hidden (not unmounted) in the photo viewer so the member stays "online". -->
  <div class:hidden={assetViewerManager.isViewing}>
    <HmmChat />
  </div>
{/if}
