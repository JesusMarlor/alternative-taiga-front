#!/bin/sh
set -e

# Generate env-config.js dynamically at container startup
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  TAIGA_URL: "${TAIGA_URL}",
  TAIGA_WEBSOCKETS_URL: "${TAIGA_WEBSOCKETS_URL}",
  TAIGA_SUBPATH: "${TAIGA_SUBPATH}",
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_EVENTS_URL: "${VITE_EVENTS_URL}",
  VITE_DEFAULT_APP_TITLE: "${VITE_DEFAULT_APP_TITLE:-planning}",
  VITE_DEFAULT_COMPANY_NAME: "${VITE_DEFAULT_COMPANY_NAME:-}"
};
EOF


echo "[Docker Entrypoint] Dynamic runtime environment configured in /usr/share/nginx/html/env-config.js"

exec "$@"
