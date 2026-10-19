FROM node:22-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY admin/package.json admin/package.json
RUN npm ci --workspace=@tekkatha/frontend --include-workspace-root=false

COPY frontend ./frontend
COPY shared ./shared
ARG VITE_API_BASE=/api
ARG VITE_ADMIN_URL
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_ADMIN_URL=$VITE_ADMIN_URL
RUN npm run build --workspace=@tekkatha/frontend

FROM nginx:stable-alpine
COPY deploy/nginx/site.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
