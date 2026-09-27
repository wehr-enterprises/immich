<script lang="ts">
  import { formatBoardDate } from '$lib/hmm/board-format';
  import HmmBoardAvatar from '$lib/hmm/HmmBoardAvatar.svelte';
  import HmmBoardComposer from '$lib/hmm/HmmBoardComposer.svelte';
  import HmmFormattedText from '$lib/hmm/HmmFormattedText.svelte';
  import type { BoardPost } from '$lib/hmm/hub-api';
  import type { UserResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiPencilOutline, mdiReply, mdiTrashCanOutline } from '@mdi/js';

  interface Props {
    post: BoardPost;
    user?: UserResponseDto;
    reply?: boolean;
    canEdit: boolean;
    canDelete: boolean;
    onReply?: () => void;
    onEdit: (body: string) => Promise<void>;
    onDelete: () => void;
  }

  let { post, user, reply = false, canEdit, canDelete, onReply, onEdit, onDelete }: Props = $props();

  let editing = $state(false);

  const save = async (body: string) => {
    await onEdit(body);
    editing = false;
  };

  const action =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium text-muted hover:bg-subtle hover:text-primary';
</script>

<article class="flex gap-3" aria-label="Post by {post.authorName}">
  <HmmBoardAvatar name={post.authorName} {user} size={reply ? 'sm' : 'md'} />
  <div class="min-w-0 grow">
    <header class="flex flex-wrap items-baseline gap-x-2">
      <span class="font-semibold text-primary {reply ? 'text-sm' : ''}">{post.authorName}</span>
      <time class="text-xs text-muted" datetime={post.createdAt} title={new Date(post.createdAt).toLocaleString()}>
        {formatBoardDate(post.createdAt)}
      </time>
      {#if post.editedAt}
        <span class="text-xs text-muted" title="Edited {new Date(post.editedAt).toLocaleString()}">· edited</span>
      {/if}
    </header>

    {#if post.deleted}
      <p class="mt-1 text-muted italic">This post was removed.</p>
    {:else if editing}
      <div class="mt-2">
        <HmmBoardComposer
          placeholder="Edit your post"
          submitLabel="Save"
          initial={post.body}
          compact={reply}
          autofocus
          onSubmit={save}
          onCancel={() => (editing = false)}
        />
      </div>
    {:else}
      <p class="mt-1 wrap-break-word whitespace-pre-line {reply ? 'text-[15px]/relaxed' : 'text-base/relaxed'}">
        <HmmFormattedText text={post.body} />
      </p>
      <div class="-ms-2.5 mt-1 flex flex-wrap gap-1">
        {#if onReply}
          <button type="button" class={action} onclick={onReply}>
            <Icon icon={mdiReply} size="1.1rem" /> Reply
          </button>
        {/if}
        {#if canEdit}
          <button type="button" class={action} onclick={() => (editing = true)}>
            <Icon icon={mdiPencilOutline} size="1.1rem" /> Edit
          </button>
        {/if}
        {#if canDelete}
          <button type="button" class="{action} hover:text-danger" onclick={onDelete}>
            <Icon icon={mdiTrashCanOutline} size="1.1rem" /> Remove
          </button>
        {/if}
      </div>
    {/if}
  </div>
</article>
