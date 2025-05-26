# Halogen Sudo API

A Python FastAPI service that handles privileged operations for the Halogen project, including Nginx configuration management and SSL certificate generation.

## Overview

This API solves the sudo permission issues experienced by the Node.js backend when trying to create and manage Nginx configurations, generate and manage SSL certificates, and handle system-level operations that require elevated privileges.

## Features

- Nginx Configuration Management
- SSL Certificate Management
- Domain Setup
- Health monitoring

## Installation

1. **Install Python Dependencies**
   ```bash
   cd sudo-apis
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Install System Dependencies**
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx
   ```

3. **Setup Directories**
   ```bash
   sudo mkdir -p /home/msuser/nginx-configs
   sudo mkdir -p /home/msuser/nginx-templates
   sudo mkdir -p /var/www/certbot/.well-known/acme-challenge
   sudo chown -R www-data:www-data /var/www/certbot
   sudo chmod -R 755 /var/www/certbot
   ```

## Running the API

### Manual Start
```bash
cd sudo-apis
source venv/bin/activate
python main.py
```

### Using the Startup Script
```bash
cd sudo-apis
chmod +x start.sh
./start.sh
```

### Production Deployment
```bash
uvicorn main:app --host 0.0.0.0 --port 8082 --workers 4
```

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health check with system status

### Nginx Management
- `POST /nginx/deploy` - Deploy Nginx configuration
- `POST /nginx/remove` - Remove Nginx configuration
- `GET /nginx/status/{domain}` - Get Nginx configuration status

### SSL Certificate Management
- `POST /ssl/generate` - Generate SSL certificate
- `POST /ssl/renew` - Renew SSL certificate
- `GET /ssl/status/{domain}` - Get SSL certificate status
- `POST /ssl/remove` - Remove SSL certificate

### Domain Setup
- `POST /domain/setup` - Complete domain setup (Nginx + SSL)

## Request Examples

### Deploy Nginx Configuration
```bash
curl -X POST "http://localhost:8082/nginx/deploy" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "project_id": "proj_123",
    "ssl_enabled": false
  }'
```

### Generate SSL Certificate
```bash
curl -X POST "http://localhost:8082/ssl/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "project_id": "proj_123",
    "email": "admin@example.com"
  }'
```

### Complete Domain Setup
```bash
curl -X POST "http://localhost:8082/domain/setup" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "project_id": "proj_123",
    "ssl_enabled": true,
    "email": "admin@example.com"
  }'
```

## Security Considerations

The API requires specific sudo permissions for Nginx configuration management and SSL certificate generation with Certbot. Run this API on a secure network or use authentication middleware. Configure CORS origins appropriately for your domain.

## Integration with Node.js Backend

The Node.js backend should make HTTP requests to this API instead of executing shell commands directly. This eliminates the sudo permission issues and provides better error handling.

## Dependencies

- FastAPI 0.104.1
- uvicorn 0.24.0
- pydantic 2.5.0
- aiofiles 23.2.1
- cryptography 41.0.8
- certbot 2.7.4
- certbot-nginx 2.7.4
