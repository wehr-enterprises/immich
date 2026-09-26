<script lang="ts">
  import { formatText } from '$lib/hmm/format';

  interface Props {
    text: string;
    linkClass?: string;
  }

  let { text, linkClass = 'underline underline-offset-2 hover:opacity-80' }: Props = $props();

  const tokens = $derived(formatText(text));
</script>

{#each tokens as token, index (index)}
  {#if token.type === 'text'}{token.text}{:else if token.type === 'bold'}<strong>{token.text}</strong
    >{:else if token.type === 'italic'}<em>{token.text}</em>{:else if token.type === 'link'}<a
      class={linkClass}
      href={token.href}
      target={token.href.startsWith('/') ? undefined : '_blank'}
      rel={token.href.startsWith('/') ? undefined : 'noopener noreferrer'}>{token.text}</a
    >{:else}<br />{/if}
{/each}
