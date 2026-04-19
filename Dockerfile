# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22-alpine

# -------- deps: install with frozen lockfile --------
FROM node:${NODE_VERSION} AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# -------- build: compile SSR bundle --------
FROM node:${NODE_VERSION} AS build
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# -------- runner: minimal runtime --------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Only runtime artifacts: built .output + prod node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", ".output/server/index.mjs"]
