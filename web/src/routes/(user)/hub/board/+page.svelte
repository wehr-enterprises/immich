<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import HmmBoardAvatar from '$lib/hmm/HmmBoardAvatar.svelte';
  import HmmBoardComposer from '$lib/hmm/HmmBoardComposer.svelte';
  import HmmBoardPhoto from '$lib/hmm/HmmBoardPhoto.svelte';
  import HmmBoardPost from '$lib/hmm/HmmBoardPost.svelte';
  import {
    createBoardPost,
    deleteBoardPost,
    editBoardPost,
    getBoard,
    HubError,
    type BoardPost,
    type BoardThread,
  } from '$lib/hmm/hub-api';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { searchUsers, type UserResponseDto } from '@immich/sdk';
  import { Button, LoadingSpinner, modalManager, toastManager } from '@immich/ui';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const PAGE_SIZE = 20;

  let threads: BoardThread[] = $state([]);
  let total = $state(0);
  let loading = $state(true);
  let loadingMore = $state(false);
  let replyingTo: number | undefined = $state();
  let users = $state(new Map<string, UserResponseDto>());

  const me = $derived(authManager.user);
  const userFor = (post: BoardPost) => (post.userId ? users.get(post.userId) : undefined);
  // Photo comments live in Immich, which can't edit comments: remove and write again instead.
  const canEdit = (post: BoardPost) => !post.deleted && !post.photoComment && post.userId === me.id;
  const canDelete = (post: BoardPost) => !post.deleted && (post.userId === me.id || me.isAdmin);

  const report = (error: unknown, message: string) => {
    if (error instanceof HubError && error.status === 429) {
      toastManager.warning(error.message);
    } else {
      handleError(error, message);
    }
  };

  const loadPage = async (offset: number) => {
    const page = await getBoard(offset, PAGE_SIZE);
    const known = new Set(threads.map((t) => t.id));
    threads = [...(offset === 0 ? [] : threads), ...page.threads.filter((t) => offset === 0 || !known.has(t.id))];
    total = page.total;
  };

  const loadMore = async () => {
    loadingMore = true;
    try {
      await loadPage(threads.length);
    } catch (error) {
      handleError(error, 'Could not load older posts');
    } finally {
      loadingMore = false;
    }
  };

  const createThread = async (body: string) => {
    try {
      const post = await createBoardPost(body);
      threads = [{ ...post, replies: [], photo: null }, ...threads];
      total += 1;
    } catch (error) {
      report(error, 'Your post could not be saved');
      throw error;
    }
  };

  const createReply = async (thread: BoardThread, body: string) => {
    try {
      const post = await createBoardPost(body, thread.id);
      thread.replies = [...thread.replies, post];
      replyingTo = undefined;
    } catch (error) {
      report(error, 'Your reply could not be saved');
      throw error;
    }
  };

  const replace = (updated: BoardPost) => {
    threads = threads.map((t) =>
      t.id === updated.id
        ? { ...t, ...updated }
        : { ...t, replies: t.replies.map((r) => (r.id === updated.id ? updated : r)) },
    );
  };

  const edit = async (post: BoardPost, body: string) => {
    try {
      replace(await editBoardPost(post.id, body));
    } catch (error) {
      report(error, 'Your changes could not be saved');
      throw error;
    }
  };

  const remove = async (post: BoardPost) => {
    const own = post.userId === me.id;
    const confirmed = await modalManager.showDialog({
      title: 'Remove post',
      prompt:
        (own
          ? 'Remove your post from the message board?'
          : `Remove this post by ${post.authorName}? It disappears for everyone.`) +
        (post.photoComment ? ' It is also removed from the photo.' : ''),
      confirmText: 'Remove',
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteBoardPost(post.id);
      threads = threads
        .map((t) =>
          t.id === post.id
            ? { ...t, deleted: true, body: '' }
            : { ...t, replies: t.replies.filter((r) => r.id !== post.id) },
        )
        // A photo's thread goes with its last comment; a removed post stays while it has replies.
        .filter((t) => (t.photo ? t.replies.length > 0 : !t.deleted || t.replies.length > 0));
      toastManager.primary('Post removed');
    } catch (error) {
      report(error, 'The post could not be removed');
    }
  };

  onMount(async () => {
    // Avatars for authors with an account (Immich lists members to each other by default).
    searchUsers()
      .then((list) => (users = new Map(list.map((u) => [u.id, u]))))
      .catch(() => {});
    try {
      await loadPage(0);
    } catch (error) {
      handleError(error, 'Could not load the message board. Is the hub running?');
    } finally {
      loading = false;
    }
  });
</script>

<UserPageLayout title={data.meta.title}>
  <div class="mx-auto w-full max-w-3xl px-2 pb-20 md:px-6">
    <header class="my-6">
      <p class="font-display text-sm font-medium tracking-[0.3em] text-primary uppercase">White Knights</p>
      <h1 class="mt-1 font-display text-3xl font-semibold tracking-wide">Message board</h1>
      <p class="mt-2 text-muted">Let's catch up! Share news, memories and questions with your squadron mates.</p>
    </header>

    <section class="mb-8 flex gap-3 rounded-2xl border bg-subtle p-4" aria-label="New post">
      <HmmBoardAvatar name={me.name} user={users.get(me.id)} />
      <div class="grow">
        <HmmBoardComposer placeholder="What's on your mind, {me.name.split(' ', 1)[0]}?" onSubmit={createThread} />
      </div>
    </section>

    {#if loading}
      <div class="flex justify-center py-12"><LoadingSpinner size="large" /></div>
    {:else if threads.length === 0}
      <p class="rounded-2xl border border-dashed p-8 text-center text-muted">Nothing here yet. Be the first to post!</p>
    {:else}
      <ol class="flex flex-col gap-5" aria-label="Posts">
        {#each threads as thread (thread.id)}
          <li class="rounded-2xl border bg-light p-5 shadow-sm">
            {#if thread.photo}
              <HmmBoardPhoto photo={thread.photo} comments={thread.replies.length} />
            {:else}
              <HmmBoardPost
                post={thread}
                user={userFor(thread)}
                canEdit={canEdit(thread)}
                canDelete={canDelete(thread)}
                onReply={thread.deleted
                  ? undefined
                  : () => (replyingTo = replyingTo === thread.id ? undefined : thread.id)}
                onEdit={(body) => edit(thread, body)}
                onDelete={() => remove(thread)}
              />
            {/if}

            {#if thread.replies.length > 0 || replyingTo === thread.id || thread.photo}
              <div class="ms-5 mt-4 flex flex-col gap-4 border-s-2 border-primary/20 ps-4 sm:ms-12">
                {#each thread.replies as reply (reply.id)}
                  <HmmBoardPost
                    post={reply}
                    user={userFor(reply)}
                    reply
                    canEdit={canEdit(reply)}
                    canDelete={canDelete(reply)}
                    onEdit={(body) => edit(reply, body)}
                    onDelete={() => remove(reply)}
                  />
                {/each}
                {#if thread.photo && replyingTo !== thread.id}
                  <button
                    type="button"
                    class="self-start rounded-full px-2.5 py-1 text-sm font-medium text-primary hover:bg-subtle"
                    onclick={() => (replyingTo = thread.id)}
                  >
                    Add a comment
                  </button>
                {/if}
                {#if replyingTo === thread.id}
                  <div class="flex gap-3">
                    <HmmBoardAvatar name={me.name} user={users.get(me.id)} size="sm" />
                    <div class="grow">
                      <HmmBoardComposer
                        placeholder={thread.photo
                          ? 'Add a comment (it also appears on the photo)'
                          : `Reply to ${thread.authorName}`}
                        submitLabel={thread.photo ? 'Comment' : 'Reply'}
                        compact
                        autofocus
                        onSubmit={(body) => createReply(thread, body)}
                        onCancel={() => (replyingTo = undefined)}
                      />
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </li>
        {/each}
      </ol>

      {#if threads.length < total}
        <div class="mt-8 flex justify-center">
          <Button variant="outline" shape="round" loading={loadingMore} onclick={loadMore}>
            Show older posts ({total - threads.length} more)
          </Button>
        </div>
      {/if}
    {/if}
  </div>
</UserPageLayout>
