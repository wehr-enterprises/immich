<script lang="ts">
  import { WORDPRESS_SITE } from '$lib/hmm/branding';
  import { BasicModal } from '@immich/ui';
  import { mdiLinkOff } from '@mdi/js';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<!-- Shown instead of Immich's "create link to share" form: the site doesn't allow anonymous access. -->
<BasicModal title="Sharing links are turned off" icon={mdiLinkOff} size="small" {onClose}>
  <div class="flex flex-col gap-3">
    <p>
      The White Knights photos are for signed-in members only, so links for people without an account can't be made.
    </p>
    <p>Every album is already shared with every member: squadron mates can find it under <strong>Albums</strong>.</p>
    <p>
      Know someone who served with HMM or VMM-165? Ask them to
      <a class="font-medium text-primary underline" href="{WORDPRESS_SITE}/?page_id=494" target="_blank" rel="noopener"
        >report in</a
      > so they get an account.
    </p>
  </div>
</BasicModal>
