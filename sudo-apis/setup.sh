#!/bin/bash
# Install Python dependencies for sudo-apis using a virtual environment

# Navigate to sudo-apis directory
cd "$(dirname "$0")" || exit

# Detect OS for appropriate commands
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    VENV_CMD="python -m venv"
    VENV_ACTIVATE="venv/Scripts/activate"
    PYTHON_CMD="python"
    PIP_CMD="pip"
else
    VENV_CMD="python3 -m venv"
    VENV_ACTIVATE="venv/bin/activate"
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
fi

# Make sure python is available
if ! command -v $PYTHON_CMD &> /dev/null; then
    echo "Error: python is not installed. Please install Python 3."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    $VENV_CMD venv
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source "$VENV_ACTIVATE"

# Install dependencies
echo "Installing Python dependencies..."
$PIP_CMD install --upgrade pip
$PIP_CMD install -r requirements.txt

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
