<script lang="ts">
  import type { BoardPhoto } from '$lib/hmm/hub-api';
  import { Route } from '$lib/route';
  import { getAssetMediaUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiCommentTextMultipleOutline, mdiImageBrokenVariant } from '@mdi/js';

  interface Props {
    photo: BoardPhoto;
    comments: number;
  }

  let { photo, comments }: Props = $props();

  let broken = $state(false);
  const href = $derived(Route.viewAlbumAsset({ albumId: photo.albumId, assetId: photo.assetId }));
</script>

<!-- The start of a photo's comment thread: the photo itself, linking to it in its album. -->
<div>
  <p class="mb-3 flex items-center gap-2 text-sm text-muted">
    <Icon icon={mdiCommentTextMultipleOutline} size="1.1rem" class="text-primary" />
    <span>
      {comments === 1 ? '1 comment' : `${comments} comments`} on a photo in
      <a class="font-medium text-primary hover:underline" href={Route.viewAlbum({ id: photo.albumId })}
        >{photo.albumName}</a
      >
    </span>
  </p>
  <a {href} class="group block overflow-hidden rounded-xl bg-subtle" title="Open the photo">
    {#if broken}
      <span class="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted">
        <Icon icon={mdiImageBrokenVariant} size="2rem" />
        This photo isn't shared with you
      </span>
    {:else}
      <img
        src={getAssetMediaUrl({ id: photo.assetId, size: AssetMediaSize.Preview })}
        alt="Photo in {photo.albumName}"
        loading="lazy"
        class="max-h-96 w-full object-cover transition group-hover:scale-[1.02] group-hover:brightness-105"
        onerror={() => (broken = true)}
      />
    {/if}
  </a>
</div>
