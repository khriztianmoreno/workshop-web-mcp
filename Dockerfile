# Workshop Gemini proxy (server/ only, not the Vite app).
# Build:  docker build -t rodada-proxy .
# Run:    docker run -p 8787:8787 -e GEMINI_API_KEY=... -e WORKSHOP_TOKEN=... rodada-proxy
# Configuration comes from environment variables (see env.example); no .env file is needed.

ARG NODE_IMAGE=node:22.23.5-alpine3.24

# --- build: bundle server/ + shared/ into one ESM file -----------------------
# npm packages stay external (--packages=external) and are installed in the runtime stage,
# so this stage needs only esbuild, pinned to the version in package-lock.json.
FROM ${NODE_IMAGE} AS build
WORKDIR /build
COPY server ./server
COPY shared ./shared
RUN npx --yes esbuild@0.28.2 server/index.ts \
      --bundle --platform=node --format=esm --target=node22 \
      --packages=external --outfile=dist/server.js

# --- deps: production dependencies only, from the lockfile ---------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force

# --- runtime ------------------------------------------------------------------
FROM ${NODE_IMAGE}
ENV NODE_ENV=production \
    PORT=8787 \
    DOTENV_CONFIG_QUIET=true
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --from=build --chown=node:node /build/dist/server.js ./dist/server.js
USER node
EXPOSE 8787
# /api/health stays public even when WORKSHOP_TOKEN is set (see server/app.ts).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/server.js"]
