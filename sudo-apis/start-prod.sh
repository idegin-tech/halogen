#!/bin/bash
# Start script for production use with PM2

# Navigate to sudo-apis directory
cd "$(dirname "$0")" || exit

# Detect OS for appropriate commands
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    VENV_ACTIVATE="venv/Scripts/activate"
    PYTHON_CMD="python"
else
    VENV_ACTIVATE="venv/bin/activate"
    PYTHON_CMD="python3"
fi

# Activate the virtual environment
if [ -d "venv" ]; then
    source "$VENV_ACTIVATE"
else
    echo "Error: Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Check for needed directories in production
if [[ ! "$OSTYPE" == "msys" && ! "$OSTYPE" == "cygwin" && ! "$OSTYPE" == "win32" ]]; then
    # Create required directories silently if we can
    mkdir -p /home/msuser/nginx-configs 2>/dev/null || true
    mkdir -p /home/msuser/nginx-templates 2>/dev/null || true
    mkdir -p /var/www/certbot/.well-known/acme-challenge 2>/dev/null || true
fi

# Execute Python script with the activated environment
exec "$PYTHON_CMD" main.py
