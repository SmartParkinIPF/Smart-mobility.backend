# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies first (better caching)
COPY smart-city-backend/package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY smart-city-backend/tsconfig.json ./
COPY smart-city-backend/src ./src
# Compile TypeScript to dist
RUN npx tsc -p .

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY smart-city-backend/package*.json ./
# Install production deps only
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

EXPOSE 4001
CMD ["node", "dist/server.js"]

