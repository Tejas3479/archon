FROM node:20-alpine AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/gateway/package.json ./apps/gateway/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY apps/gateway/ ./apps/gateway/
RUN pnpm --filter @archon/gateway run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/apps/gateway/dist ./dist
COPY --from=build /app/node_modules/.pnpm ./node_modules/.pnpm
EXPOSE 8787
CMD ["node", "dist/index.js"]
