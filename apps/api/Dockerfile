# ---------- Base image with pnpm ----------
FROM node:20-alpine AS base
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# ---------- Builder (installs dev deps and builds the monorepo) ----------
FROM base AS builder
WORKDIR /app

# Copy workspace manifests first (better layer cache)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install all deps (including dev) and build only the API
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api build

# ---------- Runner (thin) ----------
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy only what's needed to run API
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Cloud Run will provide PORT. Expose is optional.
EXPOSE 8080
CMD ["node", "apps/api/dist/main.js"]


