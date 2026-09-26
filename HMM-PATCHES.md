# White Knights (HMM-165) fork of Immich

Branch `hmm165` is Immich's release tag plus the White Knights web UI changes. It is deployed at
`https://hmm.wehrenterprises.org` as `ghcr.io/wehr-enterprises/immich-server:<version>-hmm.<run>`,
built by `.github/workflows/hmm-image.yml`. The member features (banners, chat, events, wiki) are
served by a separate service, `hmm165-hub`, under `/hub/api/*`.

**Only the web UI is modified.** The server, database schema, CLI, plugins, machine learning and
mobile app are stock upstream. Keep it that way: then upgrading only means rebasing web changes.

## Where the changes live

- **New files only, no conflicts on rebase:** `hmm/` (image build), `web/src/lib/hmm/**`,
  `web/src/routes/(user)/hub/**`, `.github/workflows/hmm-image.yml`, this file.
- **Upstream files touched:** keep every entry to a small hook that calls into `web/src/lib/hmm/`.

| Upstream file | Change | Phase |
|---|---|---|
| `web/src/app.css` | `@import './lib/hmm/theme.css'` after the Immich theme (colors, Oswald) | 1 |
| `web/src/app.html` | Loading screen shows the crest (`/hmm-crest.png`) with a pulse instead of the spinning Immich logo | 1 |
| `web/src/routes/+layout.svelte` | `installBranding()` (swaps all `<Logo>`s); page title suffix "- White Knights"; `<HmmOverlay />` (banners + chat) after the page content | 1, 2, 3 |
| `web/src/routes/+page.ts`, `+page.svelte` | Visitors get `HmmLanding` instead of a redirect to login; members go to `/hub/home` | 1 |
| `web/src/routes/auth/login/+page.ts` | After sign-in, default destination is `/hub/home` instead of `/photos` | 1 |
| `web/src/lib/components/layouts/AuthPageLayout.svelte` | Blurred backdrop behind the login card is the crest | 1 |
| `web/src/lib/components/shared-components/side-bar/UserSidebar.svelte` | `<HmmSidebarLinks />` at the top of the sidebar | 1 |
| `web/static/` favicons, `apple-icon-180.png`, `manifest-icon-*.png`, `manifest.json` | Replaced with squadron icons and name | 1 |

On a conflict in the icons, keep ours and regenerate them: `uv run hmm/branding/make_branding.py`
(from `hmm/branding/crest-source.png` and the Oswald font next to it).

## Upgrading to a new Immich release

```bash
git fetch upstream tag vX.Y.Z --no-tags
git switch hmm165 && git rebase --onto vX.Y.Z v3.2.2   # previous base tag
```

1. Resolve conflicts, which should only be in the files in the table above.
2. Compare the `sdk` and `web` stages of `server/Dockerfile` with `hmm/Dockerfile` and copy any
   changes, such as a new base-image digest. Update the `IMMICH_VERSION` default there too.
3. Run `pnpm run check:typescript && pnpm run check:svelte && pnpm run lint && pnpm run test --run`
   in `web/`.
4. Force-push `hmm165`. CI publishes `vX.Y.Z-hmm.<run>`.
5. Deploy that tag on staging, then in production: set the `image:` line in
   `/opt/immich/docker-compose.override.yml`, set `IMMICH_VERSION=vX.Y.Z` in `/opt/immich/.env`
   (so the database and ML containers match), and run `docker compose up -d`.

Rolling back means putting the previous `image:` tag back. To return to stock Immich, delete the
`image:` line.

## License

Immich is AGPL-3.0. This fork is public, and the image's `IMMICH_REPOSITORY_URL` /
`IMMICH_SOURCE_URL` point at it, so the web UI's About panel links members to the exact source
they are running.
