#!/bin/bash

# Update sudoers file to add missing NOPASSWD commands
# Run this script with sudo on your production server

SUDOERS_FILE="/etc/sudoers.d/msuser"

echo "Updating sudoers file: $SUDOERS_FILE"

# Backup existing file
if [ -f "$SUDOERS_FILE" ]; then
    cp "$SUDOERS_FILE" "${SUDOERS_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Created backup of existing sudoers file"
fi

# Create the complete sudoers configuration
cat > "$SUDOERS_FILE" << 'EOF'
# Halogen domain management - NOPASSWD commands for msuser
# Nginx configuration management
msuser ALL=(ALL) NOPASSWD: /bin/cp /home/msuser/nginx-configs/* /etc/nginx/sites-available/
msuser ALL=(ALL) NOPASSWD: /bin/ln -s /etc/nginx/sites-available/* /etc/nginx/sites-enabled/
msuser ALL=(ALL) NOPASSWD: /bin/rm /etc/nginx/sites-enabled/*
msuser ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
msuser ALL=(ALL) NOPASSWD: /usr/sbin/nginx -s reload

# Certbot SSL certificate management
msuser ALL=(ALL) NOPASSWD: /usr/bin/certbot

# Webroot directory management for SSL challenges
msuser ALL=(ALL) NOPASSWD: /bin/mkdir -p /var/www/certbot
msuser ALL=(ALL) NOPASSWD: /bin/mkdir -p /var/www/certbot*
msuser ALL=(ALL) NOPASSWD: /bin/mkdir -p /var/www/certbot/.well-known/acme-challenge
msuser ALL=(ALL) NOPASSWD: /bin/chown -R www-data\:www-data /var/www/certbot
msuser ALL=(ALL) NOPASSWD: /bin/chown -R www-data\:www-data /var/www/certbot*
msuser ALL=(ALL) NOPASSWD: /bin/chmod -R 755 /var/www/certbot
msuser ALL=(ALL) NOPASSWD: /bin/chmod -R 755 /var/www/certbot*
msuser ALL=(ALL) NOPASSWD: /bin/chmod 644 /var/www/certbot/.well-known/acme-challenge/*
msuser ALL=(ALL) NOPASSWD: /bin/chmod * /var/www/certbot*

# File operations for SSL challenges
msuser ALL=(ALL) NOPASSWD: /bin/echo * | /usr/bin/tee /var/www/certbot/.well-known/acme-challenge/*
msuser ALL=(ALL) NOPASSWD: /bin/echo * | /usr/bin/tee /var/www/certbot*
msuser ALL=(ALL) NOPASSWD: /usr/bin/tee /var/www/certbot/.well-known/acme-challenge/*
msuser ALL=(ALL) NOPASSWD: /bin/rm -f /var/www/certbot/.well-known/acme-challenge/*
msuser ALL=(ALL) NOPASSWD: /bin/rm -f /var/www/certbot*

# System status checks
msuser ALL=(ALL) NOPASSWD: /bin/systemctl is-active --quiet nginx
msuser ALL=(ALL) NOPASSWD: /bin/systemctl status nginx
msuser ALL=(ALL) NOPASSWD: /bin/ls -la /etc/nginx/sites-enabled/

# SSL certificate utilities
msuser ALL=(ALL) NOPASSWD: /usr/bin/test -f *
msuser ALL=(ALL) NOPASSWD: /usr/bin/openssl x509 -in * -noout -dates
EOF

# Set proper permissions
chmod 440 "$SUDOERS_FILE"

# Test the sudoers configuration
if visudo -cf "$SUDOERS_FILE"; then
    echo "✅ Sudoers configuration updated successfully"
    echo "The following commands are now allowed for user 'msuser' without password:"
    echo "- Nginx configuration management"
    echo "- SSL certificate generation with Certbot"
    echo "- Webroot directory management"
    echo "- System status checks"
else
    echo "❌ Error in sudoers configuration. Restoring backup..."
    if [ -f "${SUDOERS_FILE}.backup."* ]; then
        cp "${SUDOERS_FILE}.backup."* "$SUDOERS_FILE"
        echo "Backup restored. Please check the configuration manually."
    fi
    exit 1
fi

echo ""
echo "You can now restart your Halogen backend service to use the updated permissions."
