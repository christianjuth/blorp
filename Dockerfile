# ─── Build stage ─────────────────────────────
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

# Enable Yarn Berry
RUN corepack enable && corepack prepare yarn@stable --activate

# Install deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install --immutable --frozen-lockfile

# Build app (injecting any REACT_APP_* build-args)
COPY . .
ARG REACT_APP_NAME
ARG REACT_APP_DEFAULT_INSTANCE
ARG REACT_APP_LOCK_TO_DEFAULT_INSTANCE
ENV \
  REACT_APP_NAME=$REACT_APP_NAME \
  REACT_APP_DEFAULT_INSTANCE=$REACT_APP_DEFAULT_INSTANCE \
  REACT_APP_LOCK_TO_DEFAULT_INSTANCE=$REACT_APP_LOCK_TO_DEFAULT_INSTANCE
RUN yarn build \
 && rm -rf dist/*.map

# ─── Runtime stage ───────────────────────────
FROM nginx:alpine AS runtime

# Embed nginx config with a HEREDOC
RUN printf '%s\n' \
  'server {' \
  '    listen       80;' \
  '    server_name  _;' \
  '' \
  '    root   /usr/share/nginx/html;' \
  '    index  index.html;' \
  '' \
  '    location / {' \
  '        try_files $uri $uri/ /index.html;' \
  '    }' \
  '' \
  '    location ~* \.(?:js|css|png|jpg|jpeg|gif|svg|ico)$ {' \
  '        expires 1y;' \
  '        add_header Cache-Control "public, immutable";' \
  '    }' \
  '' \
  '    error_page  500 502 503 504  /50x.html;' \
  '    location = /50x.html {' \
  '        root   /usr/share/nginx/html;' \
  '    }' \
  '}' \
> /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
