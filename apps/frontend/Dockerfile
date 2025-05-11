# Base Node.js image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace files needed for install
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY packages/common/package.json ./packages/common/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=https://halogen-backend.fly.dev
ENV NEXT_TELEMETRY_DISABLED 1

# Build the project
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm run build --filter=frontend...

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy necessary files
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static

# Set the correct permission for prerender cache
RUN mkdir -p apps/frontend/.next/cache
RUN chown -R nextjs:nodejs apps/frontend/.next/cache

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Command to run the app
CMD ["node", "apps/frontend/server.js"]
