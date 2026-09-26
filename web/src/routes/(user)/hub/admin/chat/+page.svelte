<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import { formatWhen } from '$lib/hmm/datetime';
  import { getChatMutes, unmuteChatMember, type ChatMute } from '$lib/hmm/hub-api';
  import { handleError } from '$lib/utils/handle-error';
  import { Button, LoadingSpinner, toastManager } from '@immich/ui';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let mutes: ChatMute[] | undefined = $state();

  const load = async () => {
    try {
      mutes = await getChatMutes();
    } catch (error) {
      mutes = [];
      handleError(error, 'Could not load paused members. Is the hub running?');
    }
  };

  const allow = async (mute: ChatMute) => {
    try {
      await unmuteChatMember(mute.userId);
      toastManager.primary(`${mute.userName} can post in the chat again`);
      await load();
    } catch (error) {
      handleError(error, 'Could not update this member');
    }
  };

  onMount(load);
</script>

<UserPageLayout title={data.meta.title}>
  <div class="mx-auto w-full max-w-3xl px-2 pb-16 md:px-6">
    <p class="mt-4 mb-6 text-muted">
      These members can read the squadron chat but not post. Pause someone from the chat itself: hover over one of their
      messages and choose the pause button.
    </p>

    {#if mutes === undefined}
      <div class="flex justify-center py-12"><LoadingSpinner size="large" /></div>
    {:else if mutes.length === 0}
      <p class="rounded-2xl border border-dashed p-8 text-center text-muted">Nobody is paused.</p>
    {:else}
      <ul class="flex flex-col divide-y rounded-2xl border">
        {#each mutes as mute (mute.userId)}
          <li class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
            <span class="grow font-semibold">{mute.userName}</span>
            <span class="text-sm text-muted">Paused by {mute.mutedBy}, {formatWhen(mute.mutedAt)}</span>
            <Button size="small" variant="outline" onclick={() => allow(mute)}>Allow again</Button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</UserPageLayout>
