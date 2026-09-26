<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import { announcementsManager } from '$lib/hmm/announcements-manager.svelte';
  import { formatWhen } from '$lib/hmm/datetime';
  import HmmAnnouncementForm from '$lib/hmm/HmmAnnouncementForm.svelte';
  import HmmBanner from '$lib/hmm/HmmBanner.svelte';
  import {
    createAnnouncement,
    deleteAnnouncement,
    getAllAnnouncements,
    updateAnnouncement,
    type AdminAnnouncement,
    type AnnouncementInput,
  } from '$lib/hmm/hub-api';
  import { handleError } from '$lib/utils/handle-error';
  import { Button, LoadingSpinner, modalManager, toastManager } from '@immich/ui';
  import { mdiPencilOutline, mdiPlus, mdiTrashCanOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let items: AdminAnnouncement[] | undefined = $state();
  let editing: AdminAnnouncement | 'new' | undefined = $state();
  let saving = $state(false);

  const audienceLabel = { public: 'Everyone', members: 'Members', admins: 'Admins' };
  const statusStyle = {
    live: 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200',
    scheduled: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
    ended: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  const load = async () => {
    try {
      items = await getAllAnnouncements();
    } catch (error) {
      items = [];
      handleError(error, 'Could not load announcements. Is the hub running?');
    }
  };

  const save = async (input: AnnouncementInput) => {
    saving = true;
    try {
      await (editing === 'new' || editing === undefined
        ? createAnnouncement(input)
        : updateAnnouncement(editing.id, input));
      toastManager.primary('Announcement saved');
      editing = undefined;
      await Promise.all([load(), announcementsManager.refresh()]);
    } catch (error) {
      handleError(error, 'Could not save the announcement');
    } finally {
      saving = false;
    }
  };

  const remove = async (item: AdminAnnouncement) => {
    const confirmed = await modalManager.showDialog({
      title: 'Delete announcement',
      prompt: `Delete "${item.title}"? It disappears for everyone right away.`,
      confirmText: 'Delete',
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteAnnouncement(item.id);
      toastManager.primary('Announcement deleted');
      await Promise.all([load(), announcementsManager.refresh()]);
    } catch (error) {
      handleError(error, 'Could not delete the announcement');
    }
  };

  const schedule = (item: AdminAnnouncement) => {
    if (item.startsAt && item.endsAt) {
      return `${formatWhen(item.startsAt)} – ${formatWhen(item.endsAt)}`;
    }
    if (item.startsAt) {
      return `From ${formatWhen(item.startsAt)}`;
    }
    if (item.endsAt) {
      return `Until ${formatWhen(item.endsAt)}`;
    }
    return 'No end date';
  };

  onMount(load);
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet buttons()}
    {#if !editing}
      <Button leadingIcon={mdiPlus} size="small" onclick={() => (editing = 'new')}>New announcement</Button>
    {/if}
  {/snippet}

  <div class="mx-auto w-full max-w-4xl px-2 pb-16 md:px-6">
    <p class="mt-4 mb-6 text-muted">
      Banners appear at the top of the site in web browsers (not in the Immich phone apps) and update within a few
      minutes.
    </p>

    {#if editing}
      <section class="mb-10 rounded-2xl border bg-subtle p-5">
        <h2 class="mb-4 font-display text-xl font-semibold tracking-wide">
          {editing === 'new' ? 'New announcement' : 'Edit announcement'}
        </h2>
        {#key editing}
          <HmmAnnouncementForm
            initial={editing === 'new' ? undefined : editing}
            {saving}
            onSave={save}
            onCancel={() => (editing = undefined)}
          />
        {/key}
      </section>
    {/if}

    {#if items === undefined}
      <div class="flex justify-center py-12"><LoadingSpinner size="large" /></div>
    {:else if items.length === 0}
      <p class="rounded-2xl border border-dashed p-8 text-center text-muted">
        No announcements yet. Use <strong>New announcement</strong> to post one.
      </p>
    {:else}
      <ul class="flex flex-col gap-6">
        {#each items as item (item.id)}
          <li class="flex flex-col gap-2">
            <HmmBanner announcement={item} />
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-sm text-muted">
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold capitalize {statusStyle[item.status]}">
                {item.status}
              </span>
              <span>{audienceLabel[item.audience]}</span>
              <span>{schedule(item)}</span>
              <span>{item.dismissible ? 'Can be closed' : 'Cannot be closed'}</span>
              <span>Edited by {item.updatedBy}, {formatWhen(item.updatedAt)}</span>
              <span class="ms-auto flex gap-1">
                <Button
                  size="small"
                  variant="ghost"
                  color="secondary"
                  leadingIcon={mdiPencilOutline}
                  onclick={() => (editing = item)}>Edit</Button
                >
                <Button
                  size="small"
                  variant="ghost"
                  color="danger"
                  leadingIcon={mdiTrashCanOutline}
                  onclick={() => remove(item)}>Delete</Button
                >
              </span>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</UserPageLayout>
