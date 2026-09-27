<script lang="ts">
  import { HmmRoute } from '$lib/hmm/branding';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { NavbarItem } from '@immich/ui';
  import { mdiBullhorn, mdiBullhornOutline, mdiForum, mdiForumOutline, mdiHome, mdiHomeOutline } from '@mdi/js';
</script>

<!-- White Knights pages, shown at the top of Immich's sidebar. Later phases add Events and Wiki here. -->
<NavbarItem title="Home" href={HmmRoute.home()} icon={mdiHomeOutline} activeIcon={mdiHome} />
<NavbarItem title="Message board" href={HmmRoute.board()} icon={mdiForumOutline} activeIcon={mdiForum} />

{#if authManager.authenticated && authManager.user.isAdmin}
  <NavbarItem
    title="Announcements"
    href={HmmRoute.adminAnnouncements()}
    icon={mdiBullhornOutline}
    activeIcon={mdiBullhorn}
  />
{/if}
