# ===========================================
# HRSmart Frontend - Production Dockerfile
# Multi-stage build: Node for build, Nginx for serve
# ===========================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for environment variables
ARG VITE_GRAPHQL_URL=https://test.hrsmart.co/graphql
ARG VITE_WS_URL=wss://test.hrsmart.co/graphql

# Set environment variables for build
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL \
    VITE_WS_URL=$VITE_WS_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

