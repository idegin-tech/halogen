#!/bin/bash
# Install Python dependencies for sudo-apis

# Navigate to sudo-apis directory
cd "$(dirname "$0")" || exit

# Make sure pip is available
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is not installed. Please install Python 3 and pip."
    exit 1
fi

# Install dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cat > .env << EOL
# Python Sudo API Environment Variables
API_HOST=0.0.0.0
API_PORT=8082
API_RELOAD=False
API_LOG_LEVEL=info

# Nginx paths
NGINX_SITES_AVAILABLE=/etc/nginx/sites-available
NGINX_SITES_ENABLED=/etc/nginx/sites-enabled
NGINX_CONFIG_DIR=/home/msuser/nginx-configs
NGINX_TEMPLATES_DIR=/home/msuser/nginx-templates

# Certbot paths
WEBROOT_DIR=/var/www/certbot
CERTBOT_LIVE_DIR=/etc/letsencrypt/live
DEFAULT_EMAIL=admin@example.com

# CORS configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,https://mortarstudio.site,https://*.mortarstudio.site
EOL
fi

echo "Setup complete!"
