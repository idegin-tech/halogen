#!/bin/bash

cd "$(dirname "$0")" || exit

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    VENV_ACTIVATE="venv/Scripts/activate"
else
    VENV_ACTIVATE="venv/bin/activate"
fi

if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source "$VENV_ACTIVATE"
else
    echo "Error: Virtual environment not found. Please run setup.sh first."
    exit 1
fi

if ! command -v uvicorn &> /dev/null; then
    echo "Error: uvicorn is not installed. Please run setup.sh first."
    exit 1
fi

echo "Starting Halogen Sudo API server in development mode..."
uvicorn main:app --host 0.0.0.0 --port 8082 --reload
