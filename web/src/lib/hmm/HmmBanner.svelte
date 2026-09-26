<script lang="ts">
  import HmmFormattedText from '$lib/hmm/HmmFormattedText.svelte';
  import type { AnnouncementInput } from '$lib/hmm/hub-api';
  import { Icon } from '@immich/ui';
  import { mdiAlertOctagon, mdiAlertOutline, mdiBullhornOutline, mdiClose } from '@mdi/js';

  interface Props {
    announcement: Pick<AnnouncementInput, 'title' | 'body' | 'level' | 'dismissible'>;
    onDismiss?: () => void;
  }

  let { announcement, onDismiss }: Props = $props();

  const styles = {
    info: {
      box: 'border-primary/40 bg-primary-50 text-primary-950 dark:bg-primary-100 dark:text-primary-900',
      icon: mdiBullhornOutline,
    },
    warning: {
      box: 'border-amber-500 bg-amber-50 text-amber-950 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-50',
      icon: mdiAlertOutline,
    },
    urgent: {
      box: 'border-red-800 bg-red-700 text-white dark:border-red-500 dark:bg-red-800',
      icon: mdiAlertOctagon,
    },
  };

  const style = $derived(styles[announcement.level]);
</script>

<div
  role={announcement.level === 'urgent' ? 'alert' : 'status'}
  class="flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg {style.box}"
  data-testid="hmm-banner"
>
  <Icon icon={style.icon} size="1.5rem" class="mt-0.5 shrink-0" />
  <div class="min-w-0 grow">
    <p class="font-semibold">{announcement.title}</p>
    {#if announcement.body}
      <p class="mt-0.5 text-sm/relaxed wrap-break-word"><HmmFormattedText text={announcement.body} /></p>
    {/if}
  </div>
  {#if announcement.dismissible && onDismiss}
    <button
      type="button"
      class="-m-1 shrink-0 rounded-full p-1 hover:bg-black/10 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
      aria-label="Dismiss announcement: {announcement.title}"
      title="Dismiss"
      onclick={onDismiss}
    >
      <Icon icon={mdiClose} size="1.25rem" />
    </button>
  {/if}
</div>
