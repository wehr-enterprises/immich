<script lang="ts">
  import { HmmRoute } from '$lib/hmm/branding';
  import { NavbarItem } from '@immich/ui';
  import { mdiHome, mdiHomeOutline } from '@mdi/js';
</script>

<!-- White Knights pages, shown at the top of Immich's sidebar. Later phases add Events and Wiki here. -->
<NavbarItem title="Home" href={HmmRoute.home()} icon={mdiHomeOutline} activeIcon={mdiHome} />
