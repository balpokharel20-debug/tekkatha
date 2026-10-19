FROM node:22-alpine AS frontend-build

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY admin/package.json admin/package.json
RUN npm ci --workspace=@tekkatha/frontend --include-workspace-root=false

COPY frontend ./frontend
COPY shared ./shared
ARG VITE_ADMIN_URL
ENV VITE_API_BASE=/api
ENV VITE_ADMIN_URL=$VITE_ADMIN_URL
RUN npm run build --workspace=@tekkatha/frontend

FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY admin/package.json admin/package.json
RUN npm ci --omit=dev --workspace=@tekkatha/backend --include-workspace-root=false \
  && npm cache clean --force

COPY backend/src ./backend/src
COPY backend/scripts/production-setup.js ./backend/scripts/production-setup.js
COPY shared ./shared
COPY --from=frontend-build /workspace/frontend/dist ./frontend/dist
RUN chown -R node:node /app

USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "backend/src/server.js"]
