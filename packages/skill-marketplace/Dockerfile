FROM node:20-alpine AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/skill-marketplace/package.json ./packages/skill-marketplace/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY packages/skill-marketplace/ ./packages/skill-marketplace/
RUN pnpm --filter @archon/skill-marketplace run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/packages/skill-marketplace/dist ./dist
COPY --from=build /app/node_modules/.pnpm ./node_modules/.pnpm
EXPOSE 8080
CMD ["node", "dist/index.js"]
