# Multi-stage Dockerfile for Halogen project
# Runs all services on a single machine: MongoDB, Redis, Nginx, Backend, Frontend, WWW, Sudo-APIs

FROM node:18-alpine AS base
RUN apk update && apk add --no-cache python3 py3-pip bash curl git

# Install turbo globally
RUN npm install -g turbo

#################################
# Dependencies stage
#################################
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY turbo.json ./

# Create package directories first
RUN mkdir -p apps/backend apps/frontend apps/www packages/common packages/eslint-config packages/typescript-config packages/ui

# Copy package files for all workspaces
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/www/package.json ./apps/www/
COPY packages/common/package.json ./packages/common/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN npm install

#################################
# Builder stage
#################################
FROM base AS builder
WORKDIR /app

# Copy source code and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build all applications
RUN npm run build

#################################
# Production stage
#################################
FROM ubuntu:22.04 AS production

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    lsb-release \
    software-properties-common \
    supervisor \
    nginx \
    redis-server \
    python3 \
    python3-pip \
    python3-venv \
    certbot \
    python3-certbot-nginx \
    && rm -rf /var/lib/apt/lists/*

# Install MongoDB
RUN wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add - \
    && echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update \
    && apt-get install -y mongodb-org \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install PM2 globally
RUN npm install -g pm2

# Create application directory
WORKDIR /app

# Copy Node.js applications from builder
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/turbo.json ./

# Setup Python Sudo API
WORKDIR /app/sudo-apis
COPY sudo-apis/ ./

# Create Python virtual environment and install dependencies
RUN python3 -m venv venv \
    && . venv/bin/activate \
    && pip install --upgrade pip \
    && pip install -r requirements.txt

# Create necessary directories
RUN mkdir -p /home/msuser/nginx-configs \
    && mkdir -p /home/msuser/nginx-templates \
    && mkdir -p /var/www/certbot/.well-known/acme-challenge \
    && mkdir -p /data/db \
    && mkdir -p /app/logs \
    && mkdir -p /var/log/supervisor

# Setup MongoDB data directory
RUN chown -R mongodb:mongodb /data/db

# Configure Nginx
COPY <<EOF /etc/nginx/sites-available/default
# Default Nginx configuration for Halogen
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8081/health;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API routes to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend routes (admin/dashboard)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Well-known directory for ACME challenges
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
EOF

# Configure Supervisor
COPY <<EOF /etc/supervisor/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:mongodb]
command=mongod --dbpath /data/db --bind_ip_all --port 27017
user=mongodb
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/mongodb.err.log
stdout_logfile=/var/log/supervisor/mongodb.out.log
priority=100

[program:redis]
command=redis-server --bind 127.0.0.1 --port 6379
user=redis
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/redis.err.log
stdout_logfile=/var/log/supervisor/redis.out.log
priority=200

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/nginx.err.log
stdout_logfile=/var/log/supervisor/nginx.out.log
priority=300

[program:backend]
command=node /app/apps/backend/dist/index.js
directory=/app
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/backend.err.log
stdout_logfile=/var/log/supervisor/backend.out.log
priority=400
environment=NODE_ENV=production,PORT=8081

[program:frontend]
command=npm start
directory=/app/apps/frontend
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/frontend.err.log
stdout_logfile=/var/log/supervisor/frontend.out.log
priority=500
environment=NODE_ENV=production,PORT=3000

[program:www]
command=npm run start
directory=/app/apps/www
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/www.err.log
stdout_logfile=/var/log/supervisor/www.out.log
priority=600
environment=NODE_ENV=production,PORT=3001

[program:sudo-api]
command=/app/sudo-apis/venv/bin/python main.py
directory=/app/sudo-apis
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/sudo-api.err.log
stdout_logfile=/var/log/supervisor/sudo-api.out.log
priority=700
environment=API_HOST=0.0.0.0,API_PORT=8082,NODE_ENV=production
EOF

# Create startup script
COPY <<EOF /app/start.sh
#!/bin/bash
set -e

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to start..."
until mongosh --eval "print('MongoDB is ready')" > /dev/null 2>&1; do
  echo "MongoDB is unavailable - sleeping"
  sleep 2
done

echo "MongoDB is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis to start..."
until redis-cli ping > /dev/null 2>&1; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done

echo "Redis is ready!"

# Start supervisor
exec supervisord -c /etc/supervisor/supervisord.conf
EOF

RUN chmod +x /app/start.sh

# Expose port 80 for Nginx
EXPOSE 80

# Set working directory
WORKDIR /app

# Start all services
CMD ["/app/start.sh"]
