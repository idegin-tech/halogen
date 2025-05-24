#!/bin/bash
#
# Domain Management Script for Halogen
# This script handles domain configuration, Nginx setup, and SSL certificate generation
# It should be placed in /usr/local/bin/halogen-scripts and made executable
#
# Usage: 
#   ./setup-domain.sh -d domain.com -p project-id [-c] [-r]
#
# Options:
#   -d  Domain name
#   -p  Project ID
#   -c  Configure Nginx only (don't generate SSL)
#   -r  Renew certificate for domain
#   -v  Verbose output
#   -h  Show help

set -e

# Default values
DOMAIN=""
PROJECT_ID=""
CONFIGURE_ONLY=false
RENEW_CERT=false
VERBOSE=false
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
CERTBOT_WEBROOT="/var/www/certbot"
NGINX_TEMPLATES_DIR="/home/msuser/nginx-templates"
NGINX_CONFIG_DIR="/home/msuser/nginx-configs"
ACME_DIR="/home/msuser/.letsencrypt"
ADMIN_EMAIL="admin@example.com"

# Parse arguments
while getopts "d:p:crvh" opt; do
  case $opt in
    d) DOMAIN="$OPTARG" ;;
    p) PROJECT_ID="$OPTARG" ;;
    c) CONFIGURE_ONLY=true ;;
    r) RENEW_CERT=true ;;
    v) VERBOSE=true ;;
    h)
      echo "Usage: $0 -d domain.com -p project-id [-c] [-r] [-v]"
      echo "  -d  Domain name"
      echo "  -p  Project ID"
      echo "  -c  Configure Nginx only (don't generate SSL)"
      echo "  -r  Renew certificate for domain"
      echo "  -v  Verbose output"
      echo "  -h  Show help"
      exit 0
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$DOMAIN" ]; then
  echo "Error: Domain name (-d) is required"
  exit 1
fi

if [ -z "$PROJECT_ID" ] && [ "$RENEW_CERT" = false ]; then
  echo "Error: Project ID (-p) is required unless renewing certificate"
  exit 1
fi

# Set up logging
log() {
  if [ "$VERBOSE" = true ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  fi
}

log_error() {
  echo "[ERROR] [$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
}

# Ensure required directories exist
mkdir -p "$CERTBOT_WEBROOT/.well-known/acme-challenge"
chmod -R 755 "$CERTBOT_WEBROOT"

# Generate Nginx configuration for the domain
generate_nginx_config() {
  local domain="$1"
  local project_id="$2"
  local ssl="$3"
  local config_path="$NGINX_SITES_AVAILABLE/$domain.conf"
  
  log "Generating Nginx configuration for $domain"
  
  if [ "$ssl" = true ]; then
    # SSL configuration
    cat > "$config_path" << EOL
server {
    listen 80;
    server_name $domain;
    
    location /.well-known/acme-challenge/ {
        root $CERTBOT_WEBROOT;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $domain;
    
    ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Project-ID $project_id;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Deny access to hidden files
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOL
  else
    # HTTP-only configuration (for initial setup and certificate generation)
    cat > "$config_path" << EOL
server {
    listen 80;
    server_name $domain;

    location /.well-known/acme-challenge/ {
        root $CERTBOT_WEBROOT;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Project-ID $project_id;
    }
}
EOL
  fi
  
  # Create symlink if it doesn't exist
  if [ ! -f "$NGINX_SITES_ENABLED/$domain.conf" ]; then
    ln -sf "$config_path" "$NGINX_SITES_ENABLED/$domain.conf"
    log "Created symlink for $domain"
  fi
  
  # Test Nginx configuration
  nginx -t
  
  if [ $? -eq 0 ]; then
    log "Nginx configuration is valid"
    nginx -s reload
    log "Nginx reloaded"
    return 0
  else
    log_error "Nginx configuration is invalid"
    return 1
  fi
}

# Generate SSL certificate using Certbot
generate_ssl_certificate() {
  local domain="$1"
  
  log "Generating SSL certificate for $domain"
  
  # Ensure Certbot is installed
  if ! command -v certbot &> /dev/null; then
    log_error "Certbot is not installed"
    return 1
  fi
  
  # Request certificate
  certbot certonly --webroot \
    -w "$CERTBOT_WEBROOT" \
    -d "$domain" \
    --non-interactive \
    --agree-tos \
    -m "$ADMIN_EMAIL" \
    --keep-until-expiring
  
  if [ $? -eq 0 ]; then
    log "SSL certificate generated successfully"
    return 0
  else
    log_error "Failed to generate SSL certificate"
    return 1
  fi
}

# Renew certificate using Certbot
renew_certificate() {
  local domain="$1"
  
  log "Renewing SSL certificate for $domain"
  
  # Ensure Certbot is installed
  if ! command -v certbot &> /dev/null; then
    log_error "Certbot is not installed"
    return 1
  fi
  
  # Renew certificate
  certbot renew --cert-name "$domain" --force-renewal
  
  if [ $? -eq 0 ]; then
    log "SSL certificate renewed successfully"
    return 0
  else
    log_error "Failed to renew SSL certificate"
    return 1
  fi
}

# Main process
main() {
  # Check if domain is already configured
  if [ -f "$NGINX_SITES_AVAILABLE/$DOMAIN.conf" ]; then
    log "Domain $DOMAIN is already configured in Nginx"
    DOMAIN_CONFIGURED=true
  else
    DOMAIN_CONFIGURED=false
  fi
  
  # Check if certificate already exists
  if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    log "SSL certificate for $DOMAIN already exists"
    CERT_EXISTS=true
  else
    CERT_EXISTS=false
  fi
  
  # Handle certificate renewal
  if [ "$RENEW_CERT" = true ]; then
    if [ "$CERT_EXISTS" = true ]; then
      if renew_certificate "$DOMAIN"; then
        generate_nginx_config "$DOMAIN" "$PROJECT_ID" true
        echo "Certificate for $DOMAIN renewed successfully"
      else
        log_error "Failed to renew certificate for $DOMAIN"
        exit 1
      fi
    else
      log_error "Cannot renew certificate for $DOMAIN - certificate does not exist"
      exit 1
    fi
    return
  fi
  
  # Generate Nginx configuration
  if [ "$DOMAIN_CONFIGURED" = false ]; then
    log "Configuring Nginx for $DOMAIN"
    generate_nginx_config "$DOMAIN" "$PROJECT_ID" false
  fi
  
  # Generate SSL certificate if not in configure-only mode
  if [ "$CONFIGURE_ONLY" = false ]; then
    if [ "$CERT_EXISTS" = false ]; then
      if generate_ssl_certificate "$DOMAIN"; then
        # Update Nginx config with SSL
        generate_nginx_config "$DOMAIN" "$PROJECT_ID" true
        echo "Domain $DOMAIN configured with SSL successfully"
      else
        log_error "Failed to generate SSL certificate for $DOMAIN"
        echo "Domain $DOMAIN configured without SSL"
        exit 1
      fi
    else
      # Update Nginx config with SSL
      generate_nginx_config "$DOMAIN" "$PROJECT_ID" true
      echo "Domain $DOMAIN configured with existing SSL certificate"
    fi
  else
    echo "Domain $DOMAIN configured without SSL (configure-only mode)"
  fi
}

# Run the main process
main
