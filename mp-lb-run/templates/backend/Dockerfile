FROM node:22-slim AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages
RUN corepack enable && pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm turbo run build --filter={{BACKEND_PACKAGE}}

FROM base AS runner
COPY --from=build /app ./
EXPOSE {{BACKEND_PORT}}
CMD ["pnpm", "--filter={{BACKEND_PACKAGE}}", "start"]

