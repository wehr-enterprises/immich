<script lang="ts">
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { HmmRoute } from '$lib/hmm/branding';
  import { chatManager } from '$lib/hmm/chat-manager.svelte';
  import { formatChatTime } from '$lib/hmm/chat-merge';
  import HmmFormattedText from '$lib/hmm/HmmFormattedText.svelte';
  import { HubError, type ChatMember, type ChatMessage } from '$lib/hmm/hub-api';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { Icon, IconButton, modalManager, toastManager } from '@immich/ui';
  import { mediaQueryManager } from '$lib/stores/media-query-manager.svelte';
  import {
    mdiAccountCancelOutline,
    mdiChat,
    mdiChevronDown,
    mdiChevronUp,
    mdiClose,
    mdiSend,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { onMount, tick } from 'svelte';

  const MAX_LENGTH = 500;

  let draft = $state('');
  let sending = $state(false);
  let showOnline = $state(false);
  let list: HTMLElement | undefined = $state();
  let input: HTMLTextAreaElement | undefined = $state();

  const isAdmin = $derived(authManager.authenticated && authManager.user.isAdmin);
  const myId = $derived(authManager.authenticated ? authManager.user.id : undefined);
  const othersOnline = $derived(chatManager.online.filter((m) => m.id !== myId).length);
  const avatarUser = (member: ChatMember) => ({ ...member, email: '' });

  const nearBottom = () => !list || list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  const scrollToBottom = async (force = false) => {
    const stick = force || nearBottom();
    await tick();
    if (list && stick) {
      list.scrollTop = list.scrollHeight;
    }
  };

  // Follow new messages, unless the member scrolled up to read older ones.
  $effect(() => {
    void chatManager.messages.length;
    if (chatManager.isOpen) {
      void scrollToBottom();
    }
  });

  const toggle = async () => {
    chatManager.setOpen(!chatManager.isOpen);
    if (chatManager.isOpen) {
      await scrollToBottom(true);
      input?.focus();
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) {
      return;
    }
    sending = true;
    try {
      await chatManager.send(body);
      draft = '';
      await scrollToBottom(true);
    } catch (error) {
      if (error instanceof HubError && (error.status === 429 || error.status === 403)) {
        toastManager.warning(error.message);
      } else {
        handleError(error, 'Your message could not be sent');
      }
    } finally {
      sending = false;
      input?.focus();
    }
  };

  const onKeydown = (event: KeyboardEvent) => {
    // Enter sends; Shift+Enter starts a new line.
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      void send();
    }
    if (event.key === 'Escape') {
      chatManager.setOpen(false);
    }
  };

  const remove = async (message: ChatMessage) => {
    const confirmed = await modalManager.showDialog({
      title: 'Delete message',
      prompt: `Delete this message from ${message.userName}? It disappears for everyone.`,
      confirmText: 'Delete',
    });
    if (confirmed) {
      try {
        await chatManager.remove(message);
      } catch (error) {
        handleError(error, 'Could not delete the message');
      }
    }
  };

  const mute = async (message: ChatMessage) => {
    const confirmed = await modalManager.showDialog({
      title: 'Pause chat for this member',
      prompt: `${message.userName} will still see the chat but can't post. You can allow them again under Squadron chat → Paused members.`,
      confirmText: 'Pause',
    });
    if (confirmed) {
      try {
        await chatManager.mute(message);
        toastManager.primary(`${message.userName} can no longer post in the chat`);
      } catch (error) {
        handleError(error, 'Could not pause this member');
      }
    }
  };

  onMount(() => {
    chatManager.start();
    return () => chatManager.stop();
  });
</script>

