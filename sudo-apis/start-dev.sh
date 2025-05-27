#!/bin/bash
# Start the Python API server directly (not using PM2)

# Navigate to sudo-apis directory
cd "$(dirname "$0")" || exit

# Detect OS for appropriate commands
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    VENV_ACTIVATE="venv/Scripts/activate"
else
    VENV_ACTIVATE="venv/bin/activate"
fi

# Activate the virtual environment
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source "$VENV_ACTIVATE"
else
    echo "Error: Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Make sure uvicorn is available
if ! command -v uvicorn &> /dev/null; then
    echo "Error: uvicorn is not installed. Please run setup.sh first."
    exit 1
fi

# Start the server
echo "Starting Halogen Sudo API server in development mode..."
uvicorn main:app --host 0.0.0.0 --port 8082 --reload
