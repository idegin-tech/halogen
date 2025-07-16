FROM node:18-alpine AS base

RUN apk update && apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

WORKDIR /app

FROM base AS deps

COPY package*.json ./
COPY turbo.json ./
COPY packages/common/package.json ./packages/common/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/backend/package.json ./apps/backend/

RUN npm ci --only=production && npm cache clean --force

FROM base AS build

COPY package*.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

RUN npm ci

RUN npm run build --workspace=apps/backend

FROM base AS runtime

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/packages ./packages
COPY --from=build --chown=nextjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=build --chown=nextjs:nodejs /app/apps/backend/package.json ./apps/backend/

USER nextjs

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

WORKDIR /app/apps/backend

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