{#snippet unreadBadge(extra = '')}
  {#if chatManager.unread > 0 && !chatManager.isOpen}
    <span
      class="flex h-6 min-w-6 items-center justify-center rounded-full bg-hmm-gold px-1.5 text-xs font-bold text-black shadow-sm {extra}"
      aria-label="{chatManager.unread} unread"
    >
      {chatManager.unread > 99 ? '99+' : chatManager.unread}
    </span>
  {/if}
{/snippet}

<!-- The chat itself, shared by the phone sheet and the desktop drawer. -->
{#snippet chatBody()}
  <div class="flex items-center gap-2 border-b px-3 py-1.5 text-xs">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full px-2 py-1 font-medium hover:bg-subtle"
      aria-expanded={showOnline}
      onclick={() => (showOnline = !showOnline)}
    >
      <span class="size-2 rounded-full bg-green-500"></span>
      {chatManager.online.length} online
      <Icon icon={showOnline ? mdiChevronUp : mdiChevronDown} size="1rem" />
    </button>
    {#if !showOnline}
      <div class="flex min-w-0 grow gap-1 overflow-x-auto" aria-label="Who's online">
        {#each chatManager.online as member (member.id)}
          <UserAvatar user={avatarUser(member)} size="sm" label={member.name} />
        {/each}
      </div>
    {:else}
      <span class="grow"></span>
    {/if}
    {#if isAdmin}
      <a
        href={HmmRoute.adminChat()}
        class="shrink-0 rounded-full px-2 py-1 font-medium text-primary hover:bg-subtle"
        title="Members who can't post"
        onclick={() => chatManager.setOpen(false)}>Paused members</a
      >
    {/if}
  </div>

  {#if showOnline}
    <ul class="max-h-40 overflow-y-auto border-b bg-subtle px-3 py-2" aria-label="Who's online">
      {#each chatManager.online as member (member.id)}
        <li class="flex items-center gap-2 py-1 text-sm">
          <UserAvatar user={avatarUser(member)} size="sm" label={member.name} />
          <span class="truncate">{member.name}{member.id === myId ? ' (you)' : ''}</span>
        </li>
      {/each}
    </ul>
  {/if}

  <ol bind:this={list} class="grow overflow-y-auto" aria-live="polite" aria-label="Messages">
    {#if chatManager.messages.length === 0}
      <li class="p-6 text-center text-sm text-muted">No messages yet. Say hello to your shipmates!</li>
    {/if}
    {#each chatManager.messages as message (message.id)}
      <li class="group relative border-b border-subtle px-4 py-2 even:bg-subtle/60">
        <div class="flex items-baseline gap-2">
          <span class="font-bold text-primary">{message.userName}</span>
          <time class="text-xs text-muted" datetime={message.createdAt}>{formatChatTime(message.createdAt)}</time>
        </div>
        <p class="text-[15px]/relaxed wrap-break-word whitespace-pre-line">
          <HmmFormattedText text={message.body} />
        </p>
        {#if isAdmin}
          <div
            class="absolute top-1 right-2 hidden gap-0.5 rounded-full bg-light shadow-sm group-focus-within:flex group-hover:flex"
          >
            {#if message.userId !== myId}
              <IconButton
                size="small"
                variant="ghost"
                color="secondary"
                shape="round"
                icon={mdiAccountCancelOutline}
                aria-label="Pause chat for {message.userName}"
                onclick={() => mute(message)}
              />
            {/if}
            <IconButton
              size="small"
              variant="ghost"
              color="danger"
              shape="round"
              icon={mdiTrashCanOutline}
              aria-label="Delete message"
              onclick={() => remove(message)}
            />
          </div>
        {/if}
      </li>
    {/each}
  </ol>

  {#if chatManager.muted}
    <p class="border-t bg-subtle p-4 text-center text-sm text-muted">An administrator has paused your chat messages.</p>
  {:else}
    <form
      class="flex items-end gap-2 border-t p-3"
      onsubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      <label class="grow">
        <span class="sr-only">Message</span>
        <textarea
          bind:this={input}
          bind:value={draft}
          maxlength={MAX_LENGTH}
          rows="1"
          placeholder="Write a message…"
          class="block field-sizing-content max-h-32 min-h-12 w-full resize-none rounded-3xl border-2 bg-light px-4 py-2.5 text-[15px] outline-none focus:border-primary"
          onkeydown={onKeydown}></textarea>
        {#if draft.length > MAX_LENGTH - 100}
          <span class="mt-1 block text-end text-xs text-muted">{draft.length}/{MAX_LENGTH}</span>
        {/if}
      </label>
      <button
        type="submit"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-light transition hover:brightness-110 disabled:opacity-50"
        disabled={!draft.trim() || sending}
        aria-label="Send"
        title="Send (Enter)"
      >
        <Icon icon={mdiSend} size="1.4rem" />
      </button>
    </form>
  {/if}
{/snippet}

{#if chatManager.available}
  {#if mediaQueryManager.maxMd}
    <!-- Phones: a floating chat icon; the chat opens as a sheet above it. -->
    <button
      type="button"
      class="fixed inset-s-3 bottom-3 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-light shadow-lg transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none"
      aria-expanded={chatManager.isOpen}
      aria-controls="hmm-chat-panel"
      aria-label={chatManager.isOpen ? 'Close squadron chat' : 'Open squadron chat'}
      title="Squadron chat"
      onclick={toggle}
    >
      <Icon icon={chatManager.isOpen ? mdiClose : mdiChat} size="1.75rem" />
      {@render unreadBadge('absolute -top-1 -right-1')}
    </button>

    {#if chatManager.isOpen}
      <section
        id="hmm-chat-panel"
        aria-label="Squadron chat"
        class="fixed inset-x-2 bottom-20 z-50 flex h-[min(34rem,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border bg-light shadow-2xl"
      >
        <header class="bg-primary px-4 py-2.5 text-light">
          <h2 class="font-display text-lg font-semibold tracking-wide uppercase">Squadron chat</h2>
        </header>
        {@render chatBody()}
      </section>
    {/if}
  {:else}
    <!-- Desktop: a drawer docked to the bottom edge, like Facebook's chat. It stays clear of the
         timeline scrubber on the right and of the sidebar (storage meter) on the left. -->
    <section
      id="hmm-chat-panel"
      aria-label="Squadron chat"
      class="fixed inset-e-20 bottom-0 z-50 flex w-80 flex-col overflow-hidden rounded-t-xl border border-b-0 bg-light shadow-[0_-4px_24px_rgba(0,0,0,0.18)]"
    >
      <header class="flex items-center bg-primary text-light">
        <button
          type="button"
          class="flex min-w-0 grow items-center gap-2 px-3 py-2.5 text-start hover:brightness-110"
          aria-expanded={chatManager.isOpen}
          aria-label={chatManager.isOpen ? 'Collapse squadron chat' : 'Open squadron chat'}
          onclick={toggle}
        >
          <Icon icon={mdiChat} size="1.25rem" class="shrink-0" />
          <h2 class="truncate font-display text-base font-semibold tracking-wide uppercase">Squadron chat</h2>
          {@render unreadBadge()}
          {#if !chatManager.isOpen && othersOnline > 0}
            <span class="ms-auto flex shrink-0 items-center gap-1.5 text-xs font-medium">
              <span class="size-2 rounded-full bg-green-400"></span>
              {othersOnline} online
            </span>
          {/if}
        </button>
        <button
          type="button"
          class="me-1 rounded-full p-1.5 hover:bg-white/15"
          aria-label={chatManager.isOpen ? 'Collapse squadron chat' : 'Open squadron chat'}
          tabindex="-1"
          onclick={toggle}
        >
          <Icon icon={chatManager.isOpen ? mdiChevronDown : mdiChevronUp} size="1.4rem" />
        </button>
      </header>
      {#if chatManager.isOpen}
        <div class="flex h-[min(28rem,calc(100dvh-10rem))] flex-col">
          {@render chatBody()}
        </div>
      {/if}
    </section>
  {/if}
{/if}
