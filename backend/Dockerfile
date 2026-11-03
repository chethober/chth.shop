# Build from the repo root: docker build -f backend/Dockerfile .

FROM node:26-bookworm-slim AS base
# Prisma's query engine needs OpenSSL.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
# Install only the backend's dependencies, pinned to the versions in the root yarn.lock.
COPY yarn.lock ./
COPY backend/package.json ./
RUN yarn install --production --network-timeout 600000 && yarn cache clean
COPY backend/prisma ./prisma
RUN npx prisma generate

FROM base AS runner
ENV NODE_ENV=production \
  PORT=5000
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./
RUN mkdir -p public/uploads && chown -R node:node public/uploads
USER node
EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Upgrade data from older schemas, sync the schema (the repo doesn't track migrations), then start the API.
CMD ["sh", "-c", "npx prisma db execute --file prisma/upgrade.sql --schema prisma/schema.prisma && npx prisma db push --skip-generate && exec node server.js"]
