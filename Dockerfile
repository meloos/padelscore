# ── Stage 1: install dependencies (with native build tools) ──────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: build Next.js ────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# AUTH_SECRET and ADMIN_EMAIL must be supplied at runtime, e.g.:
#   docker run -e AUTH_SECRET=... -e ADMIN_EMAIL=...

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Next.js standalone bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

# Drizzle migration files (instrumentation.ts applies them on startup)
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

# better-sqlite3 native .node file must travel with the standalone bundle.
# Next.js copies serverExternalPackages into .next/standalone/node_modules,
# but the prebuilt binary lives one level up — copy it explicitly.
COPY --from=builder --chown=nextjs:nodejs \
  /app/node_modules/better-sqlite3 \
  ./node_modules/better-sqlite3

# Persistent SQLite data directory
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
VOLUME ["/app/data"]
ENV DATABASE_URL=/app/data/padelscore.db

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
