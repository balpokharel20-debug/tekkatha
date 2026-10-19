FROM node:22-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY admin/package.json admin/package.json
RUN npm ci --workspace=@tekkatha/admin --include-workspace-root=false

COPY admin ./admin
COPY shared ./shared
ARG VITE_API_BASE=/api
ARG VITE_WEBSITE_URL
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_WEBSITE_URL=$VITE_WEBSITE_URL
RUN npm run build --workspace=@tekkatha/admin

FROM nginx:stable-alpine
COPY deploy/nginx/cms.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/admin/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
