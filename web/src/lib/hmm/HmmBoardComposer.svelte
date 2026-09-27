<script lang="ts">
  import { Button } from '@immich/ui';
  import { onMount } from 'svelte';

  interface Props {
    placeholder: string;
    submitLabel?: string;
    initial?: string;
    compact?: boolean;
    autofocus?: boolean;
    /** Resolves when saved; the text is cleared then. Throwing keeps the text for another try. */
    onSubmit: (body: string) => Promise<void>;
    onCancel?: () => void;
  }

  const MAX_LENGTH = 5000;

  let {
    placeholder,
    submitLabel = 'Post',
    initial = '',
    compact = false,
    autofocus = false,
    onSubmit,
    onCancel,
  }: Props = $props();

  let body = $state(initial);
  let busy = $state(false);
  let textarea: HTMLTextAreaElement | undefined = $state();

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || busy) {
      return;
    }
    busy = true;
    try {
      await onSubmit(text);
      body = '';
    } catch {
      // the caller reported the error; keep the text
    } finally {
      busy = false;
    }
  };

  onMount(() => {
    if (autofocus) {
      textarea?.focus();
    }
  });
</script>

<form class="flex flex-col gap-2" onsubmit={submit}>
  <label>
    <span class="sr-only">{placeholder}</span>
    <textarea
      bind:this={textarea}
      bind:value={body}
      maxlength={MAX_LENGTH}
      rows={compact ? 2 : 3}
      {placeholder}
      class="block field-sizing-content max-h-96 w-full resize-y rounded-2xl border-2 bg-light px-4 py-3 text-base/relaxed outline-none focus:border-primary {compact
        ? 'min-h-16'
        : 'min-h-24'}"
      onkeydown={(event) => {
        if (event.key === 'Escape' && onCancel) {
          onCancel();
        }
      }}></textarea>
  </label>
  <div class="flex items-center justify-end gap-2">
    {#if body.length > MAX_LENGTH - 500}
      <span class="me-auto text-xs text-muted">{body.length}/{MAX_LENGTH}</span>
    {/if}
    {#if onCancel}
      <Button type="button" size="small" variant="ghost" color="secondary" onclick={onCancel}>Cancel</Button>
    {/if}
    <Button type="submit" size="small" shape="round" disabled={!body.trim()} loading={busy}>{submitLabel}</Button>
  </div>
</form>
