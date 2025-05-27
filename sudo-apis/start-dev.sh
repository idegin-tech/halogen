#!/bin/bash
# Start the Python API server directly (not using PM2)

# Navigate to sudo-apis directory
cd "$(dirname "$0")" || exit

# Make sure uvicorn is available
if ! command -v uvicorn &> /dev/null; then
    echo "Error: uvicorn is not installed. Please run setup.sh first."
    exit 1
fi

# Start the server
echo "Starting Halogen Sudo API server..."
uvicorn main:app --host 0.0.0.0 --port 8082 --reload
