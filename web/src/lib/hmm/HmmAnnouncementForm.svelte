<script lang="ts">
  import { fromLocalInput, toLocalInput } from '$lib/hmm/datetime';
  import HmmBanner from '$lib/hmm/HmmBanner.svelte';
  import type { AnnouncementAudience, AnnouncementInput, AnnouncementLevel } from '$lib/hmm/hub-api';
  import { Button } from '@immich/ui';

  interface Props {
    initial?: AnnouncementInput;
    saving?: boolean;
    onSave: (input: AnnouncementInput) => void;
    onCancel: () => void;
  }

  let { initial, saving = false, onSave, onCancel }: Props = $props();

  let title = $state(initial?.title ?? '');
  let body = $state(initial?.body ?? '');
  let level = $state<AnnouncementLevel>(initial?.level ?? 'info');
  let audience = $state<AnnouncementAudience>(initial?.audience ?? 'members');
  let dismissible = $state(initial?.dismissible ?? true);
  let startsAt = $state(toLocalInput(initial?.startsAt));
  let endsAt = $state(toLocalInput(initial?.endsAt));

  const endsBeforeStart = $derived(!!startsAt && !!endsAt && endsAt <= startsAt);
  const canSave = $derived(title.trim().length > 0 && !endsBeforeStart && !saving);

  const levels: { value: AnnouncementLevel; label: string }[] = [
    { value: 'info', label: 'Information (navy)' },
    { value: 'warning', label: 'Important (amber)' },
    { value: 'urgent', label: 'Urgent (red)' },
  ];

  const audiences: { value: AnnouncementAudience; label: string }[] = [
    { value: 'members', label: 'Members (signed in)' },
    { value: 'public', label: 'Everyone, including the welcome and sign-in pages' },
    { value: 'admins', label: 'Administrators only' },
  ];

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    onSave({
      title: title.trim(),
      body: body.trim(),
      level,
      audience,
      dismissible,
      startsAt: fromLocalInput(startsAt),
      endsAt: fromLocalInput(endsAt),
    });
  };
</script>

<form class="flex flex-col gap-5" onsubmit={submit}>
  <label class="flex flex-col gap-1">
    <span class="immich-form-label">Title</span>
    <input
      class="immich-form-input"
      bind:value={title}
      maxlength="120"
      required
      placeholder="Reunion registration is open"
    />
  </label>

  <label class="flex flex-col gap-1">
    <span class="immich-form-label">Message (optional)</span>
    <textarea
      class="immich-form-input min-h-24 resize-y"
      bind:value={body}
      maxlength="2000"
      placeholder="Register by **March 1**. Details: [Reunion page](https://www.165whiteknights.com)"></textarea>
    <span class="text-xs text-muted">
      Formatting: **bold**, *italic*, [link text](https://…). Web addresses become links automatically.
    </span>
  </label>

  <div class="grid gap-5 sm:grid-cols-2">
    <label class="flex flex-col gap-1">
      <span class="immich-form-label">Importance</span>
      <select class="immich-form-input" bind:value={level}>
        {#each levels as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </label>

    <label class="flex flex-col gap-1">
      <span class="immich-form-label">Who sees it</span>
      <select class="immich-form-input" bind:value={audience}>
        {#each audiences as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </label>

    <label class="flex flex-col gap-1">
      <span class="immich-form-label">Show from (optional)</span>
      <input class="immich-form-input" type="datetime-local" bind:value={startsAt} />
      <span class="text-xs text-muted">Empty: right away</span>
    </label>

    <label class="flex flex-col gap-1">
      <span class="immich-form-label">Show until (optional)</span>
      <input class="immich-form-input" type="datetime-local" bind:value={endsAt} />
      <span class="text-xs {endsBeforeStart ? 'text-danger' : 'text-muted'}">
        {endsBeforeStart ? 'Must be after the start' : 'Empty: until you delete it'}
      </span>
    </label>
  </div>

  <label class="flex items-center gap-3">
    <input type="checkbox" class="size-5 accent-(--immich-ui-primary-500)" bind:checked={dismissible} />
    <span>Members can close it <span class="text-sm text-muted">(otherwise they can only minimize it)</span></span>
  </label>

  <div class="flex flex-col gap-2">
    <span class="immich-form-label">Preview</span>
    <HmmBanner
      announcement={{ title: title.trim() || 'Your title', body, level, dismissible }}
      onDismiss={dismissible ? () => {} : undefined}
    />
  </div>

  <div class="flex justify-end gap-2">
    <Button type="button" color="secondary" variant="ghost" onclick={onCancel}>Cancel</Button>
    <Button type="submit" disabled={!canSave} loading={saving}>Save</Button>
  </div>
</form>
