#!/bin/bash

# Halogen Sudo API Startup Script
# This script sets up and runs the Python FastAPI server for privileged operations

set -e

echo "Starting Halogen Sudo API..."

# Detect OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    echo "Detected Windows environment"
    PYTHON_CMD="python"
    PIP_CMD="pip"
    VENV_ACTIVATE="venv/Scripts/activate"
else
    echo "Detected Unix-like environment"
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
    VENV_ACTIVATE="venv/bin/activate"
fi

# Check if Python is installed
if ! command -v $PYTHON_CMD &> /dev/null; then
    echo "Error: Python is not installed or not in PATH"
    exit 1
fi

# Check if pip is installed
if ! command -v $PIP_CMD &> /dev/null; then
    echo "Error: pip is not installed or not in PATH"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    source $VENV_ACTIVATE
else
    source $VENV_ACTIVATE
fi

# Install dependencies
echo "Installing dependencies..."
$PIP_CMD install -r requirements.txt

# Check if running in a Unix-like environment for sudo checks
if [[ ! "$OSTYPE" == "msys" && ! "$OSTYPE" == "cygwin" && ! "$OSTYPE" == "win32" ]]; then
    # Check if running as root or with sudo capabilities
    if [ "$EUID" -eq 0 ]; then
        echo "Running as root user"
    elif sudo -n true 2>/dev/null; then
        echo "User has sudo capabilities"
        
        # Create required directories on Unix systems
        echo "Creating required directories..."
        sudo mkdir -p /home/msuser/nginx-configs
        sudo mkdir -p /home/msuser/nginx-templates
        sudo mkdir -p /var/www/certbot/.well-known/acme-challenge
        sudo chown -R www-data:www-data /var/www/certbot 2>/dev/null || echo "Note: Could not set www-data ownership (may not exist)"
        sudo chmod -R 755 /var/www/certbot
    else
        echo "Warning: This API requires sudo capabilities for Nginx and SSL operations"
        echo "Make sure the user has the necessary sudo permissions configured"
    fi
else
    echo "Running on Windows - skipping sudo-related setup"
    echo "Note: Some features may not work on Windows without WSL"
fi

# Start the API server
echo "Starting Halogen Sudo API on port 8082..."
$PYTHON_CMD main.py
