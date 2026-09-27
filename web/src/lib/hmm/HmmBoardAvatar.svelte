<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { initials, initialsColor } from '$lib/hmm/board-format';
  import type { UserResponseDto } from '@immich/sdk';

  interface Props {
    name: string;
    /** The author's Immich account, when they have one. */
    user?: UserResponseDto;
    size?: 'sm' | 'md';
  }

  let { name, user, size = 'md' }: Props = $props();
</script>

{#if user}
  <UserAvatar {user} {size} label={name} />
{:else}
  <span
    class="flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-md select-none {initialsColor(
      name,
    )} {size === 'sm' ? 'size-7 text-xs' : 'size-10 text-sm'}"
    title={name}
    aria-hidden="true"
  >
    {initials(name)}
  </span>
{/if}
