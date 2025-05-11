# Base Node.js image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install pnpm (assuming you're using it based on Turbo best practices)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace files needed for install
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY packages/common/package.json ./packages/common/package.json
COPY apps/backend/package.json ./apps/backend/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the project
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm run build --filter=backend...

# Production image, copy all the files and run node
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy needed files from builder
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

# Expose the port the app runs on
EXPOSE 8080

# Command to run the app
CMD ["node", "apps/backend/dist/index.js"]
