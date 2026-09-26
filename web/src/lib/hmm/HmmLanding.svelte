<script lang="ts">
  import { hmmCrest, SITE_NAME, SOURCE_URL, SQUADRON, WORDPRESS_SITE } from '$lib/hmm/branding';
  import { Route } from '$lib/route';
  import { Icon } from '@immich/ui';
  import { mdiAccountPlusOutline, mdiCommentTextMultipleOutline, mdiImageMultipleOutline, mdiLogin } from '@mdi/js';

  // Joining is still handled by the WordPress site's Ultimate Member "Report In" form.
  const reportInUrl = `${WORDPRESS_SITE}/?page_id=494`;

  const features = [
    {
      icon: mdiImageMultipleOutline,
      title: 'The squadron photo archive',
      text: 'Thousands of photos from 1965 to today, organized by year, deployment and reunion.',
    },
    {
      icon: mdiCommentTextMultipleOutline,
      title: 'Share the memories',
      text: 'Comment on photos, put names to faces and add your own pictures for shipmates to enjoy.',
    },
    {
      icon: mdiAccountPlusOutline,
      title: 'Stay on the squadron list',
      text: 'Hear about reunions and Reunion Association news. Served with HMM or VMM-165? Report in.',
    },
  ];
</script>

<div class="min-h-dvh bg-light text-dark">
  <section
    class="relative isolate overflow-hidden bg-linear-to-b from-hmm-navy-dark to-hmm-navy px-6 pt-16 pb-20 text-center text-white dark:from-black dark:to-hmm-navy-dark"
  >
    <img src={hmmCrest} alt="{SQUADRON} {SITE_NAME} squadron patch" class="mx-auto size-44 drop-shadow-xl sm:size-56" />
    <p class="mt-8 font-display text-lg font-medium tracking-[0.35em] text-hmm-gold uppercase">Marine Squadron 165</p>
    <h1 class="mt-2 font-display text-5xl font-semibold tracking-wide uppercase sm:text-7xl">{SITE_NAME}</h1>
    <p class="mx-auto mt-6 max-w-2xl text-lg/relaxed text-white/85">
      Dedicated to the esprit de corps and camaraderie of the Marines and Sailors who served together in Marine Squadron
      165 since its activation on 1 July 1965, during the War in Vietnam, through the Middle East conflicts, and
      continuing today.
    </p>
    <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
      <a
        href={Route.login()}
        class="inline-flex items-center gap-2 rounded-full bg-hmm-gold px-8 py-4 text-lg font-semibold text-black shadow-lg transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        <Icon icon={mdiLogin} size="1.5rem" />
        Member sign in
      </a>
      <a
        href={reportInUrl}
        class="inline-flex items-center gap-2 rounded-full border-2 border-white/80 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        <Icon icon={mdiAccountPlusOutline} size="1.5rem" />
        Report in
      </a>
    </div>
    <p class="mt-6 text-sm text-white/70">
      Sign in with the email address you used on 165whiteknights.com and the password from your invitation.
    </p>
  </section>

  <section class="mx-auto grid max-w-5xl gap-6 px-6 py-16 md:grid-cols-3">
    {#each features as feature (feature.title)}
      <div class="rounded-2xl border bg-subtle p-6">
        <Icon icon={feature.icon} size="2.5rem" class="text-primary" />
        <h2 class="mt-4 font-display text-xl font-semibold tracking-wide uppercase">{feature.title}</h2>
        <p class="mt-2 leading-relaxed text-muted">{feature.text}</p>
      </div>
    {/each}
  </section>

  <footer class="border-t px-6 py-8 text-center text-sm text-muted">
    <p class="font-display tracking-[0.2em] uppercase">Semper Fidelis</p>
    <p class="mt-2">
      <a class="underline hover:text-primary" href={WORDPRESS_SITE}>165whiteknights.com</a>
      ·
      <a class="underline hover:text-primary" href="https://immich.app">Photos powered by Immich</a>
      ·
      <a class="underline hover:text-primary" href={SOURCE_URL}>Source code</a>
    </p>
  </footer>
</div>
