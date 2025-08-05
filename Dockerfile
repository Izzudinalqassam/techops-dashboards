# Multi-stage build for production optimization
FROM node:20-alpine AS frontend-builder

# Set working directory for frontend build
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY eslint.config.js ./
COPY index.html ./

# Copy environment files for production build
COPY .env.production ./.env

# Install all dependencies (including dev dependencies for build)
RUN npm ci --ignore-scripts

# Copy frontend source code
COPY src/ ./src/

# Build frontend
RUN npm run build:frontend

# Backend stage
FROM node:20-alpine AS backend-builder

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Final production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

# Copy backend from backend-builder stage
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend ./backend

# Copy package.json and start script
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs start.sh ./
RUN chmod +x start.sh

# Install all dependencies (including dev dependencies like concurrently)
RUN npm install

# Create logs directory
RUN mkdir -p backend/logs && chown -R nodejs:nodejs backend/logs

# Switch to non-root user
USER nodejs

# Add node_modules/.bin to PATH for the nodejs user
ENV PATH="/app/node_modules/.bin:$PATH"

# Expose ports
EXPOSE 3001 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Use shell script to start both services
CMD ["./start.sh"]