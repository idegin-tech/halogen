#!/bin/bash

# Test SSL Setup Script
# This script tests the SSL certificate generation setup

set -e

DOMAIN=${1:-"test.example.com"}
WEBROOT_DIR="/var/www/certbot"
LOG_PREFIX="[SSL_TEST]"

echo "$LOG_PREFIX Testing SSL setup for domain: $DOMAIN"

# Function to log with timestamp
log_info() {
    echo "$LOG_PREFIX $(date '+%Y-%m-%d %H:%M:%S') INFO: $1"
}

log_error() {
    echo "$LOG_PREFIX $(date '+%Y-%m-%d %H:%M:%S') ERROR: $1"
}

log_warn() {
    echo "$LOG_PREFIX $(date '+%Y-%m-%d %H:%M:%S') WARN: $1"
}

# Test 1: Check if webroot directory exists
log_info "Test 1: Checking webroot directory"
if [ -d "$WEBROOT_DIR" ]; then
    log_info "✓ Webroot directory exists: $WEBROOT_DIR"
    
    # Check permissions
    WEBROOT_PERMS=$(stat -c %a "$WEBROOT_DIR" 2>/dev/null || echo "unknown")
    log_info "Webroot permissions: $WEBROOT_PERMS"
    
    # Check owner
    WEBROOT_OWNER=$(stat -c %U:%G "$WEBROOT_DIR" 2>/dev/null || echo "unknown")
    log_info "Webroot owner: $WEBROOT_OWNER"
else
    log_error "✗ Webroot directory does not exist: $WEBROOT_DIR"
    log_info "Creating webroot directory..."
    
    sudo mkdir -p "$WEBROOT_DIR/.well-known/acme-challenge"
    sudo chown -R www-data:www-data "$WEBROOT_DIR"
    sudo chmod -R 755 "$WEBROOT_DIR"
    
    if [ -d "$WEBROOT_DIR" ]; then
        log_info "✓ Webroot directory created successfully"
    else
        log_error "✗ Failed to create webroot directory"
        exit 1
    fi
fi

# Test 2: Check if we can write to webroot
log_info "Test 2: Testing webroot write permissions"
TEST_FILE="$WEBROOT_DIR/.well-known/acme-challenge/test-$(date +%s)"

if sudo touch "$TEST_FILE" && sudo chmod 644 "$TEST_FILE"; then
    log_info "✓ Can write to webroot directory"
    sudo rm -f "$TEST_FILE"
else
    log_error "✗ Cannot write to webroot directory"
    exit 1
fi

# Test 3: Check Certbot availability
log_info "Test 3: Checking Certbot availability"
if command -v certbot >/dev/null 2>&1; then
    CERTBOT_VERSION=$(certbot --version 2>&1 | head -n1)
    log_info "✓ Certbot is available: $CERTBOT_VERSION"
else
    log_error "✗ Certbot is not available"
    exit 1
fi

# Test 4: Check Nginx configuration directory
log_info "Test 4: Checking Nginx configuration directories"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

if [ -d "$NGINX_SITES_AVAILABLE" ] && [ -d "$NGINX_SITES_ENABLED" ]; then
    log_info "✓ Nginx configuration directories exist"
else
    log_error "✗ Nginx configuration directories missing"
    log_error "Expected: $NGINX_SITES_AVAILABLE and $NGINX_SITES_ENABLED"
    exit 1
fi

# Test 5: Check Nginx configuration syntax
log_info "Test 5: Testing Nginx configuration syntax"
if sudo nginx -t >/dev/null 2>&1; then
    log_info "✓ Nginx configuration syntax is valid"
else
    log_warn "⚠ Nginx configuration syntax errors detected"
    sudo nginx -t
fi

# Test 6: Simulate ACME challenge file creation
log_info "Test 6: Simulating ACME challenge file creation"
CHALLENGE_DIR="$WEBROOT_DIR/.well-known/acme-challenge"
CHALLENGE_FILE="$CHALLENGE_DIR/test-challenge-$(date +%s)"
CHALLENGE_CONTENT="test-challenge-response-$(date +%s)"

if sudo mkdir -p "$CHALLENGE_DIR" && echo "$CHALLENGE_CONTENT" | sudo tee "$CHALLENGE_FILE" >/dev/null; then
    if [ -f "$CHALLENGE_FILE" ] && [ "$(sudo cat "$CHALLENGE_FILE")" = "$CHALLENGE_CONTENT" ]; then
        log_info "✓ ACME challenge file simulation successful"
        sudo rm -f "$CHALLENGE_FILE"
    else
        log_error "✗ ACME challenge file content verification failed"
        exit 1
    fi
else
    log_error "✗ Failed to create ACME challenge file"
    exit 1
fi

# Test 7: Check domain resolution (if not a test domain)
if [[ "$DOMAIN" != "test.example.com" ]] && [[ "$DOMAIN" != *.test ]] && [[ "$DOMAIN" != *.local ]]; then
    log_info "Test 7: Checking domain resolution for $DOMAIN"
    if dig +short "$DOMAIN" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' >/dev/null; then
        RESOLVED_IPS=$(dig +short "$DOMAIN" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | tr '\n' ' ')
        log_info "✓ Domain resolves to: $RESOLVED_IPS"
    else
        log_warn "⚠ Domain $DOMAIN does not resolve to any IP addresses"
    fi
else
    log_info "Test 7: Skipping domain resolution test for test domain"
fi

log_info "SSL setup test completed successfully!"
log_info "The system is ready for SSL certificate generation using the webroot method."

exit 0
