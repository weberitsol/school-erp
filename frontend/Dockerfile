# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Increase file descriptor limits for webpack/next.js
RUN ulimit -n 65536

# Install dependencies
COPY package*.json ./
RUN npm ci --prefer-offline

# Copy source code
COPY . .

# Build Next.js application
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Expose port
EXPOSE 3000

# Default command (can be overridden in docker-compose)
CMD ["npm", "start"]
