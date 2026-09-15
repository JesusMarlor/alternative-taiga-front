# Stage 1: Build application with Node 22 & pnpm
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm support
RUN corepack enable

# Copy dependency manifests
COPY package.json pnpm-lock.yaml .npmrc ./

# Install dependencies cleanly using lockfile
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build-time arguments (can be overridden with --build-arg)
ARG VITE_API_BASE_URL=""
ARG VITE_EVENTS_URL=""
ARG VITE_DEFAULT_APP_TITLE=""
ARG VITE_DEFAULT_COMPANY_NAME=""

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_EVENTS_URL=$VITE_EVENTS_URL
ENV VITE_DEFAULT_APP_TITLE=$VITE_DEFAULT_APP_TITLE
ENV VITE_DEFAULT_COMPANY_NAME=$VITE_DEFAULT_COMPANY_NAME

# Build the production bundle
RUN pnpm build

# Stage 2: Serve static files with lightweight Nginx
FROM nginx:alpine AS runner

# Replace default Nginx configuration with SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy dynamic runtime environment entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# Dynamic entrypoint injects runtime variables (from docker run -e or --env-file)
ENTRYPOINT ["/docker-entrypoint.sh"]

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
