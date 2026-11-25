# Multi-stage production Dockerfile for Sketchly

FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and workspace manifests
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies
RUN npm ci

# Copy source trees
COPY server ./server
COPY client ./client

# Build server and client
RUN npm run build

# --- Production Runner Stage ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy root manifests
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled outputs
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001

CMD ["node", "server/dist/server.js"]

