# Build from the repo root: docker build -f frontend/Dockerfile .

FROM node:22-bookworm-slim AS builder
WORKDIR /app
# Install the whole workspace from the root lockfile (shared deps are hoisted to the root).
COPY package.json yarn.lock ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN yarn install --frozen-lockfile --ignore-scripts --network-timeout 600000
COPY frontend/ frontend/

# Rewrites in next.config.js are resolved at build time, so the backend address is a build arg.
ARG BACKEND_URL=http://backend:5000
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_TELEGRAM_MINI_APP_LINK
ENV BACKEND_URL=${BACKEND_URL} \
  NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
  NEXT_PUBLIC_TELEGRAM_MINI_APP_LINK=${NEXT_PUBLIC_TELEGRAM_MINI_APP_LINK} \
  NEXT_STANDALONE=true \
  NEXT_TELEMETRY_DISABLED=1
RUN yarn --cwd frontend build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  HOSTNAME=0.0.0.0 \
  PORT=3000
COPY --from=builder --chown=node:node /app/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=node:node /app/frontend/public ./frontend/public
USER node
EXPOSE 3000
CMD ["node", "frontend/server.js"]
