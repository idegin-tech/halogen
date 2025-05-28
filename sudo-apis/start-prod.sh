#!/bin/bash

cd "$(dirname "$0")" || exit

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    VENV_ACTIVATE="venv/Scripts/activate"
    PYTHON_CMD="python"
else
    VENV_ACTIVATE="venv/bin/activate"
    PYTHON_CMD="python3"
fi

if [ -d "venv" ]; then
    source "$VENV_ACTIVATE"
else
    echo "Error: Virtual environment not found. Please run setup.sh first."
    exit 1
fi

if [[ ! "$OSTYPE" == "msys" && ! "$OSTYPE" == "cygwin" && ! "$OSTYPE" == "win32" ]]; then
    mkdir -p /home/msuser/nginx-configs 2>/dev/null || true
    mkdir -p /home/msuser/nginx-templates 2>/dev/null || true
    mkdir -p /var/www/certbot/.well-known/acme-challenge 2>/dev/null || true
fi

exec "$PYTHON_CMD" main.py
