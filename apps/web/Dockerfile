# ---------- Base with pnpm ----------
FROM node:20-alpine AS base
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# ---------- Builder ----------
FROM base AS builder
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
RUN pnpm --filter web build

# ---------- Runner (Next standalone) ----------
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Next standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

WORKDIR /app/apps/web
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]


