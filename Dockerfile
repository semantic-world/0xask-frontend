# Multi stage, so the runtime image carries no build toolchain and no source.
#
# Next's standalone output is a self contained server with only the
# dependencies it actually uses, which is the difference between an image of a
# few hundred megabytes and one of about a hundred.

FROM node:22-alpine AS deps

WORKDIR /build

# Dependencies are their own layer, so a source change does not reinstall them.
COPY package.json package-lock.json ./
RUN npm ci


FROM node:22-alpine AS builder

WORKDIR /build

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /build/node_modules ./node_modules
COPY . .

# The canonical origin is baked in, because it appears in metadata and
# structured data that are rendered at build time as well as at run time.
ARG NEXT_PUBLIC_SITE_ORIGIN=http://localhost:3000
ENV NEXT_PUBLIC_SITE_ORIGIN=${NEXT_PUBLIC_SITE_ORIGIN}

RUN npm run build && node scripts/check-bundle.mjs


FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 app \
    && adduser --system --uid 1001 --ingroup app app

# Public assets and the static build output are served by the standalone
# server but are not part of its bundle, so they are copied separately.
COPY --from=builder --chown=app:app /build/public ./public
COPY --from=builder --chown=app:app /build/.next/standalone ./
COPY --from=builder --chown=app:app /build/.next/static ./.next/static

USER app

EXPOSE 3000

# Checks this container, not the whole stack. Reaching through to the API would
# report the frontend as unhealthy on a first deployment, before the database
# has been migrated, which is both wrong and the point at which someone is most
# likely to be misled by it. The manifest is served by this process alone.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000/manifest.webmanifest',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
