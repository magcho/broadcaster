# syntax=docker/dockerfile:1.7-labs
FROM node:26.4.0-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="/pnpm:$PATH"

RUN npm install -g pnpm@11.23.0

RUN node -v

FROM base AS builder
WORKDIR /app

COPY --parents pnpm-workspace.yaml pnpm-lock.yaml **/package.json ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install -F broadcaster-admin... --frozen-lockfile

COPY . .

RUN pnpm -F broadcaster-admin build
RUN pnpm -F broadcaster-admin deploy --prod ./prod

FROM gcr.io/distroless/nodejs26-debian13:nonroot AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

COPY --from=builder --chown=nodejs:nodejs /app/prod/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prod/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prod/.output      ./.output

CMD [".output/server/index.mjs"]
