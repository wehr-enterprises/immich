# White Knights (HMM-165) build of immich-server: the stock upstream image with only the web UI
# rebuilt from this fork. The server, CLI and plugins are exactly upstream's, so the database
# schema and API are unchanged. Build from the repository root:
#
#   docker build -f hmm/Dockerfile --build-arg IMMICH_VERSION=v3.2.2 -t immich-server:hmm .
#
# The builder stages mirror the `sdk` and `web` stages of server/Dockerfile; keep them in sync
# when rebasing onto a new Immich release (see HMM-PATCHES.md).

# Must match web/package.json; CI passes it from there.
ARG IMMICH_VERSION=v3.2.2

FROM ghcr.io/immich-app/base-server-dev:202608300913@sha256:188679bfc2e7a496bdc13bd145cf59d90b2fb8f9dbf7131b2c1a368cd637b1a0 AS builder
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  CI=1 \
  COREPACK_HOME=/tmp \
  PNPM_HOME=/buildcache/pnpm-store \
  PATH="/buildcache/pnpm-store:$PATH"

RUN npm install --global corepack@latest && \
  corepack enable pnpm && \
  pnpm config set store-dir "$PNPM_HOME"

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./

FROM builder AS sdk

COPY ./packages/sdk/package.json ./packages/sdk/package.json
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter @immich/sdk install --frozen-lockfile

COPY ./packages/sdk ./packages/sdk/
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter @immich/sdk build

FROM sdk AS web

COPY ./web/package.json ./web/package.json
RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter immich-web install --frozen-lockfile

COPY ./i18n ./i18n/
COPY ./web ./web/

ARG BUILD_ID
ENV IMMICH_BUILD=${BUILD_ID}

RUN --mount=type=cache,id=pnpm,target=/buildcache/pnpm-store pnpm --filter immich-web build

FROM ghcr.io/immich-app/immich-server:${IMMICH_VERSION}

# Replace the stock web UI entirely (no stale hashed assets left behind for the service worker).
RUN rm -rf /build/www
COPY --from=web /usr/src/app/web/build /build/www

ARG BUILD_ID
ARG BUILD_IMAGE
ARG BUILD_SOURCE_REF
ARG BUILD_SOURCE_COMMIT
ARG REPOSITORY=wehr-enterprises/immich

# Shown in the web UI's About/server info. Immich is AGPL-3.0: members who use this modified UI
# must be able to get its source, so these point at the fork rather than upstream.
ENV IMMICH_BUILD=${BUILD_ID}
ENV IMMICH_BUILD_URL=https://github.com/${REPOSITORY}/actions/runs/${BUILD_ID}
ENV IMMICH_BUILD_IMAGE=${BUILD_IMAGE}
ENV IMMICH_BUILD_IMAGE_URL=https://github.com/${REPOSITORY}/pkgs/container/immich-server
ENV IMMICH_REPOSITORY=${REPOSITORY}
ENV IMMICH_REPOSITORY_URL=https://github.com/${REPOSITORY}
ENV IMMICH_SOURCE_REF=${BUILD_SOURCE_REF}
ENV IMMICH_SOURCE_COMMIT=${BUILD_SOURCE_COMMIT}
ENV IMMICH_SOURCE_URL=https://github.com/${REPOSITORY}/commit/${BUILD_SOURCE_COMMIT}
