#!/bin/bash

# Halogen Fly.io Deployment Script
# This script ensures deployment runs from the correct directory

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Change to the root directory of the project
cd "$SCRIPT_DIR"

echo "🚀 Starting Fly.io deployment for Halogen..."
echo "📁 Current directory: $(pwd)"

# Verify Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found in current directory"
    echo "📂 Directory contents:"
    ls -la
    exit 1
fi

echo "✅ Dockerfile found"

# Verify fly.toml exists
if [ ! -f "fly.toml" ]; then
    echo "❌ Error: fly.toml not found in current directory"
    exit 1
fi

echo "✅ fly.toml found"

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Error: flyctl is not installed"
    echo "Please install flyctl: https://fly.io/docs/getting-started/installing-flyctl/"
    exit 1
fi

echo "✅ flyctl is installed"

# Login check
echo "🔐 Checking Fly.io authentication..."
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io"
    echo "Please run: flyctl auth login"
    exit 1
fi

echo "✅ Authenticated with Fly.io"

# Build and deploy
echo "🏗️  Building and deploying to Fly.io..."
flyctl deploy --ha=false

echo "🎉 Deployment completed successfully!"
echo "🌐 Your app should be available at: https://halogen-multi-service.fly.dev"

# Optional: Show app status
echo ""
echo "📊 App status:"
flyctl status