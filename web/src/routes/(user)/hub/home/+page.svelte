<script lang="ts">
  import AlbumCard from '$lib/components/album-page/AlbumCard.svelte';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import { HmmRoute, SITE_NAME } from '$lib/hmm/branding';
  import { mostRecentlyAdded } from '$lib/hmm/recent-albums';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { Route } from '$lib/route';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { Icon, LoadingSpinner } from '@immich/ui';
  import {
    mdiAccountCogOutline,
    mdiAccountMultipleOutline,
    mdiForumOutline,
    mdiImageAlbum,
    mdiImageMultipleOutline,
  } from '@mdi/js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let albums: AlbumResponseDto[] | undefined = $state();

  const firstName = $derived(authManager.user.name.split(' ', 1)[0] || authManager.user.name);

  // Large, plain tiles (as on the "White Knights — The Hub" WordPress theme): everything is one tap away.
  const tiles = [
    {
      title: 'Squadron albums',
      text: 'Every photo album, by year and event',
      href: Route.albums(),
      icon: mdiImageAlbum,
    },
    {
      title: 'Message board',
      text: 'News and memories from squadron mates',
      href: HmmRoute.board(),
      icon: mdiForumOutline,
    },
    {
      title: 'Shared with me',
      text: 'Albums and people sharing with you',
      href: Route.sharing(),
      icon: mdiAccountMultipleOutline,
    },
    {
      title: 'My photos',
      text: 'Photos you have uploaded yourself',
      href: Route.photos(),
      icon: mdiImageMultipleOutline,
    },
    {
      title: 'My account',
      text: 'Password, name and settings',
      href: Route.userSettings(),
      icon: mdiAccountCogOutline,
    },
  ];

  onMount(async () => {
    try {
      albums = mostRecentlyAdded(await getAllAlbums({}), 8);
    } catch (error) {
      albums = [];
      handleError(error, 'Could not load the albums');
    }
  });
</script>

<UserPageLayout title={data.meta.title}>
  <div class="mx-auto w-full max-w-6xl px-2 pb-16 md:px-6">
    <header class="mt-6 mb-8">
      <p class="font-display text-sm font-medium tracking-[0.3em] text-primary uppercase">{SITE_NAME}</p>
      <h1 class="mt-1 font-display text-3xl font-semibold tracking-wide sm:text-4xl">Welcome aboard, {firstName}</h1>
    </header>

    <nav aria-label="Shortcuts" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {#each tiles as tile (tile.href)}
        <a
          href={tile.href}
          class="group flex min-h-32 items-start gap-4 rounded-2xl border bg-subtle p-5 transition hover:border-primary hover:shadow-md focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          <span class="rounded-xl bg-primary p-3 text-light">
            <Icon icon={tile.icon} size="1.75rem" />
          </span>
          <span>
            <span class="block text-lg font-semibold group-hover:text-primary">{tile.title}</span>
            <span class="mt-1 block text-sm text-muted">{tile.text}</span>
          </span>
        </a>
      {/each}
    </nav>

    <section class="mt-12" aria-labelledby="recent-albums">
      <div class="flex items-baseline justify-between">
        <h2 id="recent-albums" class="font-display text-2xl font-semibold tracking-wide">Recently added photos</h2>
        <a class="text-sm font-medium text-primary hover:underline" href={Route.albums()}>All albums</a>
      </div>

      {#if albums === undefined}
        <div class="flex justify-center py-12"><LoadingSpinner size="large" /></div>
      {:else if albums.length === 0}
        <p class="py-8 text-muted">No albums have been shared with you yet.</p>
      {:else}
        <div class="mt-2 grid grid-auto-fill-56 gap-y-4">
          {#each albums as album, index (album.id)}
            <a href={Route.viewAlbum(album)} data-sveltekit-preload-data="hover">
              <AlbumCard {album} showItemCount showDateRange preload={index < 4} />
            </a>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</UserPageLayout>
