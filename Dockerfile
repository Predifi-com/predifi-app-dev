# Predifi Frontend Dockerfile
FROM node:20.20.2-bookworm-slim AS build
WORKDIR /app
# Native dependencies (for example @trezor/transport's USB binding) compile
# during npm ci. Keep the build toolchain explicit so clean CI images do not
# depend on packages that happened to exist on a developer workstation.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ pkg-config libudev-dev \
    && rm -rf /var/lib/apt/lists/*
# Copy dependency manifests
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
# Copy source
COPY . .
# Vite/Rollup traverses the complete wallet SDK dependency graph here. Node's
# default heap is too small for a clean amd64 container build even when the CI
# runner still has several GiB available, so raise only this build process's
# heap ceiling. The runtime image below does not inherit this setting.
RUN NODE_OPTIONS=--max-old-space-size=4096 npm run build

FROM node:20.20.2-bookworm-slim AS runtime
WORKDIR /app
# Install a lightweight static file server
RUN npm install -g serve@14.2.1
# Copy build output only
COPY --from=build /app/dist ./dist
# Cloud Run / typical container platforms provide PORT env var
ENV PORT=8080
EXPOSE 8080
# Serve the compiled Vite app; -s enables single-page routing fallback
CMD ["serve", "-s", "dist", "-l", "${PORT}"]
